"""FastAPI application for Cognitive Convergence Detector."""

import csv
import io
import json
import logging
import os
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.models import Alert, Baseline, CorrelationMatrix, Signal
from app.schemas import (
    AlertResponse,
    BaselineResponse,
    ConvergenceSnapshot,
    CorrelationResponse,
)

logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)


def run_pipeline_background():
    """Run pipeline in background thread."""
    try:
        from app.tasks.pipeline import execute_pipeline
        logger.info("Auto-running pipeline on startup...")
        execute_pipeline()
        logger.info("Startup pipeline complete")
    except Exception as e:
        logger.error(f"Startup pipeline failed: {e}")


def start_scheduler():
    """Background scheduler to refresh data every hour."""
    def _loop():
        while True:
            time.sleep(3600)
            try:
                from app.tasks.pipeline import execute_pipeline
                logger.info("Scheduled pipeline run starting...")
                execute_pipeline()
                logger.info("Scheduled pipeline complete")
            except Exception as e:
                logger.error(f"Scheduled pipeline failed: {e}")
    t = threading.Thread(target=_loop, daemon=True)
    t.start()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    t = threading.Thread(target=run_pipeline_background, daemon=True)
    t.start()
    start_scheduler()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="Cognitive Convergence Detector",
    description="Measures institutional trading signal correlation and detects convergence events",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/v1/convergence/current", response_model=ConvergenceSnapshot)
def get_current_convergence(
    asset_class: str = Query("equities", description="Filter by asset class"),
    db: Session = Depends(get_db),
):
    """Latest correlation matrix and severity index."""
    cutoff = datetime.utcnow() - timedelta(hours=24)
    correlations = (
        db.query(CorrelationMatrix)
        .filter(CorrelationMatrix.time >= cutoff)
        .filter(CorrelationMatrix.asset_class == asset_class)
        .order_by(desc(CorrelationMatrix.time))
        .all()
    )
    alerts = (
        db.query(Alert)
        .filter(Alert.created_at >= cutoff)
        .order_by(desc(Alert.created_at))
        .all()
    )

    avg_corr = (
        sum(c.correlation or 0 for c in correlations) / len(correlations)
        if correlations else 0
    )
    severity_index = min(100, max(0, avg_corr * 100))

    return ConvergenceSnapshot(
        date=datetime.utcnow(),
        asset_class=asset_class,
        severity_index=round(severity_index, 1),
        pair_correlations=[
            CorrelationResponse(
                manager_a=c.manager_a,
                manager_b=c.manager_b,
                asset_class=c.asset_class,
                correlation=c.correlation,
                p_value=c.p_value,
                date=c.time,
            )
            for c in correlations
        ],
        alerts_today=[
            AlertResponse.model_validate(a) for a in alerts
        ],
    )


