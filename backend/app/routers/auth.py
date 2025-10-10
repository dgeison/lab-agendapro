from fastapi import APIRouter, HTTPException, Depends
from app.schemas.auth import UserSignup, UserLogin, AuthResponse, UserResponse
from app.services.auth_service_simple import signup_user_simple, login_user_simple
from app.core.security import get_current_user
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
async def signup(user_data: UserSignup):
    """Endpoint para registro de novos usuários."""
    logger.info(f"Tentativa de signup para email: {user_data.email}")
    try:
        result = await signup_user_simple(user_data)
        logger.info(f"Signup bem-sucedido para: {user_data.email}")
        return result
    except Exception as e:
        logger.error(f"Erro no signup: {str(e)}")
        raise


@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserLogin):
    """Endpoint para login de usuários."""
    return await login_user_simple(user_data)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Endpoint para obter dados do usuário atual."""
    return UserResponse(
        id=current_user["id"],
        email=current_user.get("email", ""),
        full_name=current_user.get("full_name"),
        avatar_url=current_user.get("avatar_url"),
        public_slug=current_user.get("public_slug")
    )