"""
Router de Disponibilidade (Availabilities).

Rotas protegidas: Professor configura seu expediente.
Rota pública: Aluno busca slots livres para agendar.
"""
from typing import List
from datetime import date
from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.core.dependencies import get_current_user, get_supabase_client
from app.schemas.user import UserPayload
from app.schemas.availability import (
    AvailabilityCreate,
    AvailabilityBulkCreate,
    AvailabilityResponse,
    SlotsResponse,
)
from app.services.availability_logic import (
    list_availabilities,
    create_availability,
    bulk_replace_availabilities,
    delete_availability,
    get_available_slots,
)

router = APIRouter(prefix="/availabilities", tags=["availabilities"])


# ---------------------------------------------------------------
# Rotas PROTEGIDAS (professor autenticado)
# ---------------------------------------------------------------

@router.get(
    "/",
    response_model=List[AvailabilityResponse],
    summary="Listar minha disponibilidade",
)
async def list_all(
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """Lista todos os blocos de disponibilidade do professor logado."""
    return await list_availabilities(db)


@router.post(
    "/",
    response_model=AvailabilityResponse,
    status_code=201,
    summary="Criar bloco de disponibilidade",
)
async def create(
    data: AvailabilityCreate,
    user: UserPayload = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Cria um bloco de expediente (ex: Segunda, 08:00-12:00)."""
    return await create_availability(db, data, user.id)


@router.put(
    "/bulk",
    response_model=List[AvailabilityResponse],
    summary="Substituir toda a disponibilidade (bulk)",
)
async def bulk_replace(
    data: AvailabilityBulkCreate,
    user: UserPayload = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    Substitui TODOS os blocos de disponibilidade de uma vez.
    Útil quando o professor salva toda sua configuração de expediente.
    """
    return await bulk_replace_availabilities(db, data.blocks, user.id)


@router.delete(
    "/{availability_id}",
    summary="Remover um bloco de disponibilidade",
)
async def delete(
    availability_id: str,
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """Remove um bloco de disponibilidade específico."""
    return await delete_availability(db, availability_id)


# ---------------------------------------------------------------
# Rota PÚBLICA — Slots disponíveis (sem autenticação)
# ---------------------------------------------------------------

@router.get(
    "/public/slots",
    response_model=SlotsResponse,
    summary="Buscar horários disponíveis (público)",
)
async def get_public_slots(
    professional_id: str = Query(..., description="UUID do profissional"),
    date: date = Query(..., description="Data desejada (YYYY-MM-DD)"),
    service_id: str = Query(..., description="UUID do serviço"),
):
    """
    Retorna os slots de horário disponíveis para um dia específico.

    Usado pela Public Booking Page para o aluno escolher o horário.

    Algoritmo:
      1. Busca a duração do serviço
      2. Busca os blocos de disponibilidade do professor para o dia da semana
      3. Gera slots de N minutos dentro de cada bloco
      4. Cruza com agendamentos existentes (marca ocupados)
    """
    return await get_available_slots(professional_id, date, service_id)
