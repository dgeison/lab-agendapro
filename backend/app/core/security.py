"""
Módulo de segurança: validação de JWT do Supabase e criação de clientes RLS-aware.

Suporta tanto HS256 (legacy) quanto ES256 (ECC P-256, novo padrão).

Fluxo:
  1. Frontend faz login via Supabase Auth → recebe access_token (JWT)
  2. Frontend envia esse token no header Authorization: Bearer <token>
  3. Este módulo valida o JWT:
     a) Tenta HS256 com o JWT Secret (legacy)
     b) Se falhar, busca JWKS e tenta ES256 (novo padrão ECC)
  4. Cria um cliente Supabase autenticado com o token do usuário
"""
import json
import logging
from urllib.request import urlopen
from jose import JWTError, jwt, jwk
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer
from supabase import create_client, Client

from app.core.config import settings
from app.schemas.user import UserPayload

logger = logging.getLogger(__name__)

# Esquema de segurança HTTP Bearer (Swagger UI mostra o cadeado 🔒)
security_scheme = HTTPBearer(
    description="Token JWT emitido pelo Supabase Auth"
)

# Cache do JWKS para evitar requests a cada validação
_jwks_cache: dict | None = None


def _get_jwks() -> dict:
    """Busca as chaves públicas do JWKS endpoint do Supabase (com cache)."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    logger.info(f"Buscando JWKS de: {jwks_url}")
    try:
        with urlopen(jwks_url) as response:
            _jwks_cache = json.loads(response.read())
            logger.info(f"JWKS carregado: {len(_jwks_cache.get('keys', []))} chave(s)")
            return _jwks_cache
    except Exception as e:
        logger.error(f"Erro ao buscar JWKS: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar chaves de validação do Supabase.",
        )


def _get_unverified_header(token: str) -> dict:
    """Extrai o header do JWT sem verificar a assinatura."""
    try:
        return jwt.get_unverified_header(token)
    except JWTError:
        return {}


def validate_supabase_token(token: str) -> UserPayload:
    """
    Decodifica e valida o JWT emitido pelo Supabase.

    Estratégia:
      1. Lê o header do JWT para descobrir o algoritmo (alg)
      2. Se HS256: valida com o JWT Secret (compatibilidade legacy)
      3. Se ES256/RS256: busca JWKS e valida com a chave pública

    Raises:
        HTTPException 401: se o token for inválido, expirado ou malformado.
    """
    header = _get_unverified_header(token)
    alg = header.get("alg", "HS256")
    kid = header.get("kid")

    try:
        if alg == "HS256":
            # Legacy: validar com o JWT Secret compartilhado
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            # ECC / RSA: validar com JWKS (chave pública)
            jwks_data = _get_jwks()
            keys = jwks_data.get("keys", [])

            # Encontrar a chave correta pelo kid
            signing_key = None
            for key_data in keys:
                if kid and key_data.get("kid") == kid:
                    signing_key = key_data
                    break

            # Se não encontrou pelo kid, usar a primeira chave compatível
            if signing_key is None:
                for key_data in keys:
                    if key_data.get("kty") in ("EC", "RSA"):
                        signing_key = key_data
                        break

            if signing_key is None:
                # Invalidar cache e tentar novamente
                global _jwks_cache
                _jwks_cache = None
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Chave de validação não encontrada no JWKS.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Construir a chave pública e decodificar
            public_key = jwk.construct(signing_key)
            payload = jwt.decode(
                token,
                public_key,
                algorithms=[alg],
                audience="authenticated",
            )

        user_id: str | None = payload.get("sub")
        email: str | None = payload.get("email")
        role: str | None = payload.get("role")

        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: payload incompleto (sub ou email ausente).",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return UserPayload(id=user_id, email=email, role=role)

    except HTTPException:
        raise
    except JWTError as e:
        logger.warning(f"JWT inválido ({alg}): {e}")
        # Invalidar cache para forçar atualização das chaves
        _jwks_cache = None
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido ou expirado: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def create_supabase_client_with_token(token: str) -> Client:
    """
    Cria um cliente Supabase autenticado com o token do usuário.

    Isso garante que todas as queries feitas por esse cliente
    respeitem o Row Level Security (RLS) do Supabase.
    """
    client: Client = create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
    )
    # Injeta o token do usuário para que o PostgREST respeite o RLS
    client.postgrest.auth(token)
    return client