# Arquitetura e Padroes do Projeto

Documentacao dos padroes de arquitetura utilizados nos projetos BasyLab.

---

## Visao Geral

### Stack Tecnologica

| Camada | Tecnologia | Versao |
|--------|------------|--------|
| Runtime | Bun | 1.0+ |
| Backend Framework | Elysia | 1.0+ |
| Frontend Framework | React | 19 |
| Build Tool | Vite | 5+ |
| Database | PostgreSQL | 16 |
| ORM | Drizzle | 0.30+ |
| Cache | Redis | 7 |
| Object Storage | MinIO | Latest |
| CSS | Vanilla Extract | 1.0+ |
| Linter/Formatter | Biome | 1.5+ |
| Monorepo | Turborepo | 2.0+ |

---

## Arquitetura Backend (Clean Architecture)

### Camadas

```
┌─────────────────────────────────────────────────────────┐
│                     Controllers                          │
│              (HTTP/API - Orquestracao)                  │
├─────────────────────────────────────────────────────────┤
│                      Use Cases                          │
│                  (Logica de Negocio)                    │
├─────────────────────────────────────────────────────────┤
│                    Repositories                         │
│                  (Acesso a Dados)                       │
├─────────────────────────────────────────────────────────┤
│                      Database                           │
│               (PostgreSQL + Drizzle)                    │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de uma Requisicao

```
Request HTTP
    ↓
Controller (valida input via schema)
    ↓
Middleware (auth, rate limit, etc)
    ↓
Use Case (regras de negocio)
    ↓
Repository (acesso ao banco)
    ↓
Database (PostgreSQL)
    ↓
Response HTTP
```

---

## Estrutura de Pastas Backend

```
src/
├── config/                      # Configuracoes
│   ├── constants.ts            # Constantes globais
│   ├── env.ts                  # Validacao de env vars
│   └── logger.ts               # Configuracao do Pino
│
├── container/                   # Dependency Injection
│   └── index.ts                # Container central
│
├── controllers/                 # Controllers HTTP
│   ├── index.ts                # Export de todas routes
│   ├── middlewares/            # Middlewares compartilhados
│   │   ├── auth.middleware.ts
│   │   ├── acl.middleware.ts
│   │   └── user-validation.middleware.ts
│   └── routes/                 # Routes por feature
│       ├── auth/
│       │   ├── login/
│       │   │   ├── login.ts           # Controller
│       │   │   ├── schema.ts          # Validacao
│       │   │   └── login.e2e.test.ts  # Teste E2E
│       │   └── register/
│       ├── users/
│       ├── properties/
│       └── contracts/
│
├── use-cases/                   # Logica de Negocio
│   ├── auth/
│   │   ├── login/
│   │   │   ├── login.use-case.ts
│   │   │   └── login.use-case.test.ts
│   │   └── register/
│   ├── users/
│   └── properties/
│
├── repositories/                # Data Access
│   ├── contracts/              # Interfaces
│   │   ├── user.repository.ts
│   │   └── property.repository.ts
│   └── providers/              # Implementacoes
│       └── drizzle/
│           ├── user.repository.ts
│           └── property.repository.ts
│
├── services/                    # Servicos de Dominio
│   ├── email.service.ts
│   └── storage.service.ts
│
├── db/                          # Database
│   ├── schema/                 # Schemas Drizzle
│   │   ├── index.ts
│   │   ├── user.ts
│   │   └── property.ts
│   ├── index.ts                # Conexao
│   └── seeds/                  # Seeds
│
├── errors/                      # Sistema de Erros
│   ├── app.error.ts
│   └── error-codes.ts
│
├── plugins/                     # Elysia Plugins
│   ├── error-handler.plugin.ts
│   └── rate-limit.plugin.ts
│
├── utils/                       # Utilitarios
│   ├── crypto.utils.ts
│   └── jwt.utils.ts
│
└── server.ts                    # Entry point
```

---

## Regras OBRIGATORIAS do Backend

### 1. Controllers APENAS orquestram

```typescript
// ERRADO - Controller acessando repository
export const createUserController = new Elysia().post("/users", async ({ userId, body }) => {
  const user = await container.userRepository.findById(userId); // PROIBIDO!
  // ...
});

