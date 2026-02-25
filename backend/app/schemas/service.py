"""
Schemas Pydantic para o domínio de Serviços (Services).
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ServiceCreate(BaseModel):
    """Dados para criação de um serviço."""
    name: str
    description: Optional[str] = None
    duration_minutes: int = 60
    price: Decimal
    is_active: bool = True


class ServiceUpdate(BaseModel):
    """Dados para atualização parcial de um serviço."""
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ServiceResponse(BaseModel):
    """Resposta de um serviço (leitura)."""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price: Decimal
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
