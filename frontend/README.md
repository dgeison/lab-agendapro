# AgendaPro Frontend

Frontend da aplicação AgendaPro construído com React, TypeScript, Vite e Tailwind CSS.

## Tecnologias Utilizadas

- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Superset JavaScript com tipagem estática
- **Vite** - Build tool e servidor de desenvolvimento
- **Tailwind CSS** - Framework CSS utility-first
- **React Router DOM** - Roteamento para React
- **Axios** - Cliente HTTP para chamadas de API

## Instalação

1. Instalar Node.js (versão 18 ou superior)
2. Instalar dependências:
```bash
npm install
```

3. Executar em modo de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build para produção
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa verificação de lint

## Estrutura do Projeto

```
src/
├── components/        # Componentes reutilizáveis
├── contexts/         # Context providers (AuthContext)
├── pages/           # Páginas da aplicação
├── services/        # Serviços de API
├── types/           # Definições de tipos TypeScript
├── App.tsx          # Componente principal
└── main.tsx         # Ponto de entrada da aplicação
```

## Funcionalidades Implementadas

- ✅ Autenticação (Login/Signup)
- ✅ Rotas protegidas
- ✅ Context de autenticação
- ✅ Dashboard básico
- ✅ Integração com API FastAPI

## Próximos Passos

- [ ] Módulo de gestão de serviços
- [ ] Integração com Google Calendar
- [ ] Sistema de agendamento público
- [ ] Integração com Stripe
- [ ] Notificações e confirmações