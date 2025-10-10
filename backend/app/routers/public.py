from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.appointments import PublicProfile
from app.services.appointments_service import get_public_profile
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/profile/{slug}", response_model=PublicProfile)
async def get_professional_profile(slug: str):
    """Buscar perfil público do profissional."""
    logger.info(f"Buscando perfil público para slug: {slug}")
    return await get_public_profile(slug)