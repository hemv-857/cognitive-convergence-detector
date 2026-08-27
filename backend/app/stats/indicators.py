"""Technical indicators: SMA, EMA, Bollinger, RSI, MACD, Stochastic, ADX,
Ichimoku, Williams %R, CCI, ROC, Keltner, Sortino, VaR."""

import logging

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def sma(series: pd.Series, window: int) -> pd.Series:
    return series.rolling(window, min_periods=1).mean()


def ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()


def bollinger_bands(series: pd.Series, window: int = 20, num_std: float = 2.0):
    mid = sma(series, window)
    std = series.rolling(window, min_periods=1).std()
    return mid, mid + num_std * std, mid - num_std * std


def rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = (-delta).clip(lower=0)
    avg_gain = gain.ewm(alpha=1 / period, min_periods=period).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period).mean()
    rs = avg_gain / (avg_loss + 1e-10)
    return 100 - (100 / (1 + rs))


def macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    ema_fast = ema(series, fast)
    ema_slow = ema(series, slow)
    macd_line = ema_fast - ema_slow
    signal_line = ema(macd_line, signal)
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def stochastic(series: pd.Series, k_period: int = 14, d_period: int = 3):
    low_min = series.rolling(k_period, min_periods=1).min()
    high_max = series.rolling(k_period, min_periods=1).max()
    k = 100 * (series - low_min) / (high_max - low_min + 1e-10)
    d = sma(k, d_period)
    return k, d


def adx(series: pd.Series, period: int = 14) -> pd.Series:
    high = series
    low = series
    plus_dm = high.diff().clip(lower=0)
    minus_dm = (-low.diff()).clip(lower=0)
    tr = high - low
    atr = tr.ewm(alpha=1 / period, min_periods=period).mean()
    plus_di = 100 * (plus_dm.ewm(alpha=1 / period, min_periods=period).mean() / (atr + 1e-10))
    minus_di = 100 * (minus_dm.ewm(alpha=1 / period, min_periods=period).mean() / (atr + 1e-10))
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di + 1e-10)
    return dx.ewm(alpha=1 / period, min_periods=period).mean()


def ichimoku(series: pd.Series, tenkan: int = 9, kijun: int = 26, senkou_b: int = 52):
    tenkan_sen = (series.rolling(tenkan, min_periods=1).max() + series.rolling(tenkan, min_periods=1).min()) / 2
    kijun_sen = (series.rolling(kijun, min_periods=1).max() + series.rolling(kijun, min_periods=1).min()) / 2
    senkou_a = ((tenkan_sen + kijun_sen) / 2).shift(kijun)
    sb_max = series.rolling(senkou_b, min_periods=1).max()
    sb_min = series.rolling(senkou_b, min_periods=1).min()
    senkou_b_line = ((sb_max + sb_min) / 2).shift(kijun)
    chikou = series.shift(-kijun)
    return tenkan_sen, kijun_sen, senkou_a, senkou_b_line, chikou


def williams_r(series: pd.Series, period: int = 14) -> pd.Series:
    high_max = series.rolling(period, min_periods=1).max()
    low_min = series.rolling(period, min_periods=1).min()
    return -100 * (high_max - series) / (high_max - low_min + 1e-10)


def cci(series: pd.Series, period: int = 20) -> pd.Series:
    tp = series
    sma_tp = sma(tp, period)
    mad = tp.rolling(period, min_periods=1).apply(lambda x: np.abs(x - x.mean()).mean(), raw=True)
    return (tp - sma_tp) / (0.015 * mad + 1e-10)


def roc(series: pd.Series, period: int = 12) -> pd.Series:
    return (series - series.shift(period)) / (series.shift(period) + 1e-10) * 100


def keltner_channels(series: pd.Series, ema_period: int = 20, atr_period: int = 10, multiplier: float = 2.0):
    mid = ema(series, ema_period)
    tr = series.diff().abs()
    atr = tr.ewm(alpha=1 / atr_period, min_periods=atr_period).mean()
    return mid, mid + multiplier * atr, mid - multiplier * atr


def volatility(series: pd.Series, window: int = 20) -> pd.Series:
    return series.rolling(window, min_periods=1).std()


def drawdown(series: pd.Series) -> pd.Series:
    peak = series.cummax()
    return (series - peak) / (peak + 1e-10)


def max_drawdown_duration(series: pd.Series) -> pd.Series:
    peak = series.cummax()
    in_dd = series < peak
    groups = (~in_dd).cumsum()
    durations = in_dd.groupby(groups).cumsum()
    return durations


def sharpe_ratio(series: pd.Series, window: int = 20, rf: float = 0.0) -> pd.Series:
    returns = series.pct_change()
    rolling_mean = returns.rolling(window, min_periods=1).mean()
    rolling_std = returns.rolling(window, min_periods=1).std()
    return (rolling_mean - rf) / (rolling_std + 1e-10) * np.sqrt(252)


