from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, test, services, public, appointments, setup, setup

# Criar instância do FastAPI
app = FastAPI(
    title=settings.project_name,
    version="1.0.0",
    description="API para o AgendaPro - Sistema de Agendamento para Profissionais Liberais"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Mx-ReqToken",
        "Keep-Alive",
        "X-Requested-With",
        "If-Modified-Since",
        "X-CSRF-Token"
    ]
)

# Incluir routers
app.include_router(auth.router, prefix=settings.api_v1_str)
app.include_router(test.router, prefix=settings.api_v1_str)
app.include_router(services.router, prefix=settings.api_v1_str)
app.include_router(public.router, prefix=settings.api_v1_str)
app.include_router(appointments.router, prefix=settings.api_v1_str)
app.include_router(setup.router, prefix=settings.api_v1_str)


@app.get("/")
async def root():
    return {"message": "AgendaPro API está funcionando!"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}