"""
Lógica de negócio para Alunos (Students).

Todas as funções recebem o cliente Supabase autenticado (RLS-aware)
como parâmetro, garantindo isolamento multi-tenant automático.
"""
from typing import List
from fastapi import HTTPException, status
from supabase import Client

from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse

import logging

logger = logging.getLogger(__name__)


async def create_student(
    db: Client, data: StudentCreate, user_id: str
) -> StudentResponse:
    """Criar novo aluno vinculado ao profissional."""
    student_dict = data.model_dump()
    student_dict["user_id"] = user_id

    try:
        response = db.table("students").insert(student_dict).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar aluno",
            )
        return StudentResponse(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar aluno: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def list_students(db: Client) -> List[StudentResponse]:
    """Listar todos os alunos do profissional autenticado (RLS filtra)."""
    try:
        response = (
            db.table("students")
            .select("*")
            .order("full_name")
            .execute()
        )
        return [StudentResponse(**s) for s in response.data]
    except Exception as e:
        logger.error(f"Erro ao listar alunos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def get_student(db: Client, student_id: str) -> StudentResponse:
    """Buscar aluno por ID (RLS garante que pertence ao profissional)."""
    try:
        response = (
            db.table("students")
            .select("*")
            .eq("id", student_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aluno não encontrado",
            )
        return StudentResponse(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar aluno: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def update_student(
    db: Client, student_id: str, data: StudentUpdate
) -> StudentResponse:
    """Atualizar dados de um aluno (RLS garante que pertence ao profissional)."""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if not update_data:
        return await get_student(db, student_id)

    try:
        response = (
            db.table("students")
            .update(update_data)
            .eq("id", student_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aluno não encontrado",
            )
        return StudentResponse(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar aluno: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def delete_student(db: Client, student_id: str) -> dict:
    """Remover aluno (RLS garante que pertence ao profissional)."""
    try:
        response = (
            db.table("students")
            .delete()
            .eq("id", student_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aluno não encontrado",
            )
        return {"message": "Aluno removido com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover aluno: {e}")
        raise HTTPException(status_code=500, detail=str(e))
