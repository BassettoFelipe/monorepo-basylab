# CRM Imobiliário - Backend

API REST construída com Bun, Elysia e TypeScript seguindo princípios de Clean Architecture.

Sistema completo de gestão imobiliária com:
- 🔐 Autenticação JWT com verificação 2FA (email)
- 💳 Sistema de assinaturas (3 planos: Básico, Imobiliária, House)
- 💰 Integração com Pagarme para processamento de pagamentos
- 📧 Sistema de envio de emails (verificação, recuperação de senha)
- 🛡️ Middleware de validação de limites por plano
- 🔒 Rate limiting e proteção contra abuso

## 🏗️ Arquitetura

Este backend segue os princípios da **Clean Architecture** com separação clara de responsabilidades:

```
Controllers → Use Cases → Repositories → Database
     ↓            ↓              ↓
  HTTP/API   Business Logic   Data Access
```

### Camadas

1. **Controllers/Routes** (`src/controllers/routes/`)
   - Recebem requisições HTTP
   - Validam entrada via schemas
   - Chamam Use Cases
   - Retornam respostas HTTP

2. **Use Cases** (`src/use-cases/`)
   - Contêm a lógica de negócio
   - Orquestram operações entre diferentes repositories
   - São independentes de framework
   - Podem ser testados isoladamente

3. **Repositories** (`src/repositories/`)
   - Abstraem o acesso a dados
   - Implementam o Repository Pattern
   - Contracts (interfaces) + Providers (implementações)

4. **Database** (`src/db/`)
   - Schemas Drizzle
   - Migrations
   - Seeds

## 📁 Estrutura de Pastas Detalhada

```
src/
├── config/                         # Configurações da aplicação
│   ├── constants.ts               # Constantes globais
│   ├── env.ts                     # Validação de env vars (TypeBox)
│   └── logger.ts                  # Configuração do Pino logger
│
├── container/                      # Dependency Injection
│   └── index.ts                   # Container central (exporta tudo)
│
├── controllers/                    # Controllers HTTP
│   ├── index.ts                   # Export centralizado de todas as routes
│   ├── middlewares/               # Middlewares compartilhados
│   │   ├── auth.middleware.ts    # Autenticação JWT
│   │   └── permission.middleware.ts
│   └── routes/                    # Routes organizadas por feature
│       ├── auth/                  # Autenticação
│       │   ├── login/
│       │   │   ├── login.ts      # Controller
│       │   │   └── schema.ts     # Validation schema
│       │   ├── register/
│       │   └── ...
│       ├── customers/             # Clientes
│       ├── leads/                 # Leads
│       └── properties/            # Propriedades
│
├── db/                            # Database
│   ├── schema/                    # Schemas Drizzle (separados por entidade)
│   │   ├── index.ts              # Export todos os schemas
│   │   ├── user.ts
│   │   ├── customer.ts
│   │   ├── lead.ts
│   │   └── property.ts
│   ├── index.ts                   # Configuração da conexão
│   └── seeds/                     # Seeds
│       └── index.ts
│
├── errors/                        # Sistema de erros
│   ├── app.error.ts              # AppError class (padrão principal)
│   ├── error-codes.ts            # Códigos de erro centralizados
│   ├── http-error.ts             # HttpError class (legacy)
│   └── index.ts                   # Exports
│
├── jobs/                          # Background jobs
│   └── ...
│
├── lib/                           # Libs configuradas
│   └── ...
│
├── plugins/                       # Elysia Plugins
│   ├── error-handler.plugin.ts  # Error handling global
│   ├── logger.plugin.ts         # Request/Response logging
│   └── rate-limit.plugin.ts     # Rate limiting
│
├── repositories/                  # Repository Pattern
│   ├── contracts/                # Interfaces (contratos)
│   │   ├── user.repository.ts
│   │   ├── customer.repository.ts
│   │   └── ...
│   └── providers/                # Implementações
│       └── drizzle/              # Implementação com Drizzle
│           ├── user.repository.ts
│           ├── customer.repository.ts
│           └── ...
│
├── scripts/                       # Scripts utilitários
│   └── db-clean.ts               # Limpa banco de dados
│
├── services/                      # Serviços de domínio
│   ├── email.service.ts
│   └── ...
│
├── test/                          # Test helpers
│   └── ...
│
├── use-cases/                     # Business Logic
│   ├── auth/
│   │   ├── login/
│   │   │   ├── login.use-case.ts
│   │   │   └── login.unit.test.ts
│   │   ├── register/
│   │   └── ...
│   ├── customers/
│   ├── leads/
│   └── properties/
│
├── utils/                         # Utilitários
│   ├── crypto.utils.ts           # Hash, random string, UUID
│   ├── jwt.utils.ts              # JWT utilities
│   ├── totp.utils.ts             # TOTP/OTP utilities
│   └── validation.utils.ts       # Validações (CPF, CNPJ, email, etc)
│
└── server.ts                      # Entry point
```

