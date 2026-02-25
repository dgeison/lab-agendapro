"""
Router de Agendamentos (Appointments).

Contém rotas públicas (aluno agendando) e privadas (professor gerenciando).
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.core.dependencies import get_current_user, get_supabase_client
from app.schemas.user import UserPayload
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
)
from app.services.appointment_logic import (
    create_public_appointment,
    list_appointments,
    get_appointment,
    update_appointment_status,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


# ---------------------------------------------------------------
# Rota PÚBLICA (aluno agendando pela Public Booking Page)
# ---------------------------------------------------------------

@router.post(
    "/public",
    response_model=AppointmentResponse,
    status_code=201,
    summary="Criar agendamento (público)",
)
async def create_public(data: AppointmentCreate):
    """
    Cria um novo agendamento a partir da página pública.
    Não exige autenticação.

    Fluxo:
    1. Valida horário (start < end)
    2. Verifica disponibilidade (anti double-booking)
    3. Cria agendamento com status 'pending'
    4. Dispara evento no Google Calendar (mock)
    """
    return await create_public_appointment(data)


# ---------------------------------------------------------------
# Rotas PROTEGIDAS (professor autenticado)
# ---------------------------------------------------------------

@router.get(
    "/",
    response_model=List[AppointmentResponse],
    summary="Listar meus agendamentos",
)
async def list_all(
    status: Optional[str] = Query(
        None,
        description="Filtrar por status: pending, confirmed, canceled",
    ),
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """Lista todos os agendamentos do profissional autenticado."""
    return await list_appointments(db, status_filter=status)


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Buscar agendamento por ID",
)
async def get_one(
    appointment_id: str,
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """Busca um agendamento específico."""
    return await get_appointment(db, appointment_id)


@router.patch(
    "/{appointment_id}/status",
    response_model=AppointmentResponse,
    summary="Confirmar ou cancelar agendamento",
)
async def patch_status(
    appointment_id: str,
    data: AppointmentStatusUpdate,
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """
    Atualiza o status de um agendamento.
    Valores permitidos: 'confirmed', 'canceled'.
    """
    return await update_appointment_status(db, appointment_id, data)