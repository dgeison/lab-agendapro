"""
Schemas Pydantic para o domínio de Disponibilidade (Availabilities).

Define a configuração de expediente do professor e os slots
de horário para a página pública.
"""
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import time, datetime


# ---------------------------------------------------------------
# Schema de CRIAÇÃO — Professor configura expediente
# ---------------------------------------------------------------

class AvailabilityCreate(BaseModel):
    """
    Dados para criar um bloco de disponibilidade.

    Exemplo: Segunda-feira, das 08:00 às 12:00
    """
    day_of_week: int       # 0=dom, 1=seg, ..., 6=sáb
    start_time: str        # "08:00" (HH:MM)
    end_time: str          # "12:00" (HH:MM)

    @field_validator("day_of_week")
    @classmethod
    def validate_day(cls, v: int) -> int:
        if not (0 <= v <= 6):
            raise ValueError("day_of_week deve ser entre 0 (domingo) e 6 (sábado)")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        """Garante formato HH:MM válido."""
        try:
            parts = v.split(":")
            h, m = int(parts[0]), int(parts[1])
            if not (0 <= h <= 23 and 0 <= m <= 59):
                raise ValueError()
            return f"{h:02d}:{m:02d}"
        except (ValueError, IndexError):
            raise ValueError(f"Formato de hora inválido: '{v}'. Use HH:MM (ex: 08:00)")


class AvailabilityBulkCreate(BaseModel):
    """
    Payload para salvar todos os blocos de um professor de uma vez.
    Suporta envio em lote (replace all).
    """
    blocks: list[AvailabilityCreate]


# ---------------------------------------------------------------
# Schema de RESPOSTA
# ---------------------------------------------------------------

class AvailabilityResponse(BaseModel):
    """Retorno de um bloco de disponibilidade."""
    id: str
    user_id: str
    day_of_week: int
    start_time: str      # "08:00"
    end_time: str        # "12:00"
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------
# Schema de SLOTS PÚBLICOS (gerados pelo motor de disponibilidade)
# ---------------------------------------------------------------

class TimeSlot(BaseModel):
    """
    Um slot de horário disponível/indisponível.
    Usado pela Public Booking Page para mostrar os horários.
    """
    start: str            # ISO 8601 UTC, ex: "2026-02-26T14:00:00+00:00"
    end: str              # ISO 8601 UTC, ex: "2026-02-26T15:00:00+00:00"
    available: bool       # True = livre, False = ocupado


class SlotsResponse(BaseModel):
    """Resposta da rota pública de slots."""
    date: str                          # "2026-02-26"
    professional_id: str
    service_duration_minutes: int
    slots: list[TimeSlot]
