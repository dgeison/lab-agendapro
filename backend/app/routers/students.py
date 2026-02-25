"""
Router de Alunos (Students).
Todas as rotas são protegidas (autenticação obrigatória).
"""
from typing import List
from fastapi import APIRouter, Depends
from supabase import Client

from app.core.dependencies import get_current_user, get_supabase_client
from app.schemas.user import UserPayload
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse
from app.services.student_logic import (
    create_student,
    list_students,
    get_student,
    update_student,
    delete_student,
)

router = APIRouter(prefix="/students", tags=["students"])


@router.post("/", response_model=StudentResponse)
async def create(
    data: StudentCreate,
    user: UserPayload = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Criar um novo aluno."""
    return await create_student(db, data, user.id)


@router.get("/", response_model=List[StudentResponse])
async def list_all(
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """Listar todos os alunos do profissional autenticado."""
    return await list_students(db)


@router.get("/{student_id}", response_model=StudentResponse)
async def get_one(
    student_id: str,
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """Buscar um aluno por ID."""
    return await get_student(db, student_id)


@router.put("/{student_id}", response_model=StudentResponse)
async def update(
    student_id: str,
    data: StudentUpdate,
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """Atualizar dados de um aluno."""
    return await update_student(db, student_id, data)


@router.delete("/{student_id}")
async def delete(
    student_id: str,
    db: Client = Depends(get_supabase_client),
    _user: UserPayload = Depends(get_current_user),
):
    """Remover um aluno."""
    return await delete_student(db, student_id)
