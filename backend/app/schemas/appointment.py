"""
Schemas Pydantic para o domínio de Agendamentos (Appointments).

Todas as datas/horas são timezone-aware e armazenadas em UTC.
"""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime, timezone


# ---------------------------------------------------------------
# Schema de CRIAÇÃO (rota pública)
# ---------------------------------------------------------------

class AppointmentCreate(BaseModel):
    """
    Dados para criar um agendamento (usado na rota pública).

    O frontend envia os dados do aluno (name, email, phone) e o
    backend faz o upsert na tabela `students` antes de criar o
    agendamento.
    """
    professional_id: str
    service_id: str

    # Dados do aluno (coletados no BookingModal)
    student_name: str
    student_email: EmailStr
    student_phone: Optional[str] = None

    # Horários (frontend envia em UTC via ISO 8601)
    start_time: datetime
    end_time: datetime

    @field_validator("start_time", "end_time", mode="before")
    @classmethod
    def ensure_timezone_aware(cls, v: object) -> datetime:
        """Garante que datetimes recebidos tenham timezone (UTC)."""
        if isinstance(v, str):
            dt = datetime.fromisoformat(v)
        elif isinstance(v, datetime):
            dt = v
        else:
            raise ValueError("Formato de data/hora inválido")

        # Se naive, assume UTC
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt


# ---------------------------------------------------------------
# Schema de atualização de STATUS
# ---------------------------------------------------------------

class AppointmentStatusUpdate(BaseModel):
    """Payload para PATCH de status."""
    status: str  # "confirmed" | "canceled"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"confirmed", "canceled"}
        if v not in allowed:
            raise ValueError(f"Status deve ser um de: {allowed}")
        return v


# ---------------------------------------------------------------
# Schema de RESPOSTA
# ---------------------------------------------------------------

class AppointmentResponse(BaseModel):
    """Retorno padrão de um agendamento."""
    id: str
    professional_id: str
    service_id: str
    student_id: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: str  # pending | confirmed | canceled
    google_event_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------
# Schema auxiliar — Disponibilidade
# ---------------------------------------------------------------

class TimeSlot(BaseModel):
    """Slot de horário para verificação de disponibilidade."""
    start: datetime
    end: datetime
    available: bool
