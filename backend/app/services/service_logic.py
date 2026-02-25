"""
Lógica de negócio para Serviços (Services).

Todas as funções recebem o cliente Supabase autenticado (RLS-aware)
como parâmetro, garantindo isolamento multi-tenant automático.
"""
from typing import List
from fastapi import HTTPException, status
from supabase import Client

from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse
from app.core.supabase import supabase_admin

import logging

logger = logging.getLogger(__name__)


async def create_service(
    db: Client, data: ServiceCreate, user_id: str
) -> ServiceResponse:
    """Criar novo serviço vinculado ao profissional."""
    service_dict = data.model_dump()
    service_dict["price"] = float(service_dict["price"])
    service_dict["user_id"] = user_id

    try:
        response = db.table("services").insert(service_dict).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar serviço",
            )
        return ServiceResponse(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar serviço: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def list_services(db: Client) -> List[ServiceResponse]:
    """Listar todos os serviços do profissional autenticado (RLS filtra)."""
    try:
        response = (
            db.table("services")
            .select("*")
            .order("created_at", desc=False)
            .execute()
        )
        return [ServiceResponse(**s) for s in response.data]
    except Exception as e:
        logger.error(f"Erro ao listar serviços: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def get_service(db: Client, service_id: str) -> ServiceResponse:
    """Buscar serviço por ID (RLS garante que pertence ao profissional)."""
    try:
        response = (
            db.table("services")
            .select("*")
            .eq("id", service_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Serviço não encontrado",
            )
        return ServiceResponse(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar serviço: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def update_service(
    db: Client, service_id: str, data: ServiceUpdate
) -> ServiceResponse:
    """Atualizar serviço (RLS garante que pertence ao profissional)."""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "price" in update_data:
        update_data["price"] = float(update_data["price"])

    if not update_data:
        return await get_service(db, service_id)

    try:
        response = (
            db.table("services")
            .update(update_data)
            .eq("id", service_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Serviço não encontrado",
            )
        return ServiceResponse(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar serviço: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def delete_service(db: Client, service_id: str) -> dict:
    """Deletar serviço (RLS garante que pertence ao profissional)."""
    try:
        response = (
            db.table("services")
            .delete()
            .eq("id", service_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Serviço não encontrado",
            )
        return {"message": "Serviço removido com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar serviço: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------
# Rota PÚBLICA — não usa RLS, usa supabase_admin
# ---------------------------------------------------------------
async def list_public_services(professional_id: str) -> List[ServiceResponse]:
    """
    Listar serviços ATIVOS de um profissional (endpoint público).
    Usa supabase_admin pois não há token de usuário.
    """
    try:
        response = (
            supabase_admin.table("services")
            .select("*")
            .eq("user_id", professional_id)
            .eq("is_active", True)
            .order("name")
            .execute()
        )
        return [ServiceResponse(**s) for s in response.data]
    except Exception as e:
        logger.error(f"Erro ao buscar serviços públicos: {e}")
        raise HTTPException(status_code=500, detail=str(e))
