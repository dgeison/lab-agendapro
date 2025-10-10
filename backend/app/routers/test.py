from fastapi import APIRouter
from app.core.supabase import supabase

router = APIRouter(prefix="/test", tags=["test"])

@router.get("/supabase")
async def test_supabase():
    """Teste de conexão com Supabase."""
    try:
        # Tentar fazer uma query simples
        response = supabase.table("profiles").select("*").limit(1).execute()
        return {
            "status": "success", 
            "message": "Conexão com Supabase OK",
            "data": response.data
        }
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Erro na conexão: {str(e)}"
        }