// CORRETO - Controller usando middleware e chamando useCase
export const createUserController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(requireRole([USER_ROLES.OWNER]))
    .post("/users", async ({ validatedUser, body }) => {
      const result = await container.users.createUser.execute({
        ...body,
        createdBy: validatedUser,  // Entidade ja validada pelo middleware
      });
      return { success: true, data: result };
    }, { body: CreateUserSchema })
);
```

### 2. UseCases recebem ENTIDADES, nao IDs

```typescript
// ERRADO - UseCase recebendo ID
type CreateUserInput = {
  createdById: string;  // ID para buscar depois
};

// CORRETO - UseCase recebendo entidade
type CreateUserInput = {
  createdBy: User;  // Entidade ja validada
};
```

### 3. ZERO comentarios no codigo

O codigo deve ser auto-explicativo.

```typescript
// ERRADO
.post("/users", async ({ validatedUser, body }) => {
  // Criar novo usuario
  const result = await container.users.createUser.execute({...});
  
  // Retornar resultado
  return { success: true, data: result };
});

// CORRETO
.post("/users", async ({ validatedUser, body }) => {
  const result = await container.users.createUser.execute({
    ...body,
    createdBy: validatedUser,
  });
  return { success: true, data: result };
});
```

### 4. NUNCA usar SQL direto

```typescript
// PROIBIDO
await db.execute(sql`SELECT * FROM users WHERE email = ${email}`);
await client.query("UPDATE users SET name = $1", [name]);

// CORRETO - Sempre Drizzle
await db.select().from(users).where(eq(users.email, email));
await db.update(users).set({ name }).where(eq(users.id, id));
```

### 5. Sempre usar Named Exports

```typescript
// ERRADO
export default Button;

// CORRETO
export const Button = () => { ... };
export function getUserById() { ... }
```

### 6. Sempre usar Path Aliases

```typescript
// ERRADO
import { Button } from "../../../components/Button";

// CORRETO
import { Button } from "@/components/Button/Button";
```

---

## Estrutura de Pastas Frontend

```
src/
├── components/              # Componentes reutilizaveis
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.css.ts   # Vanilla Extract
│   ├── Input/
│   └── Modal/
│
├── pages/                   # Paginas por dominio
│   ├── Auth/
│   │   ├── LoginPage/
│   │   └── RegisterPage/
│   ├── Admin/
│   │   ├── DashboardPage/
│   │   ├── PropertiesPage/
│   │   └── ContractsPage/
│   └── Public/
│
├── queries/                 # React Query hooks
│   ├── auth/
│   │   ├── useLogin.ts
│   │   └── useLogout.ts
│   ├── properties/
│   └── contracts/
│
├── services/                # API calls (1 arquivo = 1 funcao)
│   ├── auth/
│   │   ├── login.ts
│   │   └── logout.ts
│   ├── properties/
│   └── contracts/
│
├── lib/                     # Configuracoes de libs
│   └── api.ts              # Axios instance
│
├── router/                  # Definicao de rotas
├── routing/                 # Guards e setup
│
├── design-system/           # Design System (COM index.ts)
├── layouts/                 # Layouts compartilhados
├── hooks/                   # Custom hooks
├── types/                   # TypeScript types (COM index.ts)
├── utils/                   # Utilitarios
└── styles/                  # Estilos globais
```

---

## Convencoes de Nomenclatura

### Arquivos e Pastas

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Arquivos | kebab-case | `user-repository.ts` |
| Componentes React | PascalCase | `Button.tsx` |
| Hooks | camelCase com use | `useAuth.ts` |
| Types | PascalCase | `User.ts` |
| Utils | kebab-case | `format-date.ts` |

### Codigo

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Variaveis | camelCase | `userName` |
| Funcoes | camelCase | `getUserById()` |
| Classes | PascalCase | `UserRepository` |
| Constantes | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `User`, `UserDTO` |
| Enums | PascalCase | `UserRole` |

---

## Barrel Exports (index.ts)

### PROIBIDO em components

```typescript
// NAO criar components/Button/index.ts

