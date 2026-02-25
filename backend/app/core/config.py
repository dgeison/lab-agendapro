from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str
    
    # JWT Configuration
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Google Calendar Configuration
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    
    # Frontend URL
    frontend_url: str = "http://localhost:5174"
    
    # API Configuration
    api_v1_str: str = "/api/v1"
    project_name: str = "AgendaPro API"
    
    # Environment
    environment: str = "development"
    
    class Config:
        env_file = ".env"


settings = Settings()