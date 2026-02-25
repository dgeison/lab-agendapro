"""
Router de Serviços (Services).
Rotas protegidas (CRUD) + Rota pública para Public Booking Page.
"""
from typing import List
from fastapi import APIRouter, Depends
from supabase import Client

from app.core.dependencies import get_current_user, get_supabase_client
from app.schemas.user import UserPayload
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse
from app.services.service_logic import (
    create_service,
    list_services,
    get_service,
    update_service,
    delete_service,
    list_public_services,
)

router = APIRouter(prefix="/services", tags=["services"])


# ---------------------------------------------------------------
# Rota PÚBLICA (sem autenticação) — DEVE VIR ANTES de /{service_id}
# ---------------------------------------------------------------

@router.get(
    "/public/{professional_id}",
    response_model=List[ServiceResponse],
    summary="Serviços públicos de um profissional",
)
async def get_public(professional_id: str):
    """
    Retorna os serviços ATIVOS de um profissional.
    Usa supabase_admin internamente (sem token do usuário).
    Alimenta a Public Booking Page do frontend.
    """
    return await list_public_services(professional_id)


# ---------------------------------------------------------------
# Rotas PROTEGIDAS (autenticação obrigatória)
# ---------------------------------------------------------------

@router.post("/", response_model=ServiceResponse)
async def create(
    data: ServiceCreate,
    user: UserPayload = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Criar um novo serviço."""
    return await create_service(db, data, user.id)


@router.get("/", response_model=List[ServiceResponse])
async def list_all(
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """Listar todos os serviços do profissional autenticado."""
    return await list_services(db)


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_one(
    service_id: str,
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """Buscar um serviço por ID."""
    return await get_service(db, service_id)


@router.put("/{service_id}", response_model=ServiceResponse)
async def update(
    service_id: str,
    data: ServiceUpdate,
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """Atualizar um serviço."""
    return await update_service(db, service_id, data)


@router.delete("/{service_id}")
async def delete(
    service_id: str,
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """Remover um serviço."""
    return await delete_service(db, service_id)