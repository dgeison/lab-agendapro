# ============================================
# AgendaPro Frontend – Dockerfile (Dev + Prod ready)
# ============================================
FROM node:20-alpine AS base

WORKDIR /app

# Copiar manifests de dependência (camada cacheável)
COPY package.json package-lock.json ./

# Instalar dependências DENTRO do container
# O node_modules fica no container e não é sobrescrito pelo bind mount
RUN npm ci

# Copiar código-fonte
COPY . .

EXPOSE 5174

# Comando padrão: desenvolvimento com hot-reload exposto ao host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
