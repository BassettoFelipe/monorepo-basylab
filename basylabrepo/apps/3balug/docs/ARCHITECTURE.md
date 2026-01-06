# Arquitetura - Padroes Obrigatorios

Este arquivo contem os padroes obrigatorios que devem ser seguidos em todo o projeto 3Balug.

---

## Regras Absolutas

### 1. Controllers sao APENAS orquestradores

Controllers NAO DEVEM:
- Fazer chamadas diretas a repositories (`container.userRepository.findById`, etc.)
- Conter logica de negocio
- Ter comentarios (devem ser auto-explicativos e limpos)

Controllers DEVEM:
- Apenas chamar useCases
- Ser simples, limpos e legiveis
- Usar middlewares para validacoes comuns

```typescript
// ERRADO - Controller chamando repository
export const createUserController = new Elysia().post("/users", async ({ userId, body }) => {
  // Buscar usuario que esta criando
  const createdBy = await container.userRepository.findById(userId);
  if (!createdBy) {
    throw new Error("Usuario nao encontrado");
  }
  const result = await container.users.createUser.execute({ ...body, createdBy });
  return result;
});

// CORRETO - Controller usando middleware e apenas chamando useCase
export const createUserController = new Elysia().guard({ as: "local" }, (app) =>
  app
    .use(requireAuth)
    .use(validateUserState)
    .use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]))
    .post("/users", async ({ validatedUser, body }) => {
      const result = await container.users.createUser.execute({
        ...body,
        createdBy: validatedUser,
      });

      return {
        success: true,
        message: "Usuario criado com sucesso",
        data: result,
      };
    }, { body: CreateUserSchema })
);
```

### 2. Middlewares para Validacoes Comuns

Use os middlewares existentes para validacoes repetitivas:

```typescript
// validateUserState - Valida usuario + subscription automaticamente
// Disponibiliza: validatedUser, validatedSubscription
.use(validateUserState)

// validateUserStateAllowPending - Permite subscriptions pendentes (checkout/payment)
.use(validateUserStateAllowPending)

// requireAuth - Valida JWT e disponibiliza userId
.use(requireAuth)

// requireRole - Valida permissoes por role
.use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]))
```

### 3. UseCases Recebem Entidades, Nao IDs

UseCases devem receber entidades ja validadas, nao IDs para buscar depois:

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

### 4. Sem Comentarios nos Controllers

Controllers devem ser auto-explicativos. O codigo deve ser tao claro que comentarios sao desnecessarios:

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

  return {
    success: true,
    message: "Usuario criado com sucesso",
    data: result,
  };
});
```

### 5. NUNCA Usar SQL/Queries Diretas no Banco

**PROIBIDO** executar SQL direto ou usar clients de banco fora do Drizzle:

```typescript
// PROIBIDO - SQL direto
await db.execute(sql`SELECT * FROM users WHERE email = ${email}`);
await client.query("UPDATE users SET name = $1 WHERE id = $2", [name, id]);

// PROIBIDO - Raw queries
await db.run("DELETE FROM users WHERE id = ?", [id]);

// CORRETO - Sempre usar schemas do Drizzle
await db.select().from(users).where(eq(users.email, email));
await db.update(users).set({ name }).where(eq(users.id, id));
await db.delete(users).where(eq(users.id, id));
```

**Excecoes Permitidas (casos raros):**
- Migrations (pasta `drizzle/`)
- Operacoes complexas que o Drizzle nao suporta (documentar o motivo)
- Queries de analise/relatorios muito especificas (sempre via repository)

**Por que?**
- Drizzle schemas garantem type-safety
- Migrations automaticas detectam mudancas
- Previne SQL injection
- Mantem consistencia entre codigo e banco

---

## Estrutura de Arquivos

### Backend (apps/3balug/api)

```
src/
├── controllers/
│   ├── middlewares/         # Middlewares compartilhados
│   │   ├── auth.middleware.ts
│   │   ├── acl.middleware.ts
│   │   └── user-validation.middleware.ts  # validateUserState
│   └── routes/
│       └── [feature]/
│           └── [action]/
│               ├── [action].ts       # Controller (limpo, sem comentarios)
│               ├── [action].e2e.test.ts
│               └── schema.ts         # Validacao TypeBox
├── use-cases/               # Logica de negocio
│   └── [feature]/
│       └── [action]/
│           ├── index.ts
│           ├── [action].use-case.ts
│           └── [action].use-case.test.ts
├── repositories/            # Acesso a dados
│   ├── contracts/           # Interfaces
│   └── providers/           # Implementacoes
└── services/                # Servicos de dominio
```

### Frontend (apps/3balug/web)

```
src/
├── components/              # Componentes reutilizaveis (SEM index.ts)
├── pages/                   # Paginas organizadas por dominio
├── queries/                 # React Query hooks
├── services/                # Services modulares (1 arquivo = 1 funcao)
├── types/                   # TypeScript types (COM index.ts)
└── design-system/           # Design System (COM index.ts)
```

---

## Padroes de Codigo

### Named Exports (SEMPRE)

```typescript
// CORRETO
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(...);
export const login = async (credentials) => { ... };

// PROIBIDO
export default Button;
```

### Path Aliases (SEMPRE)

```typescript
// CORRETO
import { Button } from "@/components/Button/Button";
import { container } from "@/container";

// ERRADO
import { Button } from "../../../components/Button/Button";
```

### Sem Barrel Exports (exceto types e design-system)

```typescript
// CORRETO - Import direto
import { Button } from "@/components/Button/Button";

// ERRADO - Nao criar index.ts
import { Button } from "@/components/Button";
```

---

## Naming Conventions

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Files/Folders | kebab-case | `user-repository.ts` |
| Components | PascalCase | `Button.tsx` |
| Functions/Variables | camelCase | `getUserById` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `User`, `UserDTO` |

---

## Formatacao (Biome)

- Indentacao: 2 espacos
- Line Width: 100 caracteres
- Quotes: Aspas duplas
- Semicolons: Sempre
- Trailing Commas: Sempre
