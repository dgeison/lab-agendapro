# AgendaPro Backend

Backend da aplicação AgendaPro construído com FastAPI.

## Instalação

1. Criar ambiente virtual:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Instalar dependências:
```bash
pip install -r requirements.txt
```

3. Configurar variáveis de ambiente:
```bash
copy .env.example .env
```

Editar o arquivo `.env` com suas configurações do Supabase.

4. Executar a aplicação:
```bash
python run.py
```

A API estará disponível em `http://localhost:8000`

## Documentação da API

Com a aplicação rodando, acesse:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints Principais

- `POST /api/v1/auth/signup` - Registrar novo usuário
- `POST /api/v1/auth/login` - Fazer login
- `GET /api/v1/auth/me` - Obter dados do usuário atual (requer autenticação)