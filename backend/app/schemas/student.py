"""
Schemas Pydantic para o domínio de Alunos (Students).
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class StudentCreate(BaseModel):
    """Dados para criação de um aluno."""
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class StudentUpdate(BaseModel):
    """Dados para atualização parcial de um aluno."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class StudentResponse(BaseModel):
    """Resposta de um aluno (leitura)."""
    id: str
    user_id: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
