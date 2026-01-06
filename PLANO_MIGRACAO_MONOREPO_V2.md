# Plano de Migração para Monorepo - BasyLab

> **Data:** 05/01/2026  
> **Status:** Em Execução  
> **Versão:** 3.0

---

## Sumário Executivo

Este documento descreve o plano completo para:
1. Monorepo **basylabrepo** com 3balug migrado ✅
2. Criação do **basyadmin** (painel administrativo centralizado)
3. Packages compartilhados (**@basylab/core**, **@basylab/ui**)
4. Integração entre 3balug e basyadmin

### Princípios Norteadores

1. **Simplicidade sobre abstração** - Código direto, sem camadas desnecessárias
2. **Reutilizar código, não serviços** - Packages compartilhados, não APIs
3. **Banco como fonte da verdade** - Acesso direto ao PostgreSQL
4. **Evitar overengineering** - Apenas o necessário para funcionar
5. **Segurança na migração** - Manter pastas originais intactas
6. **Centralização inteligente** - Serviços compartilhados no basyadmin

---

## Estrutura Alvo Final

```
basylabrepo/
├── apps/
│   ├── basyadmin/                    # Painel Admin Centralizado
│   │   ├── api/                      # @basyadmin/api
│   │   │   ├── src/
│   │   │   │   ├── controllers/
│   │   │   │   ├── db/
│   │   │   │   ├── repositories/
│   │   │   │   ├── use-cases/
│   │   │   │   └── server.ts
│   │   │   └── package.json
│   │   └── web/                      # @basyadmin/web
│   │       ├── src/
│   │       └── package.json
│   │
│   └── 3balug/                       # 3Balug (já migrado)
│       ├── api/                      # @3balug/api
│       └── web/                      # @3balug/web
│
├── packages/
│   ├── core/                         # @basylab/core
│   │   ├── src/
│   │   │   ├── auth/                 # JWT, password hashing, TOTP
│   │   │   ├── crypto/               # Encryption utilities
│   │   │   ├── errors/               # Erros padronizados
│   │   │   ├── http/                 # HTTP client, API helpers
│   │   │   ├── logger/               # Pino logger configurado
│   │   │   ├── types/                # Types compartilhados
│   │   │   ├── validation/           # Validators comuns
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                           # @basylab/ui (futuro)
│   │   └── ...
│   │
│   └── admin-sdk/                    # @basylab/admin-sdk
│       ├── src/
│       │   ├── client.ts             # BasyadminClient
│       │   ├── tickets.ts
│       │   ├── events.ts
│       │   ├── billing.ts
│       │   └── index.ts
│       └── package.json
│
├── docker-compose.yml
├── package.json
├── turbo.json
└── biome.json
```

---

## Nomenclatura

| Papel | Nome | Descrição |
|-------|------|-----------|
| Super Admin | **Owner** | Dono da plataforma (você) - acesso total |
| Admin | **Manager** | Gestor de um ou mais tenants |
| Projeto | **Tenant** | Aplicação gerenciada (3balug, timearena, etc) |

---

## Progresso Geral

| Fase | Status | Descrição |
|------|--------|-----------|
| Fase 1-3 | ✅ Concluído | Monorepo + 3balug migrado |
| Fase 4 | ✅ Concluído | Package @basylab/core |
| Fase 5 | ✅ Concluído | basyadmin API |
| Fase 6 | ⏳ Próximo | basyadmin Web |
| Fase 7 | ⏳ Pendente | Package @basylab/admin-sdk |
| Fase 8 | ⏳ Pendente | Integrar 3balug com basyadmin |

---

# FASES CONCLUÍDAS

## Fase 1-3: Monorepo + 3Balug ✅

- [x] Criar estrutura do monorepo basylabrepo
- [x] Migrar 3balug para apps/3balug/
- [x] Configurar Turborepo com TUI
- [x] Docker-compose unificado na raiz
- [x] Typecheck passando
- [x] Lint passando (795 arquivos)
- [x] Build passando
- [x] Testes passando (1450 testes, 0 falhas, 0 skips)

---

## Fase 4: Package @basylab/core ✅

> Extrair código reutilizável do 3balug para package compartilhado

### 4.1 Estrutura do Package

