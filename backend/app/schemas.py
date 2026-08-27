from datetime import datetime

from pydantic import BaseModel


class SignalResponse(BaseModel):
    manager_id: str
    signal_id: str
    date: datetime
    value: float
    z_score: float | None = None


class CorrelationResponse(BaseModel):
    manager_a: str
    manager_b: str
    asset_class: str
    correlation: float
    p_value: float | None = None
    date: datetime

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: int
    created_at: datetime
    alert_type: str
    severity: str
    manager_a: str | None = None
    manager_b: str | None = None
    asset_class: str | None = None
    correlation: float | None = None
    z_score: float | None = None
    message: str | None = None
    acknowledged: int = 0

    class Config:
        from_attributes = True


class ConvergenceSnapshot(BaseModel):
    date: datetime
    asset_class: str
    severity_index: float
    pair_correlations: list[CorrelationResponse]
    alerts_today: list[AlertResponse]


class BaselineResponse(BaseModel):
    manager_a: str
    manager_b: str
    asset_class: str
    baseline_mean: float
    baseline_std: float

    class Config:
        from_attributes = True
