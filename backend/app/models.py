from datetime import datetime

from sqlalchemy import (
    Column, String, Float, Integer, DateTime, Text
)
from app.database import Base


class Signal(Base):
    __tablename__ = "signals_normalized"

    time = Column(DateTime, primary_key=True)
    manager_id = Column(String, primary_key=True)
    signal_id = Column(String, primary_key=True)
    value = Column(Float)
    z_score = Column(Float)
    data_source = Column(String)


class CorrelationMatrix(Base):
    __tablename__ = "correlation_matrix"

    time = Column(DateTime, primary_key=True)
    manager_a = Column(String, primary_key=True)
    manager_b = Column(String, primary_key=True)
    asset_class = Column(String, primary_key=True)
    correlation = Column(Float)
    p_value = Column(Float)
    n_obs = Column(Integer)
    window_days = Column(Integer)


class Baseline(Base):
    __tablename__ = "baselines_historical"

    manager_a = Column(String, primary_key=True)
    manager_b = Column(String, primary_key=True)
    asset_class = Column(String, primary_key=True)
    baseline_mean = Column(Float)
    baseline_std = Column(Float)
    lookback_days = Column(Integer)
    computed_date = Column(DateTime)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    manager_a = Column(String)
    manager_b = Column(String)
    asset_class = Column(String)
    correlation = Column(Float)
    z_score = Column(Float)
    message = Column(Text)
    routed_to = Column(Text)
    acknowledged = Column(Integer, default=0)
