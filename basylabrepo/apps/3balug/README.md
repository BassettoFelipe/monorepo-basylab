# 3Balug - CRM Imobiliario

Sistema completo de gestao imobiliaria com autenticacao, planos de assinatura, gestao de imoveis, contratos e leads.

---

## Visao Geral

O 3Balug e uma plataforma SaaS para gestao imobiliaria que oferece:

- **Autenticacao** - JWT + 2FA via email + recuperacao de senha
- **Planos de Assinatura** - 3 tiers (Basico, Imobiliaria, House) via Pagarme
- **Gestao de Imoveis** - CRUD completo com fotos e documentos
- **Contratos** - Gestao de locacao e venda
- **Leads** - Esteira Kanban com 9 etapas (em desenvolvimento)
- **Multi-tenancy** - Isolamento por empresa com roles (Owner, Manager, Broker, User)

---

## Estrutura do Projeto

```
apps/3balug/
├── api/                    # Backend (@3balug/api)
│   ├── src/
│   │   ├── controllers/    # Routes + Middlewares
│   │   ├── use-cases/      # Business Logic
│   │   ├── repositories/   # Data Access
│   │   ├── services/       # Domain Services
│   │   └── db/             # Drizzle Schema + Migrations
│   └── README.md           # Documentacao da API
│
├── web/                    # Frontend (@3balug/web)
│   ├── src/
│   │   ├── pages/          # React Pages
│   │   ├── components/     # Componentes reutilizaveis
│   │   ├── services/       # API Services
│   │   └── design-system/  # Design System
│   └── README.md           # Documentacao do Frontend
│
├── docs/                   # Documentacao do Projeto
│   ├── ARCHITECTURE.md     # Padroes de arquitetura
│   ├── ROADMAP.md          # Cronograma e features
│   └── reunioes/           # Notas de reunioes com cliente
│       └── 2026-01-05.md
│
└── README.md               # Este arquivo
```

---

## Tecnologias

### Backend (api/)
- **Runtime:** Bun
- **Framework:** Elysia
- **Database:** PostgreSQL + Drizzle ORM
- **Cache:** Redis
- **Storage:** MinIO (S3-compatible)
- **Auth:** JWT + TOTP
- **Payments:** Pagarme

### Frontend (web/)
- **Runtime:** Bun + Vite
- **Framework:** React 19
- **Styling:** Vanilla Extract CSS
- **State:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Router:** React Router v7

---

## Quick Start

### Pre-requisitos

- Bun >= 1.0
- Docker (para PostgreSQL, Redis, MinIO)

### 1. Subir Infraestrutura

Na raiz do monorepo:

```bash
bun run docker:up
```

### 2. Instalar Dependencias

```bash
bun install
```

### 3. Configurar Variaveis de Ambiente

```bash
# API
cp apps/3balug/api/.env.example apps/3balug/api/.env

# Web
cp apps/3balug/web/.env.example apps/3balug/web/.env
```

### 4. Setup do Banco

```bash
cd apps/3balug/api
bun run db:push
bun run db:seed
```

### 5. Iniciar Desenvolvimento

Na raiz do monorepo:

```bash
bun run dev
```

Ou individualmente:

```bash
# API
cd apps/3balug/api && bun run dev

# Web
cd apps/3balug/web && bun run dev
```

---

## Scripts Principais

### Via Turborepo (raiz)

```bash
bun run dev          # Desenvolvimento (todos os apps)
bun run build        # Build de producao
bun run test         # Todos os testes
bun run lint         # Linter
bun run typecheck    # TypeScript check
```

### API Especificos

```bash
cd apps/3balug/api

bun run dev          # Servidor dev
bun run test         # Todos os testes
bun run test:unit    # Testes unitarios
bun run test:e2e     # Testes E2E
bun run db:generate  # Gerar migrations
bun run db:migrate   # Aplicar migrations
bun run db:studio    # Drizzle Studio
```

### Web Especificos

```bash
cd apps/3balug/web

bun run dev          # Servidor dev (Vite)
bun run build        # Build producao
bun run preview      # Preview do build
```

---

## Documentacao

| Documento | Descricao |
|-----------|-----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Padroes de arquitetura obrigatorios |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Cronograma, features e pagamentos |
| [docs/reunioes/](docs/reunioes/) | Notas de reunioes com cliente |
| [api/README.md](api/README.md) | Documentacao completa da API |
| [web/README.md](web/README.md) | Documentacao completa do Frontend |

---

## Arquitetura

O projeto segue **Clean Architecture** com camadas bem definidas:

```
Controllers -> Use Cases -> Repositories -> Database
     |             |              |
  HTTP/API    Business       Data Access
              Logic
```

### Regras Fundamentais

1. **Controllers apenas orquestram** - Nunca acessam repositories diretamente
2. **UseCases recebem entidades** - Nao IDs para buscar depois
3. **Sem comentarios** - Codigo deve ser auto-explicativo
4. **Sem SQL direto** - Sempre usar Drizzle ORM

Veja detalhes completos em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Sistema de Planos

| Plano | Preco | Usuarios | Gestores | Consultas Serasa |
|-------|-------|----------|----------|------------------|
| Basico | R$ 99/mes | 1 | 1 | 5/mes |
| Imobiliaria | R$ 299/mes | 5 | 2 | 50/mes |
| House | R$ 799/mes | Ilimitado | 5 | 200/mes |

---

## Roles e Permissoes

| Role | Descricao | Permissoes |
|------|-----------|------------|
| **OWNER** | Dono da empresa | Acesso total |
| **MANAGER** | Gestor | Gerencia usuarios e dados |
| **BROKER** | Corretor | Acesso aos proprios imoveis |
| **USER** | Usuario basico | Visualizacao |

---

## Status do Projeto

### Completo
- [x] Autenticacao (JWT + 2FA + Recuperacao)
- [x] Sistema de Planos e Checkout
- [x] CRUD de Usuarios com ACL
- [x] CRUD de Imoveis com fotos
- [x] CRUD de Proprietarios
- [x] CRUD de Inquilinos
- [x] CRUD de Contratos
- [x] Dashboard basico
- [x] Upload de arquivos (MinIO)

### Em Desenvolvimento
- [ ] Sistema de Leads (Esteira Kanban)
- [ ] Sistema Financeiro
- [ ] Templates de Contrato
- [ ] Integracao Desk Data (Serasa)
- [ ] Marketplace
- [ ] BI e Relatorios

### Futuro
- [ ] App Mobile (React Native)
- [ ] Assinatura Digital
- [ ] Sistema de Afiliados

Veja o roadmap completo em [docs/ROADMAP.md](docs/ROADMAP.md).

---

## Contato

**Cliente:** Daniel Borges da Silva  
**Desenvolvedor:** Felipe Silveira Bassetto  
**Periodo:** 02/12/2025 - 30/04/2026