// Import direto
import { Button } from "@/components/Button/Button";
```

### PERMITIDO em types e design-system

```typescript
// types/index.ts
export * from "./user";
export * from "./property";

// Uso
import { User, Property } from "@/types";
```

---

## Padroes de API

### Response Format

```typescript
// Sucesso
{
  success: true,
  message: "Operacao realizada com sucesso",
  data: { ... }
}

// Erro
{
  success: false,
  message: "Descricao do erro",
  code: "ERROR_CODE"
}

// Lista com paginacao
{
  success: true,
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

### Sempre camelCase

```typescript
// CORRETO
{
  userId: "123",
  createdAt: "2024-01-01",
  propertyOwner: { ... }
}

// ERRADO
{
  user_id: "123",
  created_at: "2024-01-01",
  property_owner: { ... }
}
```

---

## Testes

### Tipos de Teste

| Tipo | Sufixo | Local | Exemplo |
|------|--------|-------|---------|
| Unitario | `.unit.test.ts` | use-cases/ | `login.use-case.test.ts` |
| E2E | `.e2e.test.ts` | controllers/ | `login.e2e.test.ts` |
| Repository | `.repo.test.ts` | repositories/ | `user.repo.test.ts` |

### Estrutura de Teste

```typescript
import { describe, test, expect, beforeEach } from "bun:test";

describe("LoginUseCase", () => {
  beforeEach(() => {
    // Setup
  });

  test("should login with valid credentials", async () => {
    // Arrange
    const input = { email: "test@test.com", password: "123456" };
    
    // Act
    const result = await loginUseCase.execute(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.accessToken).toBeDefined();
  });

  test("should throw error with invalid credentials", async () => {
    // Arrange
    const input = { email: "test@test.com", password: "wrong" };
    
    // Act & Assert
    expect(() => loginUseCase.execute(input)).toThrow("Invalid credentials");
  });
});
```

---

## Formatacao (Biome)

### Configuracao

```json
{
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  }
}
```

### Comandos

```bash
# Verificar
bun run lint

# Corrigir
bun run lint:fix

# Formatar
bun run format
```

---

## Git Workflow

### Branches

```
main              # Producao
├── develop       # Desenvolvimento
├── feature/*     # Novas features
├── fix/*         # Bug fixes
└── hotfix/*      # Correcoes urgentes em producao
```

### Commits (Conventional Commits)

```bash
feat: add user registration
fix: resolve login timeout issue
refactor: simplify auth middleware
docs: update API documentation
test: add unit tests for login
chore: update dependencies
```

### Fluxo

```
1. Criar branch: git checkout -b feature/nova-feature
2. Desenvolver e commitar
3. Push: git push origin feature/nova-feature
4. Criar PR para develop
5. Code review
6. Merge para develop
7. Deploy em homolog
8. Teste
9. Merge develop -> main
10. Deploy em producao
```

---

## Checklist de Code Review

### Geral
- [ ] Codigo segue os padroes definidos
- [ ] Sem comentarios desnecessarios
- [ ] Named exports utilizados
- [ ] Path aliases utilizados
- [ ] Sem console.log

### Backend
- [ ] Controller NAO acessa repository
- [ ] UseCase recebe entidades, nao IDs
- [ ] Validacao via schema TypeBox
- [ ] Erros tratados com AppError
- [ ] Testes adicionados/atualizados

### Frontend
- [ ] Componente com nome em PascalCase
- [ ] Props tipadas
- [ ] Sem inline styles (usar Vanilla Extract)
- [ ] React Query para server state

---

**Proxima leitura:** [07-SERVICOS-VPS.md](07-SERVICOS-VPS.md)
