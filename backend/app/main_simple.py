from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Criar instância do FastAPI
app = FastAPI(
    title="AgendaPro API",
    version="1.0.0",
    description="API para o AgendaPro - Sistema de Agendamento para Profissionais Liberais"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # URLs do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AgendaPro API está funcionando!", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/api/v1/test")
async def test_endpoint():
    return {"message": "Endpoint de teste funcionando!", "data": {"timestamp": "2025-10-09"}}