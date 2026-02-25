"""
Schemas de usuário para tipagem do payload JWT.
"""
from pydantic import BaseModel
from typing import Optional


class UserPayload(BaseModel):
    """Payload extraído do JWT do Supabase (auth.users)."""
    id: str
    email: str
    role: Optional[str] = "authenticated"