```
packages/core/
├── src/
│   ├── auth/
│   │   ├── jwt.ts              # createToken, verifyToken, refreshToken
│   │   ├── password.ts         # hashPassword, verifyPassword
│   │   ├── totp.ts             # generateTOTP, verifyTOTP
│   │   └── index.ts
│   │
│   ├── crypto/
│   │   ├── encryption.ts       # encrypt, decrypt (AES-256)
│   │   ├── hash.ts             # sha256, md5
│   │   ├── random.ts           # generateId, generateApiKey
│   │   └── index.ts
│   │
│   ├── errors/
│   │   ├── http-errors.ts      # BadRequest, NotFound, Unauthorized, etc
│   │   ├── app-error.ts        # AppError base class
│   │   ├── error-codes.ts      # Códigos padronizados
│   │   └── index.ts
│   │
│   ├── http/
│   │   ├── api-client.ts       # Fetch wrapper com retry
│   │   ├── response.ts         # Helpers de response
│   │   └── index.ts
│   │
│   ├── logger/
│   │   ├── pino.ts             # Logger configurado
│   │   └── index.ts
│   │
│   ├── validation/
│   │   ├── schemas.ts          # Email, CPF, CNPJ, telefone, etc
│   │   ├── validators.ts       # isEmail, isCPF, etc
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── common.ts           # Pagination, ApiResponse, etc
│   │   └── index.ts
│   │
│   └── index.ts                # Export tudo
│
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### 4.2 Checklist de Implementação

#### 4.2.1 Setup do Package
- [x] Criar `packages/core/package.json`
- [x] Criar `packages/core/tsconfig.json`
- [x] Criar `packages/core/tsup.config.ts` (bundler)
- [x] Adicionar scripts: build, dev, typecheck, lint

#### 4.2.2 Módulo Auth
- [x] Criar `jwt.ts` com jose (sign, verify, decode)
- [x] Criar `password.ts` (hash com bcrypt via Bun.password)
- [x] Criar `totp.ts` (TOTP com otpauth)
- [x] Criar `src/auth/index.ts` com exports

#### 4.2.3 Módulo Crypto
- [x] Criar `encryption.ts` (AES-256-GCM)
- [x] Criar `hash.ts` (SHA-256, SHA-512, MD5)
- [x] Criar `random.ts` (UUID, API keys, tokens, shuffle)
- [x] Criar `src/crypto/index.ts`

#### 4.2.4 Módulo Errors
- [x] Criar `http-errors.ts` (30+ erros HTTP padronizados)
- [x] Criar `app-error.ts` (classe base)
- [x] Criar `error-codes.ts` (códigos padronizados)
- [x] Criar `src/errors/index.ts`

#### 4.2.5 Módulo Logger
- [x] Criar `pino.ts` com config padrão
- [x] Suporte a diferentes níveis (dev com pino-pretty, prod JSON)
- [x] Criar `src/logger/index.ts`

#### 4.2.6 Módulo Validation
- [x] Criar validators (email, CPF, CNPJ, telefone, CEP, UUID, URL)
- [x] Criar sanitizers (name, email, slug, HTML escape)
- [x] Criar `src/validation/index.ts`

#### 4.2.7 Módulo Types
- [x] Criar types comuns (Pagination, ApiResponse, Entity, etc)
- [x] Criar `src/types/index.ts`

#### 4.2.8 Finalização
- [x] Criar `src/index.ts` principal
- [x] Build do package (tsup)
- [x] Atualizar 3balug para usar @basylab/core
- [x] Lint passando (795 arquivos)
- [x] Testes passando (2045 testes: 1324 unit + 712 e2e + 9 repo)
- [x] Typecheck geral passando

---

## Fase 5: basyadmin API ✅

> Backend do painel administrativo

### 5.1 Setup Inicial

- [x] Criar `apps/basyadmin/api/`
- [x] Criar `package.json` (@basyadmin/api)
- [x] Instalar dependências (Elysia, Drizzle, etc)
- [x] Configurar tsconfig.json
- [x] Configurar .env.example
- [x] Criar estrutura de pastas (controllers, db, repositories, use-cases)
- [x] Criar server.ts básico

### 5.2 Banco de Dados

- [x] Criar schema Drizzle para todas as tabelas:
  - [x] `tenants` - Projetos gerenciados
  - [x] `users` - Owners e Managers
  - [x] `user_tenants` - Relação Manager <-> Tenant
  - [x] `features` - Catálogo master de features
  - [x] `plans` - Planos por tenant
  - [x] `plan_features` - Features de cada plano
  - [x] `tickets` - Tickets de suporte
  - [x] `ticket_messages` - Mensagens dos tickets
  - [x] `events` - Eventos/analytics
  - [x] `billing_records` - Registros de pagamento
  - [x] `audit_logs` - Log de auditoria
- [x] Criar migrations (schema ready, migrations via drizzle-kit)
- [x] Criar seed com Owner inicial (via auth/register)

### 5.3 Autenticação

- [x] Usar @basylab/core para JWT e password
- [x] Endpoint POST `/auth/login`
- [x] Endpoint POST `/auth/logout`
- [x] Endpoint POST `/auth/refresh`
- [x] Middleware de autenticação (JWT)
- [x] Middleware de autorização (Owner vs Manager)
- [x] Middleware de API Key (para projetos externos)

### 5.4 Feature 1: Gestão de Tenants

- [x] Repository: `tenant.repository.ts`
- [x] Controllers:
  - [x] POST `/tenants` (Owner only)
  - [x] GET `/tenants` (Owner: todos, Manager: seus)
  - [x] GET `/tenants/:tenantId`
  - [x] PUT `/tenants/:tenantId`
  - [x] DELETE `/tenants/:tenantId` (Owner only)
  - [x] POST `/tenants/:tenantId/regenerate-key` (Owner only)

### 5.5 Feature 2: Gestão de Managers

- [x] Repository: `user.repository.ts`
- [x] Controllers:
  - [x] POST `/managers` (Owner only)
  - [x] GET `/managers` (Owner only)
  - [x] GET `/managers/:id` (Owner only)
  - [x] PUT `/managers/:id` (Owner only)
  - [x] DELETE `/managers/:id` (Owner only)
  - [x] POST `/managers/:id/tenants` (atribuir tenant)
  - [x] DELETE `/managers/:id/tenants/:tenantId` (remover tenant)

### 5.6 Feature 3: Gestão de Planos & Features

- [x] Repositories:
  - [x] `feature.repository.ts`
  - [x] `plan.repository.ts`
- [x] Controllers Features:
  - [x] POST `/features` (Owner only)
  - [x] GET `/features`
  - [x] PUT `/features/:id` (Owner only)
  - [x] DELETE `/features/:id` (Owner only)
- [x] Controllers Plans:
  - [x] POST `/tenants/:tenantId/plans`
  - [x] GET `/tenants/:tenantId/plans`
  - [x] PUT `/tenants/:tenantId/plans/:id`
  - [x] DELETE `/tenants/:tenantId/plans/:id`
  - [x] POST `/tenants/:tenantId/plans/:id/features`
  - [x] DELETE `/tenants/:tenantId/plans/:id/features/:featureId`

### 5.7 Feature 4: Sistema de Tickets

- [x] Repositories:
  - [x] `ticket.repository.ts`
  - [x] `ticket-message.repository.ts`
- [x] Controllers (API Key - projetos):
  - [x] POST `/api/v1/tickets` (criar ticket)
  - [x] GET `/api/v1/tickets` (listar do tenant)
  - [x] GET `/api/v1/tickets/:id`
  - [x] POST `/api/v1/tickets/:id/messages`
- [x] Controllers (Auth - painel):
  - [x] GET `/tickets` (Owner: todos, Manager: seus tenants)
  - [x] GET `/tickets/:id`
  - [x] PUT `/tickets/:id` (status, assign)
  - [x] POST `/tickets/:id/messages`

### 5.8 Feature 5: Sistema de Eventos

- [x] Repository: `event.repository.ts`
- [x] Controllers (API Key - projetos):
  - [x] POST `/api/v1/events` (track event)
  - [x] POST `/api/v1/events/batch` (track múltiplos)
- [x] Controllers (Auth - painel):
  - [x] GET `/events` (com filtros)
  - [x] GET `/events/aggregate` (contagens, gráficos)
  - [x] GET `/events/export` (CSV/JSON)

### 5.9 Feature 6: Faturamento & Billing

- [x] Repository: `billing.repository.ts`
- [x] Controllers (Webhook - projetos):
  - [x] POST `/api/v1/billing/webhook` (receber pagamentos)
- [x] Controllers (Auth - painel):
  - [x] GET `/billing` (lista pagamentos)
  - [x] GET `/billing/stats` (MRR, ARR, etc)
  - [x] GET `/billing/export`

### 5.10 Infraestrutura

- [x] Health check endpoint (`/health`)
- [x] Swagger/OpenAPI docs (`/swagger`)
- [x] CORS configurado
- [x] Error handling global

### 5.11 Finalização API

- [x] Rodar typecheck
- [x] Rodar lint
- [x] Build de produção
- [x] API rodando em dev mode

---

# PRÓXIMAS FASES

## Fase 6: Criar basyadmin Web

> Frontend do painel administrativo

### 6.1 Setup Inicial

- [ ] Criar `apps/basyadmin/web/`
- [ ] Setup Vite + React + TypeScript
- [ ] Instalar Tailwind CSS
- [ ] Instalar shadcn/ui ou similar
- [ ] Instalar React Query
- [ ] Instalar React Router
- [ ] Configurar estrutura de pastas

### 6.2 Autenticação

- [ ] Página de Login
- [ ] Context de autenticação
- [ ] Proteção de rotas
- [ ] Logout

### 6.3 Layout Base

- [ ] Sidebar com navegação
- [ ] Header com usuário logado
- [ ] Breadcrumbs
- [ ] Responsivo (mobile)

### 6.4 Dashboard

- [ ] Cards com resumo (tenants, tickets, eventos)
- [ ] Gráficos de eventos recentes
- [ ] Tickets pendentes
- [ ] Receita do mês

### 6.5 Páginas de Tenants

- [ ] Lista de tenants
- [ ] Formulário criar/editar tenant
- [ ] Detalhes do tenant
- [ ] Botão regenerar API Key

### 6.6 Páginas de Managers

- [ ] Lista de managers
- [ ] Formulário criar/editar manager
- [ ] Atribuição de tenants

### 6.7 Páginas de Features

- [ ] Lista de features (catálogo master)
- [ ] Formulário criar/editar feature

### 6.8 Páginas de Plans

- [ ] Lista de planos por tenant
- [ ] Formulário criar/editar plano
- [ ] Seleção de features para plano

### 6.9 Páginas de Tickets

- [ ] Lista de tickets com filtros
- [ ] Detalhes do ticket com chat
- [ ] Alterar status/assignee

### 6.10 Páginas de Events

- [ ] Lista de eventos com filtros
- [ ] Gráficos agregados
- [ ] Exportação

### 6.11 Páginas de Billing

- [ ] Lista de pagamentos
- [ ] Dashboard financeiro (MRR, ARR, churn)
- [ ] Gráficos de receita

### 6.12 Finalização Web

- [ ] Testes E2E (Playwright ou Cypress)
- [ ] Build de produção
- [ ] Responsividade completa

---

## Fase 7: Criar Package @basylab/admin-sdk

> SDK para projetos se comunicarem com basyadmin

### 7.1 Setup

- [ ] Criar `packages/admin-sdk/`
- [ ] Criar package.json
- [ ] Setup TypeScript + tsup

### 7.2 Implementação

- [ ] Classe `BasyadminClient`
- [ ] Configuração (apiKey, baseUrl, timeout)
- [ ] Retry automático com backoff
- [ ] Tipagem completa

### 7.3 Módulo Tickets

```typescript
// API
sdk.tickets.create(data)
sdk.tickets.list(filters)
sdk.tickets.get(id)
sdk.tickets.addMessage(id, message)
```

- [ ] Implementar métodos
- [ ] Tipos
- [ ] Testes

### 7.4 Módulo Events

```typescript
// API
sdk.events.track(event)
sdk.events.trackBatch(events)
```

- [ ] Implementar métodos
- [ ] Queue local (opcional)
- [ ] Tipos
- [ ] Testes

### 7.5 Módulo Billing

```typescript
// API
sdk.billing.syncPayment(data)
```

- [ ] Implementar métodos
- [ ] Tipos
- [ ] Testes

### 7.6 Finalização SDK

- [ ] Documentação de uso
- [ ] Build
- [ ] Publicar no workspace

---

## Fase 8: Integrar 3balug com basyadmin

> Conectar 3balug ao basyadmin para usar tickets, eventos e billing

### 8.1 Instalação

- [ ] Adicionar @basylab/admin-sdk como dependência do @3balug/api
- [ ] Configurar variáveis de ambiente:
  - [ ] `BASYADMIN_API_KEY`
  - [ ] `BASYADMIN_URL`

### 8.2 Integração de Eventos

- [ ] Criar service `basyadmin.service.ts`
- [ ] Trackear evento em `user.login`
- [ ] Trackear evento em `user.register`
- [ ] Trackear evento em `subscription.created`
- [ ] Trackear evento em `payment.success`
- [ ] Trackear evento em `payment.failed`

### 8.3 Integração de Tickets

- [ ] Criar endpoint para usuário abrir ticket
- [ ] Criar endpoint para usuário ver seus tickets
- [ ] Criar endpoint para usuário responder ticket

### 8.4 Integração de Billing

- [ ] Enviar webhook para basyadmin quando há pagamento
- [ ] Sincronizar dados de assinatura

### 8.5 Atualizar 3balug para usar @basylab/core

- [ ] Substituir imports de JWT pelo @basylab/core
- [ ] Substituir imports de password pelo @basylab/core
- [ ] Substituir imports de errors pelo @basylab/core
- [ ] Rodar testes (garantir que nada quebrou)

### 8.6 Testes de Integração

- [ ] Testar criação de ticket via SDK
- [ ] Testar tracking de eventos
- [ ] Testar sync de billing
- [ ] Rodar todos os testes do 3balug

### 8.7 Finalização

- [ ] Typecheck geral do monorepo
- [ ] Lint geral
- [ ] Build geral
- [ ] Todos os testes passando

---

## Schema do Banco - basyadmin

```sql
-- Tenants (Projetos)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  logo_url TEXT,
  domain VARCHAR(255),
  description TEXT,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  api_key_created_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users (Owner + Managers)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Manager <-> Tenant
