# ============================================
# AgendaPro Backend – Dockerfile (Dev + Prod ready)
# ============================================
FROM python:3.11-slim AS base

# Evitar prompts interativos e bufferização de stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependências de sistema necessárias para compilar pacotes Python
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Criar usuário não-root para segurança
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

# Copiar e instalar dependências (camada cacheável)
COPY requirements.txt requirements_google.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt -r requirements_google.txt

# Copiar código-fonte da aplicação
COPY . .

# Ajustar permissões para o usuário não-root
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Comando padrão: desenvolvimento com hot-reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