@app.get("/api/v1/alerts/recent", response_model=list[AlertResponse])
def get_recent_alerts(
    severity: str | None = Query(None, description="Filter by severity"),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Last N alerts, optionally filtered by severity."""
    q = db.query(Alert).order_by(desc(Alert.created_at))
    if severity:
        q = q.filter(Alert.severity == severity)
    return [AlertResponse.model_validate(a) for a in q.limit(limit).all()]


@app.post("/api/v1/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    """Mark alert as acknowledged."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return {"error": "Alert not found"}
    alert.acknowledged = 1
    db.commit()
    return {"status": "acknowledged", "alert_id": alert_id}


@app.get("/api/v1/correlations/matrix")
def get_correlation_matrix(
    asset_class: str = Query("equities"),
    date: str | None = Query(None, description="YYYY-MM-DD, defaults to latest"),
    db: Session = Depends(get_db),
):
    """Correlation pairs as a flat array for frontend consumption."""
    q = db.query(CorrelationMatrix).filter(
        CorrelationMatrix.asset_class == asset_class
    )
    if date:
        target = datetime.strptime(date, "%Y-%m-%d")
        q = q.filter(CorrelationMatrix.time == target)
    else:
        latest = db.query(CorrelationMatrix.time).filter(
            CorrelationMatrix.asset_class == asset_class
        ).order_by(desc(CorrelationMatrix.time)).first()
        if latest:
            q = q.filter(CorrelationMatrix.time == latest[0])
        else:
            q = q.order_by(desc(CorrelationMatrix.time)).limit(1)

    rows = q.all()
    return [
        {
            "manager_a": r.manager_a,
            "manager_b": r.manager_b,
            "correlation": r.correlation,
            "p_value": r.p_value,
            "n_obs": r.n_obs,
            "date": r.time.isoformat(),
            "asset_class": asset_class,
        }
        for r in rows
    ]


@app.get("/api/v1/baselines", response_model=list[BaselineResponse])
def get_baselines(
    asset_class: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Historical baseline correlations."""
    q = db.query(Baseline)
    if asset_class:
        q = q.filter(Baseline.asset_class == asset_class)
    return [BaselineResponse.model_validate(b) for b in q.all()]


@app.get("/api/v1/signals/latest")
def get_latest_signals(
    manager_id: str | None = Query(None),
    signal_id: str | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Latest normalized signals."""
    q = db.query(Signal).order_by(desc(Signal.time))
    if manager_id:
        q = q.filter(Signal.manager_id == manager_id)
    if signal_id:
        q = q.filter(Signal.signal_id == signal_id)
    signals = q.limit(limit).all()
    return [
        {
            "manager_id": s.manager_id,
            "signal_id": s.signal_id,
            "date": s.time.isoformat(),
            "value": s.value,
            "z_score": s.z_score,
        }
        for s in signals
    ]


@app.get("/api/v1/managers")
def list_managers(db: Session = Depends(get_db)):
    """List all managers in the system."""
    from sqlalchemy import distinct
    managers = db.query(distinct(Signal.manager_id)).all()
    return {"managers": [m[0] for m in managers]}


@app.get("/api/v1/signals/history")
def get_signal_history(
    manager_id: str = Query(...),
    signal_id: str = Query(...),
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """Time-series signal data for charts."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    signals = (
        db.query(Signal)
        .filter(Signal.manager_id == manager_id)
        .filter(Signal.signal_id == signal_id)
        .filter(Signal.time >= cutoff)
        .order_by(Signal.time)
        .all()
    )
    return [
        {"date": s.time.isoformat(), "value": s.value, "z_score": s.z_score}
        for s in signals
    ]


@app.get("/api/v1/correlations/history")
def get_correlation_history(
    manager_a: str = Query(...),
    manager_b: str = Query(...),
    asset_class: str = Query("equities"),
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """Rolling correlation time-series for a specific pair."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(CorrelationMatrix)
        .filter(CorrelationMatrix.asset_class == asset_class)
        .filter(CorrelationMatrix.time >= cutoff)
        .filter(
            ((CorrelationMatrix.manager_a == manager_a) & (CorrelationMatrix.manager_b == manager_b))
            | ((CorrelationMatrix.manager_a == manager_b) & (CorrelationMatrix.manager_b == manager_a))
        )
        .order_by(CorrelationMatrix.time)
        .all()
    )
    return [
        {"date": r.time.isoformat(), "correlation": r.correlation, "p_value": r.p_value}
        for r in rows
    ]


@app.get("/api/v1/indicators/{manager_id}/{signal_id}")
def get_indicators(
    manager_id: str,
    signal_id: str,
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """Technical indicators for a manager+signal time series."""
    import pandas as pd

    from app.stats.indicators import compute_indicators_for_manager

    cutoff = datetime.utcnow() - timedelta(days=days)
    signals = (
        db.query(Signal)
        .filter(Signal.manager_id == manager_id)
        .filter(Signal.signal_id == signal_id)
        .filter(Signal.time >= cutoff)
        .order_by(Signal.time)
        .all()
    )
    if not signals:
        return []

    df = pd.DataFrame([{
        "date": s.time,
        "value": s.value,
        "z_score": s.z_score,
        "manager_id": s.manager_id,
        "signal_id": s.signal_id,
    } for s in signals])

    return compute_indicators_for_manager(df, manager_id, signal_id)


@app.get("/api/v1/correlations/regime/{asset_class}")
def get_correlation_regime(
    asset_class: str,
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """Correlation regime detection: high/low/normal based on historical percentiles."""
    import pandas as pd

    cutoff = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(CorrelationMatrix)
        .filter(CorrelationMatrix.asset_class == asset_class)
        .filter(CorrelationMatrix.time >= cutoff)
        .order_by(CorrelationMatrix.time)
        .all()
    )
    if not rows:
        return []

    df = pd.DataFrame([{
        "date": r.time,
        "correlation": r.correlation,
        "manager_a": r.manager_a,
        "manager_b": r.manager_b,
    } for r in rows])

    daily = df.groupby("date")["correlation"].agg(["mean", "std", "count"]).reset_index()
    daily = daily.sort_values("date")

    if len(daily) < 10:
        return []

    mean_corr = daily["mean"]
    p25 = mean_corr.quantile(0.25)
    p75 = mean_corr.quantile(0.75)

    result = []
    for _, row in daily.iterrows():
        m = row["mean"]
        if m >= p75:
            regime = "high"
        elif m <= p25:
            regime = "low"
        else:
            regime = "normal"
        result.append({
            "date": row["date"].isoformat(),
            "mean_correlation": round(float(m), 4),
            "std": round(float(row["std"]) if not pd.isna(row["std"]) else 0, 4),
            "pair_count": int(row["count"]),
            "regime": regime,
            "percentile_25": round(float(p25), 4),
            "percentile_75": round(float(p75), 4),
        })

    return result


@app.get("/api/v1/stats/summary")
def get_stats_summary(db: Session = Depends(get_db)):
    """System-wide statistics."""
    from sqlalchemy import distinct, func

    total_signals = db.query(func.count(Signal.id)).scalar() if hasattr(Signal, 'id') else db.query(Signal).count()
    total_alerts = db.query(Alert).count()
    total_managers = db.query(func.count(distinct(Signal.manager_id))).scalar()
    cutoff = datetime.utcnow() - timedelta(hours=24)
    total_pairs = db.query(CorrelationMatrix).filter(CorrelationMatrix.time >= cutoff).count()

    critical = db.query(Alert).filter(Alert.severity == "critical").count()
    high = db.query(Alert).filter(Alert.severity == "high").count()
    warning = db.query(Alert).filter(Alert.severity == "warning").count()

    return {
        "total_signals": total_signals,
        "total_alerts": total_alerts,
        "total_managers": total_managers,
        "active_pairs_24h": total_pairs,
        "alerts_by_severity": {"critical": critical, "high": high, "warning": warning},
    }


@app.post("/api/v1/seed")
def seed_data():
    """Seed database with demo data via pipeline (run once)."""
    from app.tasks.pipeline import execute_pipeline
    try:
        execute_pipeline()
        return {"status": "ok", "message": "Pipeline executed"}
    except Exception as e:
        logger.error(f"Seed failed: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/api/v1/asset-classes")
def list_asset_classes(db: Session = Depends(get_db)):
    """List available asset classes."""
    from sqlalchemy import distinct
    classes = db.query(distinct(CorrelationMatrix.asset_class)).all()
    return {"asset_classes": [c[0] for c in classes]}


@app.get("/api/v1/export/alerts")
def export_alerts(
    severity: str | None = Query(None),
    fmt: str = Query("csv", regex="^(csv|json)$"),
    db: Session = Depends(get_db),
):
    """Export alerts as CSV or JSON."""
    q = db.query(Alert).order_by(desc(Alert.created_at))
    if severity:
        q = q.filter(Alert.severity == severity)
    alerts = q.all()

    if fmt == "json":
        return [AlertResponse.model_validate(a).model_dump() for a in alerts]

    output = io.StringIO()
    writer = csv.writer(output)
    headers = ["id", "created_at", "alert_type", "severity", "manager_a",
               "manager_b", "asset_class", "correlation", "z_score", "message"]
    writer.writerow(headers)
    for a in alerts:
        writer.writerow([a.id, a.created_at, a.alert_type, a.severity,
                         a.manager_a, a.manager_b, a.asset_class,
                         a.correlation, a.z_score, a.message])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=alerts_{datetime.utcnow().strftime('%Y%m%d')}.csv"},
    )


@app.get("/api/v1/export/correlations")
def export_correlations(
    asset_class: str = Query("equities"),
    fmt: str = Query("csv", regex="^(csv|json)$"),
    db: Session = Depends(get_db),
):
    """Export correlation matrix as CSV or JSON."""
    rows = (
        db.query(CorrelationMatrix)
        .filter(CorrelationMatrix.asset_class == asset_class)
        .order_by(desc(CorrelationMatrix.time))
        .limit(500)
        .all()
    )

    if fmt == "json":
        return [
            {"date": r.time.isoformat(), "manager_a": r.manager_a, "manager_b": r.manager_b,
             "correlation": r.correlation, "p_value": r.p_value, "n_obs": r.n_obs}
            for r in rows
        ]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["date", "manager_a", "manager_b", "correlation", "p_value", "n_obs"])
    for r in rows:
        writer.writerow([r.time.isoformat(), r.manager_a, r.manager_b,
                         r.correlation, r.p_value, r.n_obs])
    output.seek(0)
    filename = f"correlations_{asset_class}_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


class UpdateSettings(BaseModel):
    level1_threshold: float | None = None
    level2_pairs_pct: float | None = None
    level3_percentile: float | None = None
    correlation_window: int | None = None


SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "..", "settings.json")


