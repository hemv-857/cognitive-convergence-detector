import pytest
import pandas as pd
import numpy as np
from app.stats.indicators import (
    sma,
    ema,
    bollinger_bands,
    rsi,
    macd,
    volatility,
    sharpe_ratio,
    sortino_ratio,
)


@pytest.fixture
def sample_prices():
    np.random.seed(42)
    return pd.Series(np.random.uniform(100, 110, 30))


def test_sma(sample_prices):
    result = sma(sample_prices, window=10)
    assert len(result) == len(sample_prices)
    # SMA should not produce NaN for short windows
    # (it uses min_periods=1 by default)
    assert not result.isna().all()


def test_ema(sample_prices):
    result = ema(sample_prices, span=12)
    assert len(result) == len(sample_prices)


def test_bollinger_bands(sample_prices):
    upper, middle, lower = bollinger_bands(sample_prices, window=20)
    assert len(upper) == len(sample_prices)
    assert len(middle) == len(sample_prices)
    assert len(lower) == len(sample_prices)


def test_rsi(sample_prices):
    result = rsi(sample_prices, period=14)
    assert len(result) == len(sample_prices)
    # RSI should be between 0 and 100 (excluding NaN)
    valid = result.dropna()
    assert all(0 <= v <= 100 for v in valid)


def test_macd(sample_prices):
    macd_line, signal_line, histogram = macd(sample_prices)
    assert len(macd_line) == len(sample_prices)
    assert len(signal_line) == len(sample_prices)
    assert len(histogram) == len(sample_prices)


def test_volatility(sample_prices):
    result = volatility(sample_prices, window=20)
    assert len(result) == len(sample_prices)
    # Volatility should be non-negative
    valid = result.dropna()
    assert all(v >= 0 for v in valid)


def test_sharpe_ratio(sample_prices):
    result = sharpe_ratio(sample_prices, window=20)
    assert len(result) == len(sample_prices)


def test_sortino_ratio(sample_prices):
    result = sortino_ratio(sample_prices, window=20)
    assert len(result) == len(sample_prices)
