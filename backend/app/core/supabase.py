from supabase import create_client, Client
from app.core.config import settings

# Criar cliente do Supabase com chave anônima (para operações públicas)
supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)

# Criar cliente do Supabase com service role (para operações administrativas)
supabase_admin: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)