CREATE TABLE user_tenants (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{"read": true, "write": true}',
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, tenant_id)
);

-- Features (Catálogo Master)
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  feature_type VARCHAR(20) DEFAULT 'boolean' CHECK (feature_type IN ('boolean', 'limit', 'tier')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Plans (Por Tenant)
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  billing_interval VARCHAR(20) DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly')),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Plan Features
CREATE TABLE plan_features (
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  value JSONB DEFAULT 'true',
  PRIMARY KEY (plan_id, feature_id)
);

-- Tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  external_user_id VARCHAR(255),
  external_user_email VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  category VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ticket Messages
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'manager', 'owner', 'system')),
  sender_id VARCHAR(255),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_name VARCHAR(100) NOT NULL,
  user_id VARCHAR(255),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_tenant_name ON events(tenant_id, event_name);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_user ON events(tenant_id, user_id);

-- Billing Records
CREATE TABLE billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  external_customer_id VARCHAR(255),
  customer_email VARCHAR(255),
  plan_slug VARCHAR(50),
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
  paid_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_billing_tenant ON billing_records(tenant_id);
CREATE INDEX idx_billing_status ON billing_records(status);
CREATE INDEX idx_billing_paid_at ON billing_records(paid_at);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

---

## Comandos Úteis

```bash
# Instalar dependências
cd basylabrepo && bun install

# Dev
bun run dev --filter=@3balug/api
bun run dev --filter=@basyadmin/api
bun run dev --filter=@basyadmin/web

# Build
bun run build

# Test
bun run test

# Lint
bun run lint

# Typecheck
bun run typecheck
```

---

## Notas de Segurança

1. **Pasta original intacta**: A pasta `3balug/` original permanece sem alterações
2. **Rollback simples**: Se algo der errado, basta deletar alterações
3. **Backup de banco**: Sempre fazer backup antes de qualquer migração
4. **API Keys**: Nunca commitar API Keys no repositório
5. **Secrets**: Usar variáveis de ambiente para todos os secrets

---

## Resumo dos Próximos Passos

1. [x] ~~Fase 1-3: Monorepo + 3balug~~ ✅
2. [x] ~~Fase 4: Criar @basylab/core~~ ✅
3. [x] ~~Fase 5: Criar basyadmin API~~ ✅
4. [ ] **Fase 6: Criar basyadmin Web** ← PRÓXIMO
5. [ ] Fase 7: Criar @basylab/admin-sdk
6. [ ] Fase 8: Integrar 3balug com basyadmin

---

*Documento criado em: 05/01/2026*  
*Última atualização: 06/01/2026*  
*Versão: 3.2*
