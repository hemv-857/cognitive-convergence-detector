"""Daily pipeline: fetch → normalize → correlate → detect → alert."""

import logging
from datetime import datetime

import pandas as pd

from app.alerts.router import route_alert_sync
from app.config import settings
from app.database import SessionLocal
from app.ingestion.market_data import fetch_manager_signals
from app.models import Alert, Baseline, CorrelationMatrix, Signal
from app.stats.convergence import detect_convergence
from app.stats.correlation import compute_baseline, compute_rolling_correlations
from app.stats.normalizer import normalize_signals

logger = logging.getLogger(__name__)


def execute_pipeline():
    """Run the full daily pipeline."""
    logger.info("Starting daily pipeline")
    db = SessionLocal()

    try:
        # 1. Fetch data
        raw_df = fetch_manager_signals()
        if raw_df.empty:
            logger.warning("No data fetched, aborting pipeline")
            return

        # 2. Normalize
        normalized_df = normalize_signals(raw_df)

        # 3. Store normalized signals
        for _, row in normalized_df.iterrows():
            db.merge(Signal(
                time=row["date"],
                manager_id=row["manager_id"],
                signal_id=row["signal_id"],
                value=row["value"],
                z_score=row.get("z_score"),
                data_source=row.get("data_source", "yfinance"),
            ))
        db.commit()

        # 4. Compute correlations
        corr_df = compute_rolling_correlations(
            normalized_df, window=settings.CORRELATION_WINDOW
        )

        # 5. Store correlations (all dates for history)
        for _, row in corr_df.iterrows():
            db.merge(CorrelationMatrix(
                time=row["date"],
                manager_a=row["manager_a"],
                manager_b=row["manager_b"],
                asset_class=row["asset_class"],
                correlation=row["correlation"],
                p_value=row["p_value"],
                n_obs=row["n_obs"],
                window_days=row["window_days"],
            ))
        db.commit()

        # Also store latest date correlations separately for current view
        latest_date = corr_df["date"].max()
        latest_corr = corr_df[corr_df["date"] == latest_date]

        # 6. Compute/update baselines
        baselines = compute_baseline(normalized_df, lookback=settings.BASELINE_LOOKBACK)
        for (m_a, m_b, ac), (mean, std) in baselines.items():
            db.merge(Baseline(
                manager_a=m_a,
                manager_b=m_b,
                asset_class=ac,
                baseline_mean=mean,
                baseline_std=std,
                lookback_days=settings.BASELINE_LOOKBACK,
                computed_date=datetime.utcnow(),
            ))
        db.commit()

        # 7. Detect convergence
        today_corrs = {
            (row["manager_a"], row["manager_b"], row["asset_class"]): row["correlation"]
            for _, row in latest_corr.iterrows()
        }
        convergence_alerts = detect_convergence(
            today_corrs, baselines,
            level1_threshold=settings.ALERT_LEVEL1_THRESHOLD,
            level2_pairs_pct=settings.ALERT_LEVEL2_PAIRS_PCT,
            level3_percentile=settings.ALERT_LEVEL3_PERCENTILE,
        )

        # 8. Store and route alerts
        for alert_data in convergence_alerts:
            alert = Alert(
                created_at=datetime.utcnow(),
                alert_type=alert_data["type"],
                severity=alert_data["severity"],
                manager_a=alert_data.get("manager_a"),
                manager_b=alert_data.get("manager_b"),
                asset_class=alert_data.get("asset_class"),
                correlation=alert_data.get("correlation"),
                z_score=alert_data.get("z_score"),
                message=alert_data.get("message"),
            )
            db.add(alert)
            db.commit()

            route_alert_sync(alert_data)

        logger.info(f"Pipeline complete: {len(convergence_alerts)} alerts generated")

    except Exception as e:
        logger.error(f"Pipeline error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def recompute_all_baselines():
    """Recompute all historical baselines (weekly task)."""
    db = SessionLocal()
    try:
        signals = db.query(Signal).all()
        if not signals:
            return

        df = pd.DataFrame([{
            "manager_id": s.manager_id,
            "signal_id": s.signal_id,
            "date": s.time,
            "value": s.value,
        } for s in signals])

        baselines = compute_baseline(df, lookback=settings.BASELINE_LOOKBACK)
        for (m_a, m_b, ac), (mean, std) in baselines.items():
            db.merge(Baseline(
                manager_a=m_a,
                manager_b=m_b,
                asset_class=ac,
                baseline_mean=mean,
                baseline_std=std,
                lookback_days=settings.BASELINE_LOOKBACK,
                computed_date=datetime.utcnow(),
            ))
        db.commit()
        logger.info(f"Recomputed baselines for {len(baselines)} pairs")
    finally:
        db.close()
