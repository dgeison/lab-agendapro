# AgendaPro - Sistema de Agendamento para Profissionais Liberais

O **AgendaPro** é um SaaS (Software as a Service) projetado para profissionais liberais e autônomos automatizarem o ciclo completo de agendamento e pagamento.

## 🎯 Visão Geral

O sistema resolve as principais dores dos profissionais autônomos:
- Organização de horários
- Evitar conflitos de agenda
- Garantir pagamento antecipado
- Reduzir o "no-show" (não comparecimento)

## 🛠️ Stack Tecnológica

### Backend
- **Python 3.11+** com **FastAPI**
- **Supabase** (PostgreSQL + Auth + Storage)
- **Stripe** para pagamentos
- **Google Calendar API** para integração de agenda

### Frontend
- **React 18** com **TypeScript**
- **Vite** como build tool
- **Tailwind CSS** para estilização
- **React Router DOM** para roteamento
- **Axios** para chamadas HTTP

## 📁 Estrutura do Projeto

```
agenda_pro/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── core/           # Configurações, segurança, Supabase
│   │   ├── models/         # Modelos de dados
│   │   ├── routers/        # Endpoints da API
│   │   ├── schemas/        # Schemas Pydantic
│   │   ├── services/       # Lógica de negócio
│   │   └── main.py         # Aplicação principal
│   ├── requirements.txt    # Dependências Python
│   └── run.py             # Script para executar o servidor
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── contexts/       # Context providers
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── services/      # Serviços de API
│   │   └── types/         # Tipos TypeScript
│   ├── package.json       # Dependências Node.js
│   └── vite.config.ts     # Configuração do Vite
└── database/              # Scripts SQL
    └── supabase_setup.sql # Setup do banco de dados
```

## 🏗️ Arquitetura do Banco de Dados

### Tabelas Principais

1. **`profiles`** - Dados públicos dos profissionais
   - Ligada à `auth.users` do Supabase
   - Inclui `public_slug` para URLs públicas

2. **`services`** - Serviços oferecidos
   - Vinculados aos profissionais
   - Preço, duração, descrição

3. **`appointments`** - Agendamentos
   - Status de pagamento
   - Integração com Stripe

4. **`user_google_tokens`** - Tokens OAuth do Google
   - Armazenamento seguro para integração com Calendar

## 🚀 Funcionalidades Implementadas (MVP)

### ✅ Módulo de Autenticação
- Cadastro e login de profissionais
- Proteção de rotas com JWT
- Context de autenticação no React

### ✅ Dashboard Básico
- Visualização de dados do perfil
- Navegação autenticada
- Logout funcional

## 📋 Próximas Funcionalidades

### 🔄 Em Desenvolvimento
1. **Gestão de Serviços** - CRUD completo
2. **Integração Google Calendar** - OAuth2 seguro
3. **Página Pública de Agendamento** - Interface para clientes
4. **Sistema de Pagamentos** - Stripe Checkout
5. **Notificações** - Email e SMS

## 🛡️ Segurança

- **Row Level Security (RLS)** no Supabase
- **JWT** para autenticação
- **HTTPS** obrigatório em produção
- **Validação** de dados com Pydantic
- **CORS** configurado adequadamente

## 🔧 Como Executar

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- Conta no Supabase
- Conta no Stripe (para pagamentos)

### Configuração do Backend

1. **Instalar dependências:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
# Editar .env com suas credenciais do Supabase
```

3. **Executar servidor:**
```bash
python run.py
```

### Configuração do Frontend

1. **Instalar dependências:**
```bash
cd frontend
npm install
```

2. **Executar aplicação:**
```bash
npm run dev
```

### Configuração do Banco de Dados

1. Criar projeto no Supabase
2. Executar o script `database/supabase_setup.sql` no SQL Editor
3. Configurar as variáveis de ambiente com as credenciais

## 🌐 URLs da Aplicação

- **API Backend:** http://localhost:8000
- **Documentação da API:** http://localhost:8000/docs
- **Frontend:** http://localhost:5173

## 📝 Modelo de Negócio

### Fluxo do Usuário (Profissional)
1. Cadastro na plataforma
2. Configuração de serviços oferecidos
3. Integração com Google Calendar
4. Compartilhamento da URL pública

### Fluxo do Cliente
1. Acesso à página pública do profissional
2. Seleção de serviço e horário
3. Pagamento via Stripe
4. Confirmação automática no Google Calendar

## 🎨 Design System

- **Cores Primárias:** Azul (#3B82F6)
- **Framework:** Tailwind CSS
- **Componentes:** Design responsivo e acessível
- **Tipografia:** Interface limpa e profissional

## 📊 Métricas e Monitoramento

### KPIs Planejados
- Taxa de conversão de agendamentos
- Valor médio por transação
- Redução de no-shows
- Satisfação do cliente

## 🤝 Contribuição

1. Fork do projeto
2. Criar branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit das mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas e suporte:
- Email: suporte@agendapro.com.br
- Documentação: [Acesse a documentação completa]

---

**AgendaPro** - Transformando a gestão de agendamentos para profissionais liberais! 🚀