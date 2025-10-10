from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 60
    price: Decimal


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(ServiceBase):
    name: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[Decimal] = None


class ServiceResponse(ServiceBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True