## 🚀 Setup e Instalação

### Pré-requisitos

- Bun >= 1.0
- PostgreSQL >= 14

### 1. Instalar Dependências

```bash
bun install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
# Environment
NODE_ENV=development
PORT=3000

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=crm_imobil
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_imobil

# JWT
JWT_ACCESS_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# TOTP (OTP) - Código de 6 dígitos para verificação de email
TOTP_SECRET=your-totp-secret-min-32-chars
TOTP_STEP_SECONDS=300
TOTP_DIGITS=6

# CORS
CORS_ORIGIN=http://localhost:8080

# Email - Configuração SMTP para envio de emails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
EMAIL_FROM=noreply@crm.com

# Pagarme - Integração de pagamentos
PAGARME_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAGARME_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

### 3. Configurar Banco de Dados

```bash
# Criar banco de dados
createdb crm_imobil

# Executar migrations
bun run db:push

# Popular com dados iniciais (opcional)
bun run db:seed
```

### 4. Iniciar Servidor

```bash
# Desenvolvimento (com hot reload)
bun run dev

# Produção
bun run build
bun run prod
```

O servidor estará rodando em `http://localhost:3000`

## 📝 Scripts Disponíveis

### Desenvolvimento

```bash
bun run dev          # Inicia servidor em modo desenvolvimento (watch)
bun run start        # Inicia servidor (sem watch)
bun run build        # Build para produção
bun run prod         # Inicia servidor em modo produção
```

### Qualidade de Código

```bash
bun run lint         # Executa linter (Biome)
bun run lint:fix     # Corrige problemas automaticamente
bun run format       # Formata código
bun run typecheck    # Verifica tipos TypeScript
bun run knip         # Detecta código morto
bun run validate     # Executa todos os checks (typecheck + lint + knip)
bun run check-console # Procura console.log no código
```

### Database

```bash
bun run db:generate  # Gera migrations (Drizzle)
bun run db:migrate   # Executa migrations
bun run db:push      # Push schema para DB (desenvolvimento)
bun run db:push:force # Push forçado
bun run db:studio    # Abre Drizzle Studio (UI)
bun run db:seed      # Popula banco com dados
bun run db:clean     # Limpa banco de dados
bun run db:reset     # Limpa + push + seed
```

### Testes

```bash
bun run test         # Executa todos os testes
bun run test:unit    # Testes unitários (use-cases)
bun run test:e2e     # Testes E2E (routes)
bun run test:repo    # Testes de repositórios
bun run test:all     # Todos os testes
```

## 🔌 API Endpoints

### Health Check

```
GET /              # Info da API
GET /health        # Health check
```

### Autenticação