def sortino_ratio(series: pd.Series, window: int = 20, rf: float = 0.0) -> pd.Series:
    returns = series.pct_change()
    rolling_mean = returns.rolling(window, min_periods=1).mean()
    downside = returns.clip(upper=0)
    downside_std = downside.rolling(window, min_periods=1).std()
    return (rolling_mean - rf) / (downside_std + 1e-10) * np.sqrt(252)


def value_at_risk(series: pd.Series, window: int = 20, confidence: float = 0.95) -> pd.Series:
    returns = series.pct_change()
    return returns.rolling(window, min_periods=1).quantile(1 - confidence)


def compute_indicators(values: pd.Series) -> dict[str, list]:
    """Compute all indicators on a signal value series."""
    v = values.astype(float)

    sma5 = sma(v, 5)
    sma10 = sma(v, 10)
    sma20 = sma(v, 20)
    ema12 = ema(v, 12)
    ema26 = ema(v, 26)
    bb_mid, bb_upper, bb_lower = bollinger_bands(v, 20, 2.0)
    rsi14 = rsi(v, 14)
    macd_line, macd_signal, macd_hist = macd(v)
    stoch_k, stoch_d = stochastic(v)
    adx14 = adx(v)
    tenkan, kijun, senkou_a, senkou_b, chikou = ichimoku(v)
    wr = williams_r(v)
    cci20 = cci(v)
    roc12 = roc(v)
    kelt_mid, kelt_upper, kelt_lower = keltner_channels(v)
    vol20 = volatility(v, 20)
    dd = drawdown(v)
    dd_duration = max_drawdown_duration(v)
    sharpe = sharpe_ratio(v)
    sortino = sortino_ratio(v)
    var95 = value_at_risk(v)

    return {
        "sma_5": sma5.tolist(),
        "sma_10": sma10.tolist(),
        "sma_20": sma20.tolist(),
        "ema_12": ema12.tolist(),
        "ema_26": ema26.tolist(),
        "bb_upper": bb_upper.tolist(),
        "bb_mid": bb_mid.tolist(),
        "bb_lower": bb_lower.tolist(),
        "rsi_14": rsi14.tolist(),
        "macd_line": macd_line.tolist(),
        "macd_signal": macd_signal.tolist(),
        "macd_histogram": macd_hist.tolist(),
        "stoch_k": stoch_k.tolist(),
        "stoch_d": stoch_d.tolist(),
        "adx": adx14.tolist(),
        "tenkan_sen": tenkan.tolist(),
        "kijun_sen": kijun.tolist(),
        "senkou_a": [float(x) if not pd.isna(x) else None for x in senkou_a],
        "senkou_b": [float(x) if not pd.isna(x) else None for x in senkou_b],
        "williams_r": wr.tolist(),
        "cci": cci20.tolist(),
        "roc": roc12.tolist(),
        "keltner_mid": kelt_mid.tolist(),
        "keltner_upper": kelt_upper.tolist(),
        "keltner_lower": kelt_lower.tolist(),
        "volatility_20": vol20.tolist(),
        "drawdown": dd.tolist(),
        "drawdown_duration": dd_duration.tolist(),
        "sharpe_20": sharpe.tolist(),
        "sortino_20": sortino.tolist(),
        "var_95": var95.tolist(),
    }


def compute_indicators_for_manager(
    signals_df: pd.DataFrame,
    manager_id: str,
    signal_id: str,
) -> list[dict]:
    """Compute indicators for a specific manager+signal, return as time series."""
    subset = signals_df[
        (signals_df["manager_id"] == manager_id) & (signals_df["signal_id"] == signal_id)
    ].sort_values("date")

    if subset.empty:
        return []

    values = subset["value"].reset_index(drop=True)
    dates = subset["date"].reset_index(drop=True)
    if "z_score" in subset.columns:
        z_scores = subset["z_score"].reset_index(drop=True)
    else:
        z_scores = pd.Series([None] * len(subset))

    indicators = compute_indicators(values)

    result = []
    for i in range(len(subset)):
        row = {
            "date": dates.iloc[i].isoformat() if hasattr(dates.iloc[i], "isoformat") else str(dates.iloc[i]),
            "value": float(values.iloc[i]),
            "z_score": float(z_scores.iloc[i]) if not pd.isna(z_scores.iloc[i]) else None,
        }
        for key, vals in indicators.items():
            row[key] = float(vals[i]) if not pd.isna(vals[i]) else None
        result.append(row)

    logger.info(f"Computed indicators for {manager_id}/{signal_id}: {len(result)} points")
    return result
