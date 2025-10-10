from fastapi import APIRouter, HTTPException
from app.core.supabase import supabase_admin
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/setup", tags=["setup"])


@router.post("/create-credentials-table")
async def create_credentials_table():
    """Criar tabela de credenciais de usuário (apenas para setup inicial)."""
    try:
        # Verificar se a tabela já existe
        try:
            existing = supabase_admin.table("user_credentials").select("*").limit(1).execute()
            return {"message": "Tabela user_credentials já existe"}
        except:
            pass
        
        # Criar a tabela via SQL
        create_table_sql = """
        CREATE TABLE user_credentials (
            id UUID PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        # Como não conseguimos executar SQL diretamente, vamos simular criando um registro
        # que vai falhar e nos dizer se a tabela existe
        test_data = {
            "id": "00000000-0000-0000-0000-000000000000",
            "email": "test@test.com",
            "password_hash": "test"
        }
        
        try:
            result = supabase_admin.table("user_credentials").insert(test_data).execute()
            # Se chegou até aqui, a tabela existe, vamos deletar o registro de teste
            supabase_admin.table("user_credentials").delete().eq("id", "00000000-0000-0000-0000-000000000000").execute()
            return {"message": "Tabela user_credentials já existe e está funcionando"}
        except Exception as e:
            if "relation \"user_credentials\" does not exist" in str(e):
                return {
                    "message": "Tabela user_credentials não existe. Por favor, execute o SQL manualmente no Supabase:",
                    "sql": create_table_sql
                }
            else:
                return {"message": f"Erro ao testar tabela: {str(e)}"}
                
    except Exception as e:
        logger.error(f"Erro ao criar tabela: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))