```
POST /auth/register               # Registrar novo usuário (com plano)
POST /auth/verify-email           # Verificar código 2FA (6 dígitos)
POST /auth/resend-verification    # Reenviar código de verificação
POST /auth/login                  # Login (JWT + validação subscription)
POST /auth/refresh                # Refresh token
GET  /auth/me                     # Dados do usuário autenticado
POST /auth/logout                 # Logout
POST /auth/forgot-password        # Solicitar reset de senha
POST /auth/reset-password         # Resetar senha com token
```

### Planos e Assinaturas

```
GET  /plans                       # Listar planos disponíveis
POST /subscriptions/checkout      # Processar pagamento e ativar assinatura
GET  /subscriptions/me            # Dados da assinatura ativa
```

### Usuários

```
GET    /users                # Listar usuários
GET    /users/:id            # Buscar usuário
PUT    /users/:id            # Atualizar usuário
DELETE /users/:id            # Deletar usuário
```

### Clientes

```
GET    /customers            # Listar clientes
GET    /customers/:id        # Buscar cliente
POST   /customers            # Criar cliente
PUT    /customers/:id        # Atualizar cliente
DELETE /customers/:id        # Deletar cliente
```

### Leads

```
GET    /leads                # Listar leads
GET    /leads/:id            # Buscar lead
POST   /leads                # Criar lead
PUT    /leads/:id            # Atualizar lead
DELETE /leads/:id            # Deletar lead
```

### Propriedades

```
GET    /properties           # Listar propriedades
GET    /properties/:id       # Buscar propriedade
POST   /properties           # Criar propriedade
PUT    /properties/:id       # Atualizar propriedade
DELETE /properties/:id       # Deletar propriedade
```

## 🔐 Autenticação

A API utiliza **JWT (JSON Web Tokens)** para autenticação:

1. O cliente faz login via `POST /auth/login`
2. Recebe `accessToken` (curta duração) e `refreshToken` (longa duração)
3. Envia o `accessToken` no header `Authorization: Bearer <token>`
4. Quando o `accessToken` expira, usa o `refreshToken` em `POST /auth/refresh`

### Middleware de Autenticação

```typescript
import { authMiddleware } from "@middlewares/auth.middleware";

// Proteger uma rota
app.get("/protected", authMiddleware, async ({ user }) => {
  // user está disponível após autenticação
  return { userId: user.id };
});
```

## ⚠️ Error Handling

### AppError (Padrão Principal)

Use `AppError` para erros da aplicação:

```typescript
import { AppError, ErrorCodes } from "@/errors";

throw new AppError(
  "Email já cadastrado",
  409,
  ErrorCodes.EMAIL_ALREADY_EXISTS
);
```

### Error Codes Disponíveis

Consulte `src/errors/error-codes.ts` para todos os códigos:

- `INVALID_CREDENTIALS`
- `UNAUTHORIZED`
- `TOKEN_EXPIRED`
- `EMAIL_ALREADY_EXISTS`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- etc.

### Error Handler Plugin

O plugin `error-handler.plugin.ts` captura todos os erros e formata a resposta:

```json
{
  "code": 409,
  "message": "Email já cadastrado",
  "type": "EMAIL_ALREADY_EXISTS"
}
```

## 🧪 Testes

### Estrutura de Testes

- **Unit Tests**: Use cases (`*.unit.test.ts`)
- **E2E Tests**: Routes (`*.e2e.test.ts`)
- **Repository Tests**: Repositories (`*.repo.test.ts`)

### Exemplo de Teste Unitário

```typescript
import { describe, test, expect } from "bun:test";
import { LoginUseCase } from "./login.use-case";

describe("LoginUseCase", () => {
  test("should login successfully with valid credentials", async () => {
    // Arrange
    const mockUserRepo = { /* ... */ };
    const useCase = new LoginUseCase(mockUserRepo);

    // Act
    const result = await useCase.execute({
      email: "user@example.com",
      password: "password123",
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.accessToken).toBeDefined();
  });
});
```

