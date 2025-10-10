from typing import List, Optional
from fastapi import HTTPException, status
from app.core.supabase import supabase_admin
from app.schemas.services import ServiceCreate, ServiceUpdate, ServiceResponse
import logging

logger = logging.getLogger(__name__)


async def create_service(service_data: ServiceCreate, user_id: str) -> ServiceResponse:
    """Criar novo serviço para um profissional."""
    try:
        logger.info(f"Criando serviço para usuário {user_id}: {service_data.name}")
        
        # Preparar dados para inserção
        service_dict = {
            "user_id": user_id,
            "name": service_data.name,
            "description": service_data.description,
            "duration_minutes": service_data.duration_minutes,
            "price": float(service_data.price)  # Converter Decimal para float
        }
        
        # Inserir no banco
        response = supabase_admin.table("services").insert(service_dict).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar serviço"
            )
        
        service = response.data[0]
        logger.info(f"Serviço criado com sucesso: {service['id']}")
        
        return ServiceResponse(**service)
        
    except Exception as e:
        logger.error(f"Erro ao criar serviço: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )


async def get_user_services(user_id: str) -> List[ServiceResponse]:
    """Listar todos os serviços de um profissional."""
    try:
        logger.info(f"Buscando serviços do usuário {user_id}")
        
        response = supabase_admin.table("services").select("*").eq("user_id", user_id).order("created_at").execute()
        
        services = [ServiceResponse(**service) for service in response.data]
        logger.info(f"Encontrados {len(services)} serviços")
        
        return services
        
    except Exception as e:
        logger.error(f"Erro ao buscar serviços: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )


async def get_service_by_id(service_id: str, user_id: str) -> ServiceResponse:
    """Buscar um serviço específico do profissional."""
    try:
        logger.info(f"Buscando serviço {service_id} do usuário {user_id}")
        
        response = supabase_admin.table("services").select("*").eq("id", service_id).eq("user_id", user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Serviço não encontrado"
            )
        
        service = response.data[0]
        return ServiceResponse(**service)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar serviço: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )


async def update_service(service_id: str, service_data: ServiceUpdate, user_id: str) -> ServiceResponse:
    """Atualizar um serviço do profissional."""
    try:
        logger.info(f"Atualizando serviço {service_id} do usuário {user_id}")
        
        # Verificar se o serviço existe e pertence ao usuário
        await get_service_by_id(service_id, user_id)
        
        # Preparar dados para atualização (apenas campos não nulos)
        update_data = {}
        if service_data.name is not None:
            update_data["name"] = service_data.name
        if service_data.description is not None:
            update_data["description"] = service_data.description
        if service_data.duration_minutes is not None:
            update_data["duration_minutes"] = service_data.duration_minutes
        if service_data.price is not None:
            update_data["price"] = float(service_data.price)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhum campo para atualizar"
            )
        
        # Atualizar no banco
        response = supabase_admin.table("services").update(update_data).eq("id", service_id).eq("user_id", user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao atualizar serviço"
            )
        
        service = response.data[0]
        logger.info(f"Serviço atualizado com sucesso: {service_id}")
        
        return ServiceResponse(**service)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar serviço: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )


async def delete_service(service_id: str, user_id: str) -> bool:
    """Deletar um serviço do profissional."""
    try:
        logger.info(f"Deletando serviço {service_id} do usuário {user_id}")
        
        # Verificar se o serviço existe e pertence ao usuário
        await get_service_by_id(service_id, user_id)
        
        # Deletar do banco
        response = supabase_admin.table("services").delete().eq("id", service_id).eq("user_id", user_id).execute()
        
        logger.info(f"Serviço deletado com sucesso: {service_id}")
        return True
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar serviço: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )