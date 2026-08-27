import pytest
import pandas as pd
import numpy as np
from app.stats.correlation import compute_rolling_correlations, compute_baseline


@pytest.fixture
def sample_data():
    np.random.seed(42)
    n_days = 60
    dates = pd.date_range(end=pd.Timestamp.now(), periods=n_days, freq='D')
    
    # Create a DataFrame with the expected format
    data = []
    for i in range(n_days):
        data.append({
            'date': dates[i],
            'manager_id': 'manager_a',
            'signal_id': 'equities',  # signal_id is used as asset class
            'value': np.random.uniform(0.5, 0.8)
        })
        data.append({
            'date': dates[i],
            'manager_id': 'manager_b',
            'signal_id': 'equities',
            'value': np.random.uniform(0.5, 0.8)
        })
    
    return pd.DataFrame(data)


def test_compute_rolling_correlations(sample_data):
    result = compute_rolling_correlations(sample_data, window=30)
    
    assert isinstance(result, pd.DataFrame)
    assert 'correlation' in result.columns
    # Should have valid correlation values
    valid = result['correlation'].dropna()
    assert all(-1 <= v <= 1 for v in valid)


def test_compute_baseline():
    np.random.seed(42)
    n_days = 252
    dates = pd.date_range(end=pd.Timestamp.now(), periods=n_days, freq='D')
    
    data = []
    for i in range(n_days):
        data.append({
            'date': dates[i],
            'manager_id': 'manager_a',
            'signal_id': 'equities',
            'value': np.random.uniform(0.5, 0.8)
        })
        data.append({
            'date': dates[i],
            'manager_id': 'manager_b',
            'signal_id': 'equities',
            'value': np.random.uniform(0.5, 0.8)
        })
    
    df = pd.DataFrame(data)
    result = compute_baseline(df)
    
    # Returns dict with tuple keys: {(manager_a, manager_b, asset_class): (mean, std)}
    assert isinstance(result, dict)
    assert len(result) > 0
    for key, (mean, std) in result.items():
        assert len(key) == 3  # (manager_a, manager_b, asset_class)
        assert isinstance(mean, float)
        assert isinstance(std, float)
        assert -1 <= mean <= 1
        assert std >= 0
