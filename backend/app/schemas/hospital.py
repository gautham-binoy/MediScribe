from datetime import datetime

from pydantic import BaseModel


class MetricItem(BaseModel):
    title: str
    value: int | str
    change: str | None = None
    trend: str | None = "up"  # up, down, neutral
    subtitle: str | None = None


class TrendPoint(BaseModel):
    date: str
    consultations: int
    approved: int
    pending: int


class StatusDistributionItem(BaseModel):
    name: str
    count: int
    percentage: float
    color: str


class RecentPatientTableItem(BaseModel):
    id: str
    patient_id: str
    name: str
    age: int
    gender: str
    last_consultation_date: datetime | None = None
    last_consultation_id: str | None = None
    doctor_name: str | None = None
    status: str
    has_approved_history: bool = False


class HospitalDashboardResponse(BaseModel):
    metrics: dict[str, MetricItem]
    consultation_trends: list[TrendPoint]
    status_distribution: list[StatusDistributionItem]
    ai_assisted_ratio: float  # e.g., 94.5%
    recent_patients: list[RecentPatientTableItem]