## 🎨 Convenções de Código

### Padrão de Controllers (OBRIGATÓRIO)

Cada controller deve seguir estritamente este padrão:

#### Estrutura de Pastas

```
src/controllers/routes/
├── feature/                    # Ex: tenants, properties, contracts
│   ├── index.ts               # Exporta e compõe todos os controllers
│   ├── create/
│   │   ├── create.ts          # Controller
│   │   ├── schema.ts          # Schemas de validação (body, query, params, response)
│   │   └── create.e2e.test.ts # Testes E2E
│   ├── list/
│   │   ├── list.ts
│   │   ├── schema.ts
│   │   └── list.e2e.test.ts
│   ├── get/
│   ├── update/
│   └── delete/
```

#### Regras do Controller

1. **JAMAIS acessar repositories diretamente** - Controllers só chamam useCases
2. **ZERO comentários** - Código deve ser auto-explicativo, limpo e legível
3. **Schema separado** - Cada ação tem seu próprio `schema.ts`
4. **Responsabilidade única** - Validar via schema → Chamar useCase → Retornar DTO

#### Exemplo de Controller Correto

```typescript
// create.ts
import { Elysia } from "elysia";
import { container } from "@/container";
import { requireRole } from "@/controllers/middlewares/acl.middleware";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { USER_ROLES } from "@/types/roles";
import { createTenantBodySchema, createTenantResponseSchema } from "./schema";

export const createTenantController = new Elysia().guard(
  { as: "local" },
  (app) =>
    app
      .use(requireAuth)
      .use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]))
      .post(
        "/tenants",
        async ({ userId, body }) => {
          const result = await container.tenants.create.execute({
            ...body,
            userId,
          });

          return {
            success: true,
            message: "Locatário criado com sucesso",
            data: result,
          };
        },
        {
          body: createTenantBodySchema,
          response: { 200: createTenantResponseSchema },
        },
      ),
);
```

#### Exemplo de Schema

```typescript
// schema.ts
import { t } from "elysia";

export const createTenantBodySchema = t.Object({
  name: t.String({ minLength: 2, maxLength: 200 }),
  cpf: t.String({ minLength: 11, maxLength: 14 }),
  phone: t.String({ minLength: 10, maxLength: 15 }),
  email: t.Optional(t.String({ format: "email" })),
});

export const createTenantResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
  data: t.Object({
    id: t.String(),
    name: t.String(),
    cpf: t.String(),
    phone: t.String(),
    email: t.Union([t.String(), t.Null()]),
  }),
});
```

#### Exemplo de index.ts

```typescript
// index.ts
import { Elysia } from "elysia";
import { createTenantController } from "./create/create";
import { deleteTenantController } from "./delete/delete";
import { getTenantController } from "./get/get";
import { listTenantsController } from "./list/list";
import { updateTenantController } from "./update/update";

export const tenantsRoutes = new Elysia({ prefix: "/api" })
  .use(createTenantController)
  .use(listTenantsController)
  .use(getTenantController)
  .use(updateTenantController)
  .use(deleteTenantController);
```

#### O que NÃO fazer no Controller

```typescript
// ❌ ERRADO - Acessando repository diretamente
const user = await container.userRepository.findById(userId);
if (!user) throw new Error("Usuário não encontrado");

// ❌ ERRADO - Comentários desnecessários
// Busca o usuário no banco de dados
const user = await container.userRepository.findById(userId);

// ❌ ERRADO - Lógica de negócio no controller
if (user.role === "admin" && tenant.status === "inactive") {
  // ...lógica complexa
}
```

#### O que fazer no Controller

```typescript
// ✅ CORRETO - UseCase recebe userId e faz todas validações
const result = await container.tenants.create.execute({
  ...body,
  userId,
});
```

### Padrão de UseCases

