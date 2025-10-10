from typing import List
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.services import ServiceCreate, ServiceUpdate, ServiceResponse
from app.services.services_service import (
    create_service,
    get_user_services,
    get_service_by_id,
    update_service,
    delete_service
)
from app.core.security import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/services", tags=["services"])


@router.post("/", response_model=ServiceResponse)
async def create_new_service(
    service_data: ServiceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Criar novo serviço."""
    logger.info(f"Usuário {current_user['id']} criando novo serviço: {service_data.name}")
    return await create_service(service_data, current_user["id"])


@router.get("/", response_model=List[ServiceResponse])
async def list_my_services(current_user: dict = Depends(get_current_user)):
    """Listar todos os serviços do usuário atual."""
    logger.info(f"Usuário {current_user['id']} listando seus serviços")
    return await get_user_services(current_user["id"])


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Buscar um serviço específico."""
    logger.info(f"Usuário {current_user['id']} buscando serviço {service_id}")
    return await get_service_by_id(service_id, current_user["id"])


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_my_service(
    service_id: str,
    service_data: ServiceUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Atualizar um serviço."""
    logger.info(f"Usuário {current_user['id']} atualizando serviço {service_id}")
    return await update_service(service_id, service_data, current_user["id"])


@router.delete("/{service_id}")
async def delete_my_service(
    service_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deletar um serviço."""
    logger.info(f"Usuário {current_user['id']} deletando serviço {service_id}")
    await delete_service(service_id, current_user["id"])
    return {"message": "Serviço deletado com sucesso"}


# Endpoints públicos para clientes visualizarem serviços
@router.get("/public/{user_slug}", response_model=List[ServiceResponse])
async def get_services_by_slug(user_slug: str):
    """Listar serviços de um profissional através do slug público."""
    try:
        logger.info(f"Buscando serviços do profissional com slug: {user_slug}")
        
        # Primeiro, buscar o usuário pelo slug
        from app.core.supabase import supabase_admin
        
        profile_response = supabase_admin.table("user_profiles").select("id").eq("public_slug", user_slug).execute()
        
        if not profile_response.data:
            raise HTTPException(
                status_code=404,
                detail="Profissional não encontrado"
            )
        
        user_id = profile_response.data[0]["id"]
        
        # Buscar serviços do profissional
        return await get_user_services(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar serviços por slug: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno do servidor"
        )