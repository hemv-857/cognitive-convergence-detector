"""Fetch market data using yfinance (free) instead of paid ORION API."""

import logging
import time
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

MANAGER_TICKERS: dict[str, dict[str, str]] = {
    "blackrock": {"equities": "SPY", "fixed_income": "BND", "commodities": "GLD"},
    "citadel": {"equities": "QQQ", "fixed_income": "TLT", "commodities": "USO"},
    "point72": {"equities": "IVV", "fixed_income": "AGG", "commodities": "SLV"},
    "renaissance": {"equities": "IWM", "fixed_income": "SHY", "commodities": "DBC"},
    "jane_street": {"equities": "VOO", "fixed_income": "LQD", "commodities": "PDBC"},
    "two_sigma": {"equities": "VTI", "fixed_income": "VCIT", "commodities": "GSG"},
    "deutsche_bank": {"equities": "EFA", "fixed_income": "HYG", "commodities": "USO"},
    "goldman_sachs": {"equities": "SPY", "fixed_income": "TIP", "commodities": "GLD"},
    "jpmorgan": {"equities": "MDY", "fixed_income": "BND", "commodities": "SLV"},
    "morgan_stanley": {"equities": "QQQ", "fixed_income": "AGG", "commodities": "DBC"},
}

# Backup tickers if primary fails
BACKUP_TICKERS = {
    "SPY": "VOO", "QQQ": "ONEQ", "IVV": "SPY", "IWM": "VTWO",
    "VOO": "SPY", "VTI": "ITOT", "EFA": "IEFA", "MDY": "IJH",
    "BND": "AGG", "TLT": "IEF", "AGG": "BND", "SHY": "IEI",
    "LQD": "VCIT", "VCIT": "LQD", "HYG": "JNK", "TIP": "SCHP",
    "GLD": "IAU", "SLV": "SIVR", "DBC": "PDBC", "PDBC": "DBC",
    "GSG": "DBC", "USO": "UCO",
}


def generate_demo_signals(lookback_days: int = 365) -> pd.DataFrame:
    """Generate synthetic but realistic signal data for demo/testing."""
    rng = np.random.default_rng(42)
    end = datetime.now()
    start = end - timedelta(days=lookback_days)
    dates = pd.bdate_range(start, end)

    all_records = []
    managers = list(MANAGER_TICKERS.keys())
    signal_ids = ["equities", "fixed_income", "commodities"]

    n_dates = len(dates)
    regime = np.cumsum(rng.normal(0, 0.01, n_dates))
    market_noise = rng.normal(0, 0.05, n_dates)

    for manager_id in managers:
        manager_bias = rng.normal(0, 0.3)
        for signal_id in signal_ids:
            signal_weight = {"equities": 1.0, "fixed_income": 0.3, "commodities": 0.5}[signal_id]
            values = (
                50
                + manager_bias * 10
                + regime * signal_weight * 20
                + market_noise * signal_weight * 15
                + rng.normal(0, 3, n_dates)
            )
            values = np.clip(values, 0, 100)

            for i, date in enumerate(dates):
                all_records.append({
                    "manager_id": manager_id,
                    "signal_id": signal_id,
                    "date": date.to_pydatetime(),
                    "value": float(values[i]),
                    "data_source": "demo",
                })

    df = pd.DataFrame(all_records)
    logger.info(f"Generated {len(df)} demo signal records for {len(managers)} managers")
    return df


def _download_close(ticker: str, start: str, end: str, retries: int = 2) -> pd.Series | None:
    """Download close prices for a ticker with retry and backup ticker fallback."""
    try:
        import yfinance as yf
    except ImportError:
        return None

    for attempt in range(retries + 1):
        try:
            data = yf.download(ticker, start=start, end=end, progress=False, auto_adjust=True)
            if data.empty and ticker in BACKUP_TICKERS:
                logger.debug(f"Trying backup ticker {BACKUP_TICKERS[ticker]} for {ticker}")
                data = yf.download(BACKUP_TICKERS[ticker], start=start, end=end, progress=False, auto_adjust=True)
            if data.empty:
                return None
            close = data["Close"]
            if isinstance(close, pd.DataFrame):
                close = close.iloc[:, 0]
            return close.dropna()
        except Exception as e:
            if attempt < retries:
                time.sleep(1)
            else:
                logger.debug(f"Download failed for {ticker}: {e}")
    return None


def fetch_manager_signals(
    managers: list[str] | None = None,
    lookback_days: int = 365,
) -> pd.DataFrame:
    """Fetch daily price data for all managers and compute signals.

    Tries yfinance first; falls back to demo data if it fails.
    """
    if managers is None:
        managers = list(MANAGER_TICKERS.keys())

    end = datetime.now()
    start = end - timedelta(days=lookback_days)
    start_str = start.strftime("%Y-%m-%d")
    end_str = end.strftime("%Y-%m-%d")

    all_records = []
    any_success = False

    for manager_id in managers:
        tickers = MANAGER_TICKERS.get(manager_id, {})
        for signal_id, ticker in tickers.items():
            close = _download_close(ticker, start_str, end_str)
            if close is None or len(close) < 30:
                logger.debug(f"No data for {manager_id}/{ticker}")
                continue

            returns = close.pct_change(20).dropna()
            if returns.empty:
                continue
            normalized = (returns - returns.min()) / (returns.max() - returns.min() + 1e-10) * 100

            for date, value in normalized.items():
                all_records.append({
                    "manager_id": manager_id,
                    "signal_id": signal_id,
                    "date": date.to_pydatetime(),
                    "value": float(value),
                    "data_source": "yfinance",
                })
            any_success = True
            logger.info(f"Fetched {ticker} for {manager_id}/{signal_id}: {len(normalized)} points")
            time.sleep(0.3)

    if not any_success:
        logger.warning("No yfinance data retrieved, falling back to demo data")
        return generate_demo_signals(lookback_days)

    df = pd.DataFrame(all_records)
    logger.info(f"Fetched {len(df)} live signal records across {len(managers)} managers")
    return df