def load_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE) as f:
            return json.load(f)
    return {}


def save_settings(data):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f, indent=2)


@app.get("/api/v1/settings")
def get_settings():
    """Get current detection thresholds."""
    saved = load_settings()
    return {
        "level1_threshold": saved.get("level1_threshold", settings.ALERT_LEVEL1_THRESHOLD),
        "level2_pairs_pct": saved.get("level2_pairs_pct", settings.ALERT_LEVEL2_PAIRS_PCT),
        "level3_percentile": saved.get("level3_percentile", settings.ALERT_LEVEL3_PERCENTILE),
        "correlation_window": saved.get("correlation_window", settings.CORRELATION_WINDOW),
    }


@app.post("/api/v1/settings")
def update_settings(body: UpdateSettings):
    """Update detection thresholds."""
    saved = load_settings()
    updates = body.model_dump(exclude_none=True)
    saved.update(updates)
    save_settings(saved)
    return {"status": "ok", "settings": get_settings()}


@app.get("/api/v1/health/detailed")
def detailed_health(db: Session = Depends(get_db)):
    """System health check with DB stats."""
    from sqlalchemy import distinct, func
    start = time.time()

    total_signals = db.query(Signal).count()
    total_alerts = db.query(Alert).count()
    total_managers = db.query(func.count(distinct(Signal.manager_id))).scalar()
    total_correlations = db.query(CorrelationMatrix).count()

    last_signal = db.query(Signal).order_by(desc(Signal.time)).first()
    last_alert = db.query(Alert).order_by(desc(Alert.created_at)).first()

    db_url = settings.DATABASE_URL
    db_size = 0
    db_type = "unknown"
    if db_url.startswith("sqlite"):
        db_path = db_url.replace("sqlite:///", "")
        db_size = os.path.getsize(db_path) if os.path.exists(db_path) else 0
        db_type = "sqlite"
    else:
        db_type = "postgresql"

    latency_ms = round((time.time() - start) * 1000, 2)

    return {
        "status": "ok",
        "latency_ms": latency_ms,
        "database": {
            "type": db_type,
            "size_bytes": db_size,
            "size_human": f"{db_size / 1024 / 1024:.2f} MB" if db_size else "N/A",
        },
        "counts": {
            "signals": total_signals,
            "alerts": total_alerts,
            "managers": total_managers,
            "correlations": total_correlations,
        },
        "last_signal": last_signal.time.isoformat() if last_signal else None,
        "last_alert": last_alert.created_at.isoformat() if last_alert else None,
        "data_source": "yfinance (live)",
        "auto_refresh": "every 60 minutes",
        "uptime": "running",
    }


