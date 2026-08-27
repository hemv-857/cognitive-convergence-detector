"""Compute rolling Pearson and Spearman correlations between manager pairs."""

import logging

import numpy as np
import pandas as pd
from scipy import stats

logger = logging.getLogger(__name__)


def compute_rolling_correlations(
    signals_df: pd.DataFrame,
    window: int = 30,
    min_periods: int = 20,
) -> pd.DataFrame:
    """Compute pairwise rolling correlations for all manager pairs.

    Returns DataFrame with columns:
        date, manager_a, manager_b, asset_class, correlation, p_value, n_obs
    """
    results = []
    managers = signals_df["manager_id"].unique()
    asset_classes = signals_df["signal_id"].unique()

    for asset_class in asset_classes:
        ac_data = signals_df[signals_df["signal_id"] == asset_class]
        pivot = ac_data.pivot_table(
            index="date", columns="manager_id", values="value"
        )
        pivot = pivot.sort_index()

        for i, m_a in enumerate(managers):
            for m_b in managers[i + 1:]:
                if m_a not in pivot.columns or m_b not in pivot.columns:
                    continue
                series_a = pivot[m_a]
                series_b = pivot[m_b]

                rolling_corr = series_a.rolling(window, min_periods=min_periods).corr(series_b)

                for date, corr_val in rolling_corr.items():
                    if pd.isna(corr_val):
                        continue
                    n = min_periods
                    # Compute p-value via t-test
                    if abs(corr_val) < 1.0 and n > 2:
                        t_stat = corr_val * np.sqrt((n - 2) / (1 - corr_val**2))
                        p_val = 2 * (1 - stats.t.cdf(abs(t_stat), df=n - 2))
                    else:
                        p_val = 0.0

                    results.append({
                        "date": date.to_pydatetime(),
                        "manager_a": m_a,
                        "manager_b": m_b,
                        "asset_class": asset_class,
                        "correlation": float(corr_val),
                        "p_value": float(p_val),
                        "n_obs": n,
                        "window_days": window,
                    })

    df = pd.DataFrame(results)
    logger.info(f"Computed {len(df)} correlation observations across {len(managers)} managers")
    return df


def compute_baseline(
    signals_df: pd.DataFrame,
    lookback: int = 252,
) -> dict[tuple[str, str, str], tuple[float, float]]:
    """Compute historical baseline (mean, std) for each manager pair + asset class.

    Returns: {(manager_a, manager_b, asset_class): (mean, std)}
    """
    baseline = {}
    managers = signals_df["manager_id"].unique()
    asset_classes = signals_df["signal_id"].unique()

    for asset_class in asset_classes:
        ac_data = signals_df[signals_df["signal_id"] == asset_class]
        pivot = ac_data.pivot_table(
            index="date", columns="manager_id", values="value"
        ).sort_index()

        for i, m_a in enumerate(managers):
            for m_b in managers[i + 1:]:
                if m_a not in pivot.columns or m_b not in pivot.columns:
                    continue
                corr_series = pivot[m_a].rolling(30, min_periods=20).corr(pivot[m_b]).dropna()
                if len(corr_series) >= 20:
                    baseline[(m_a, m_b, asset_class)] = (
                        float(corr_series.mean()),
                        float(corr_series.std()),
                    )

    logger.info(f"Computed baselines for {len(baseline)} pairs")
    return baseline
