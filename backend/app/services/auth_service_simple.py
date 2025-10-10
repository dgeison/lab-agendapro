from typing import Optional
from fastapi import HTTPException, status
from app.core.supabase import supabase_admin
from app.core.security import create_access_token
from app.schemas.auth import UserSignup, UserLogin, AuthResponse, UserResponse, Token
import re
import logging
import hashlib
import uuid

# Configurar logging
logger = logging.getLogger(__name__)


def generate_slug(full_name: str) -> str:
    """Gerar slug público a partir do nome completo."""
    # Converter para minúsculas e remover caracteres especiais
    slug = re.sub(r'[^a-zA-Z0-9\s]', '', full_name.lower())
    # Substituir espaços por hífens
    slug = re.sub(r'\s+', '-', slug.strip())
    return f"prof-{slug}"


def hash_password(password: str) -> str:
    """Hash simples da senha (apenas para demo - usar bcrypt em produção)."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verificar senha."""
    return hash_password(password) == hashed


async def signup_user_simple(user_data: UserSignup) -> AuthResponse:
    """Registrar novo usuário - versão simplificada."""
    logger.info(f"Iniciando signup para: {user_data.email}")
    try:
        # Verificar se email já existe
        existing_user = supabase_admin.table("user_credentials").select("email").eq("email", user_data.email).execute()
        if existing_user.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este email já está cadastrado"
            )
        
        # Gerar ID único
        user_id = str(uuid.uuid4())
        
        # Gerar slug público
        public_slug = generate_slug(user_data.full_name)
        
        # Verificar se o slug já existe e adicionar número se necessário
        existing_slug = supabase_admin.table("user_profiles").select("public_slug").eq("public_slug", public_slug).execute()
        if existing_slug.data:
            counter = 1
            while True:
                new_slug = f"{public_slug}-{counter}"
                existing_new_slug = supabase_admin.table("user_profiles").select("public_slug").eq("public_slug", new_slug).execute()
                if not existing_new_slug.data:
                    public_slug = new_slug
                    break
                counter += 1
        
        # Hash da senha
        password_hash = hash_password(user_data.password)
        
        # Criar credenciais do usuário
        credentials_data = {
            "id": user_id,
            "email": user_data.email,
            "password_hash": password_hash
        }
        
        cred_response = supabase_admin.table("user_credentials").insert(credentials_data).execute()
        if not cred_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar credenciais do usuário"
            )
        
        # Criar perfil do usuário
        profile_data = {
            "id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "public_slug": public_slug
        }

        profile_response = supabase_admin.table("user_profiles").insert(profile_data).execute()
        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar perfil do usuário"
            )        # Criar token JWT
        access_token = create_access_token(data={"sub": user_id})
        
        # Preparar resposta
        user_response = UserResponse(
            id=user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            public_slug=public_slug
        )
        
        token = Token(access_token=access_token, token_type="bearer")
        
        logger.info(f"Signup bem-sucedido para: {user_data.email}")
        return AuthResponse(user=user_response, token=token)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no signup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno do servidor: {str(e)}"
        )


async def login_user_simple(user_data: UserLogin) -> AuthResponse:
    """Fazer login do usuário - versão simplificada."""
    logger.info(f"Tentando login para: {user_data.email}")
    try:
        # Buscar credenciais do usuário
        cred_response = supabase_admin.table("user_credentials").select("*").eq("email", user_data.email).execute()
        
        if not cred_response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )
        
        credentials = cred_response.data[0]
        
        # Verificar senha
        if not verify_password(user_data.password, credentials["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )
        
        user_id = credentials["id"]
        
        # Buscar dados do perfil
        profile_response = supabase_admin.table("user_profiles").select("*").eq("id", user_id).execute()

        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil do usuário não encontrado"
            )
        
        profile = profile_response.data[0]
        
        # Criar token JWT
        access_token = create_access_token(data={"sub": user_id})
        
        # Preparar resposta
        user_response = UserResponse(
            id=user_id,
            email=credentials["email"],
            full_name=profile.get("full_name"),
            avatar_url=profile.get("avatar_url"),
            public_slug=profile.get("public_slug")
        )
        
        token = Token(access_token=access_token, token_type="bearer")
        
        logger.info(f"Login bem-sucedido para: {user_data.email}")
        return AuthResponse(user=user_response, token=token)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no login: {str(e)}")
        if "invalid login credentials" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno do servidor: {str(e)}"
        )