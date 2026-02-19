from app.core.supabase import supabase_admin
from app.schemas.students import StudentCreate, StudentUpdate, StudentResponse
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

async def create_student(student_data: StudentCreate, user_id: str) -> StudentResponse:
    """Criar um novo aluno vinculado ao profissional (user_id)."""
    data = student_data.model_dump()
    data["user_id"] = user_id

    try:
        response = supabase_admin.table("students").insert(data).execute()
        return StudentResponse(**response.data[0])
    except Exception as e:
        logger.error(f"Erro ao criar aluno: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_students(user_id: str) -> list[StudentResponse]:
    """Listar todos os alunos do profissional."""
    try:
        response = supabase_admin.table("students").select("*").eq("user_id", user_id).order("full_name").execute()
        return [StudentResponse(**student) for student in response.data]
    except Exception as e:
        logger.error(f"Erro ao listar alunos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_student_by_id(student_id: str, user_id: str) -> StudentResponse:
    """Buscar um aluno específico."""
    try:
        response = supabase_admin.table("students").select("*").eq("id", student_id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        return StudentResponse(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar aluno: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def update_student(student_id: str, student_data: StudentUpdate, user_id: str) -> StudentResponse:
    """Atualizar dados de um aluno."""
    # Filtrar apenas campos não nulos
    update_data = {k: v for k, v in student_data.model_dump().items() if v is not None}
    
    if not update_data:
        # Se não há nada para atualizar, retorna o registro atual
        return await get_student_by_id(student_id, user_id)

    try:
        response = supabase_admin.table("students").update(update_data).eq("id", student_id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        return StudentResponse(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar aluno: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def delete_student(student_id: str, user_id: str):
    """Remover um aluno."""
    try:
        response = supabase_admin.table("students").delete().eq("id", student_id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        return {"message": "Aluno removido com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover aluno: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
