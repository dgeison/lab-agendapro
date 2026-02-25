"""
Dependências de autenticação para injeção via FastAPI Depends().

Uso nos routers:
    from app.core.dependencies import get_current_user, get_supabase_client
    from app.schemas.user import UserPayload
    from supabase import Client

    @router.get("/")
    async def list_items(
        user: UserPayload = Depends(get_current_user),
        db: Client = Depends(get_supabase_client),
    ):
        response = db.table("items").select("*").execute()
        ...
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from supabase import Client

from app.core.security import (
    security_scheme,
    validate_supabase_token,
    create_supabase_client_with_token,
)
from app.schemas.user import UserPayload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> UserPayload:
    """
    Dependency que extrai e valida o usuário do token JWT.

    Retorna um UserPayload tipado com id, email e role.

    Raises:
        HTTPException 401: token ausente, inválido ou expirado.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação ausente.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return validate_supabase_token(credentials.credentials)


async def get_supabase_client(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> Client:
    """
    Dependency que retorna um cliente Supabase autenticado com o token
    do usuário, garantindo que todas as queries respeitem o RLS.

    Uso: injete como segundo parâmetro nos endpoints protegidos.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação ausente.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Valida primeiro — falha rápido se token inválido
    validate_supabase_token(credentials.credentials)
    return create_supabase_client_with_token(credentials.credentials)