UseCases devem:
1. Receber dados já validados pelo schema do controller
2. Buscar entidades necessárias via repositories
3. Validar regras de negócio
4. Orquestrar operações
5. Retornar DTOs (nunca entidades do banco)

```typescript
// use-case.ts
export class CreateTenantUseCase {
  async execute(input: CreateTenantInput): Promise<TenantDTO> {
    const currentUser = await this.userRepository.findById(input.userId);
    if (!currentUser) {
      throw new NotFoundError("Usuário não encontrado");
    }

    if (!currentUser.companyId) {
      throw new BusinessError("Usuário sem empresa vinculada");
    }

    const tenant = await this.tenantRepository.create({
      ...input,
      companyId: currentUser.companyId,
      createdBy: currentUser.id,
    });

    return this.toDTO(tenant);
  }
}
```

### Resposta da API

Sempre retornar em **camelCase** para o frontend:

```typescript
// ✅ CORRETO
return {
  success: true,
  data: {
    id: tenant.id,
    fullName: tenant.fullName,      // camelCase
    createdAt: tenant.createdAt,    // camelCase
  },
};

// ❌ ERRADO
return {
  success: true,
  data: {
    id: tenant.id,
    full_name: tenant.full_name,    // snake_case
    created_at: tenant.created_at,  // snake_case
  },
};
```

### Path Aliases

Sempre use path aliases ao invés de paths relativos:

```typescript
// ✅ Bom
import { AppError } from "@/errors/app.error";
import { UserRepository } from "@repositories/contracts/user.repository";

// ❌ Ruim
import { AppError } from "../../../errors/app.error";
```

### Named Exports

Sempre use named exports:

```typescript
// ✅ Bom
export const myFunction = () => {};
export class MyClass {}

// ❌ Ruim
export default myFunction;
```

### File Naming

- **kebab-case** para arquivos: `user-repository.ts`
- **PascalCase** para classes: `class UserRepository`
- **camelCase** para funções/variáveis: `function getUserById`
- **UPPER_SNAKE_CASE** para constantes: `const MAX_FILE_SIZE`

## 📚 Tecnologias e Bibliotecas

### Core

- **Bun**: Runtime JavaScript ultra-rápido
- **Elysia**: Framework web TypeScript-first
- **TypeScript**: Linguagem tipada

### Database

- **PostgreSQL**: Banco de dados relacional
- **Drizzle ORM**: ORM TypeScript-first
- **Drizzle Kit**: Migrations e CLI

### Validação e Segurança

- **TypeBox**: Schema validation (built-in Elysia)
- **@elysiajs/jwt**: JWT para autenticação
- **bcryptjs**: Hash de senhas
- **otpauth**: TOTP/OTP

### Utilitários

- **Pino**: Logger de alta performance
- **Nodemailer**: Envio de emails

### Dev Tools

- **Biome**: Linter + Formatter (substitui ESLint + Prettier)
- **Knip**: Dead code detection

## 🔧 Troubleshooting

### Port já em uso

```bash
# Encontrar processo usando a porta 3000
lsof -i :3000

# Matar o processo
kill -9 <PID>
```

### Erro de conexão com PostgreSQL

Verifique:
1. PostgreSQL está rodando: `pg_isready`
2. Credenciais no `.env` estão corretas
3. Banco de dados existe: `psql -l`

### Erro de migrations

```bash
# Resetar banco de dados
bun run db:reset

# Se persistir, apagar e recriar
dropdb crm_imobil
createdb crm_imobil
bun run db:push
```

## 📖 Recursos Adicionais

- [Elysia Documentation](https://elysiajs.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Bun Documentation](https://bun.sh/docs)
- [Biome Documentation](https://biomejs.dev)

## 🤝 Contribuindo

1. Sempre execute `bun run validate` antes de commitar
2. Siga as convenções de código
3. Escreva testes para novos use cases
4. Documente mudanças significativas

---

**Desenvolvido com ❤️ usando Bun + Elysia + TypeScript**
