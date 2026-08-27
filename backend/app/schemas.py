from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class SignalResponse(BaseModel):
    manager_id: str
    signal_id: str
    date: datetime
    value: float
    z_score: Optional[float] = None


class CorrelationResponse(BaseModel):
    manager_a: str
    manager_b: str
    asset_class: str
    correlation: float
    p_value: Optional[float] = None
    date: datetime

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: int
    created_at: datetime
    alert_type: str
    severity: str
    manager_a: Optional[str] = None
    manager_b: Optional[str] = None
    asset_class: Optional[str] = None
    correlation: Optional[float] = None
    z_score: Optional[float] = None
    message: Optional[str] = None
    acknowledged: int = 0

    class Config:
        from_attributes = True


class ConvergenceSnapshot(BaseModel):
    date: datetime
    asset_class: str
    severity_index: float
    pair_correlations: List[CorrelationResponse]
    alerts_today: List[AlertResponse]


class BaselineResponse(BaseModel):
    manager_a: str
    manager_b: str
    asset_class: str
    baseline_mean: float
    baseline_std: float

    class Config:
        from_attributes = True
