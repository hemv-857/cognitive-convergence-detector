import pytest
from datetime import datetime
from app.models import Signal, CorrelationMatrix, Alert, Baseline


def test_signal_model(db_session):
    signal = Signal(
        time=datetime.utcnow(),
        manager_id="test_manager",
        signal_id="test_signal",
        value=0.75,
        z_score=1.2,
        data_source="test"
    )
    db_session.add(signal)
    db_session.commit()
    
    retrieved = db_session.query(Signal).first()
    assert retrieved is not None
    assert retrieved.manager_id == "test_manager"
    assert retrieved.value == 0.75


def test_correlation_model(db_session):
    correlation = CorrelationMatrix(
        time=datetime.utcnow(),
        manager_a="manager_a",
        manager_b="manager_b",
        asset_class="equities",
        correlation=0.85,
        p_value=0.001,
        n_obs=30,
        window_days=30
    )
    db_session.add(correlation)
    db_session.commit()
    
    retrieved = db_session.query(CorrelationMatrix).first()
    assert retrieved is not None
    assert retrieved.correlation == 0.85


def test_alert_model(db_session):
    alert = Alert(
        alert_type="convergence",
        severity="high",
        manager_a="manager_a",
        manager_b="manager_b",
        correlation=0.9,
        z_score=2.1,
        message="Test alert"
    )
    db_session.add(alert)
    db_session.commit()
    
    retrieved = db_session.query(Alert).first()
    assert retrieved is not None
    assert retrieved.severity == "high"
    assert retrieved.acknowledged == 0
