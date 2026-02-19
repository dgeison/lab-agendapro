from fastapi import APIRouter, Depends
from app.schemas.students import StudentCreate, StudentUpdate, StudentResponse
from app.services.students_service import create_student, get_students, get_student_by_id, update_student, delete_student
from app.core.security import get_current_user

router = APIRouter(prefix="/students", tags=["students"])

@router.post("/", response_model=StudentResponse)
async def create(student: StudentCreate, current_user: dict = Depends(get_current_user)):
    """Criar um novo aluno."""
    return await create_student(student, current_user["id"])

@router.get("/", response_model=list[StudentResponse])
async def list_all(current_user: dict = Depends(get_current_user)):
    """Listar todos os alunos do usuário atual."""
    return await get_students(current_user["id"])

@router.get("/{student_id}", response_model=StudentResponse)
async def get_one(student_id: str, current_user: dict = Depends(get_current_user)):
    """Obter detalhes de um aluno específico."""
    return await get_student_by_id(student_id, current_user["id"])

@router.put("/{student_id}", response_model=StudentResponse)
async def update(student_id: str, student: StudentUpdate, current_user: dict = Depends(get_current_user)):
    """Atualizar dados de um aluno."""
    return await update_student(student_id, student, current_user["id"])

@router.delete("/{student_id}")
async def delete(student_id: str, current_user: dict = Depends(get_current_user)):
    """Remover um aluno."""
    return await delete_student(student_id, current_user["id"])