@app.post("/api/v1/pipeline/run")
def trigger_pipeline():
    """Manually trigger pipeline run."""
    from app.tasks.pipeline import execute_pipeline
    try:
        execute_pipeline()
        return {"status": "ok", "message": "Pipeline completed"}
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/api/v1/stats/managers")
def per_manager_stats(db: Session = Depends(get_db)):
    """Per-manager signal statistics."""
    from sqlalchemy import distinct
    managers = [m[0] for m in db.query(distinct(Signal.manager_id)).all()]
    result = []
    for m in managers:
        signals = db.query(Signal).filter(Signal.manager_id == m).all()
        if not signals:
            continue
        vals = [s.value for s in signals]
        avg = sum(vals) / len(vals)
        variance = sum((v - avg) ** 2 for v in vals) / len(vals)
        outliers = sum(1 for s in signals if s.z_score is not None and abs(s.z_score) > 2)
        result.append({
            "manager_id": m,
            "count": len(signals),
            "avg": round(avg, 3),
            "std": round(variance ** 0.5, 3),
            "outliers": outliers,
            "last_signal": signals[-1].time.isoformat() if signals else None,
        })
    return {"managers": result}


@app.get("/api/v1/stats/correlation-summary")
def correlation_summary(
    asset_class: str = Query("equities"),
    db: Session = Depends(get_db),
):
    """Summary statistics for correlations."""
    rows = db.query(CorrelationMatrix).filter(
        CorrelationMatrix.asset_class == asset_class
    ).all()
    if not rows:
        return {"asset_class": asset_class, "count": 0, "avg": 0, "median": 0, "min": 0, "max": 0, "std": 0}
    vals = sorted([r.correlation for r in rows])
    n = len(vals)
    avg = sum(vals) / n
    variance = sum((v - avg) ** 2 for v in vals) / n
    median = vals[n // 2] if n % 2 else (vals[n // 2 - 1] + vals[n // 2]) / 2
    high = sum(1 for v in vals if v > 0.6)
    medium = sum(1 for v in vals if 0.3 < v <= 0.6)
    low = sum(1 for v in vals if v <= 0.3)
    return {
        "asset_class": asset_class,
        "count": n,
        "avg": round(avg, 4),
        "median": round(median, 4),
        "min": round(min(vals), 4),
        "max": round(max(vals), 4),
        "std": round(variance ** 0.5, 4),
        "distribution": {"high": high, "medium": medium, "low": low},
    }
