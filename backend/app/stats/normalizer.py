"""Signal normalization: z-score within each manager+signal group."""

import logging

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


def normalize_signals(
    df: pd.DataFrame,
    rolling_window: int = 252,
    min_periods: int = 20,
) -> pd.DataFrame:
    """Compute rolling z-scores for each manager-signal pair."""
    df = df.sort_values(["manager_id", "signal_id", "date"]).copy()

    groups = df.groupby(["manager_id", "signal_id"])
    z_scores = []
    outlier_flags = []
    for _, group in groups:
        v = group["value"]
        rolling_mean = v.rolling(rolling_window, min_periods=min_periods).mean()
        rolling_std = v.rolling(rolling_window, min_periods=min_periods).std()
        z = (v - rolling_mean) / (rolling_std + 1e-10)
        z_scores.append(z)
        outlier_flags.append(np.abs(z) > 4.0)

    result = df.copy()
    result["z_score"] = pd.concat(z_scores).values
    result["outlier_flag"] = pd.concat(outlier_flags).values

    n_outliers = int(result["outlier_flag"].sum())
    logger.info(f"Normalized {len(result)} signals, {n_outliers} outliers detected")
    return result
