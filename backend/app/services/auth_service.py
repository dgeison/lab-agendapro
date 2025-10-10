from typing import Optional
from fastapi import HTTPException, status
from app.core.supabase import supabase, supabase_admin
from app.core.security import create_access_token
from app.schemas.auth import UserSignup, UserLogin, AuthResponse, UserResponse, Token
import re
import logging

# Configurar logging
logger = logging.getLogger(__name__)


def generate_slug(full_name: str) -> str:
    """Gerar slug público a partir do nome completo."""
    # Converter para minúsculas e remover caracteres especiais
    slug = re.sub(r'[^a-zA-Z0-9\s]', '', full_name.lower())
    # Substituir espaços por hífens
    slug = re.sub(r'\s+', '-', slug.strip())
    return f"prof-{slug}"


async def signup_user(user_data: UserSignup) -> AuthResponse:
    """Registrar novo usuário."""
    logger.info(f"Iniciando signup para: {user_data.email}")
    try:
        # Criar usuário no Supabase Auth
        logger.info("Tentando criar usuário no Supabase Auth...")
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        
        logger.info(f"Resposta do Supabase Auth: {auth_response}")
        
        if auth_response.user is None:
            logger.error("Usuário retornado é None")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erro ao criar usuário"
            )
        
        user_id = auth_response.user.id
        
        # Gerar slug público
        public_slug = generate_slug(user_data.full_name)
        
        # Verificar se o slug já existe e adicionar número se necessário
        logger.info("Verificando se slug já existe...")
        existing_slug = supabase_admin.table("profiles").select("public_slug").eq("public_slug", public_slug).execute()
        if existing_slug.data:
            counter = 1
            while True:
                new_slug = f"{public_slug}-{counter}"
                existing_new_slug = supabase_admin.table("profiles").select("public_slug").eq("public_slug", new_slug).execute()
                if not existing_new_slug.data:
                    public_slug = new_slug
                    break
                counter += 1
        
        # Criar perfil na tabela profiles usando service role
        profile_data = {
            "id": user_id,
            "full_name": user_data.full_name,
            "public_slug": public_slug
        }
        
        logger.info(f"Criando perfil com dados: {profile_data}")
        profile_response = supabase_admin.table("profiles").insert(profile_data).execute()
        
        logger.info(f"Resposta da criação do perfil: {profile_response}")
        
        if not profile_response.data:
            logger.error("Perfil não foi criado - dados vazios")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar perfil do usuário"
            )
        
        # Criar token JWT
        access_token = create_access_token(data={"sub": user_id})
        
        # Preparar resposta
        user_response = UserResponse(
            id=user_id,
            email=auth_response.user.email,
            full_name=user_data.full_name,
            public_slug=public_slug
        )
        
        token = Token(access_token=access_token, token_type="bearer")
        
        return AuthResponse(user=user_response, token=token)
        
    except Exception as e:
        if "already registered" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este email já está cadastrado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno do servidor: {str(e)}"
        )


async def login_user(user_data: UserLogin) -> AuthResponse:
    """Fazer login do usuário."""
    try:
        # Fazer login no Supabase Auth
        logger.info(f"Tentando fazer login para: {user_data.email}")
        auth_response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        logger.info(f"Resposta do login: {auth_response}")
        
        if auth_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )
        
        user_id = auth_response.user.id
        
        # Buscar dados do perfil
        profile_response = supabase_admin.table("profiles").select("*").eq("id", user_id).execute()
        
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
            email=auth_response.user.email,
            full_name=profile.get("full_name"),
            avatar_url=profile.get("avatar_url"),
            public_slug=profile.get("public_slug")
        )
        
        token = Token(access_token=access_token, token_type="bearer")
        
        return AuthResponse(user=user_response, token=token)
        
    except HTTPException:
        raise
    except Exception as e:
        if "invalid login credentials" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno do servidor: {str(e)}"
        )