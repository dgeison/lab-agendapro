from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AppointmentBase(BaseModel):
    service_id: str
    client_name: str
    client_email: str
    start_time: datetime
    end_time: datetime


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    id: str
    status: str
    stripe_payment_intent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TimeSlot(BaseModel):
    start: datetime
    end: datetime
    available: bool


class PublicProfile(BaseModel):
    id: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    public_slug: str