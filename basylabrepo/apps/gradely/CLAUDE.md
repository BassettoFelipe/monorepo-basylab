# Gradely - Padrões do Projeto

Sistema de gestão escolar usando Clean Architecture.

## Stack

- **Runtime**: Bun
- **Framework**: Elysia
- **ORM**: Drizzle (PostgreSQL)
- **Validação**: TypeBox (integrado com Elysia)
- **Auth**: JWT via `@basylab/core/auth`
- **Criptografia**: `@basylab/core/crypto` (bcrypt)
- **Erros**: `@basylab/core/errors` + HttpError local
- **Lint/Format**: Biome
- **Testes**: Bun Test

## Estrutura de Pastas

```
api/src/
├── config/           # Configurações (env.ts)
├── constants/        # Constantes (auth.constants.ts)
├── container/        # Injeção de dependências
│   ├── modules/      # Factory functions por feature
│   └── index.ts      # Container principal
├── controllers/
│   ├── middlewares/  # Middlewares Elysia
│   └── routes/       # Rotas organizadas por recurso/ação
├── db/
│   ├── schema/       # Schemas Drizzle
│   └── index.ts      # Conexão DB
├── errors/           # HttpError local
├── plugins/          # Plugins Elysia (error-handler, rate-limit)
├── repositories/
│   ├── __tests__/    # Testes de repositórios
│   ├── contracts/    # Interfaces
│   └── providers/    # Implementações (drizzle/)
├── use-cases/        # Lógica de negócio
├── utils/
│   ├── __tests__/    # Testes de utilitários
│   └── *.ts          # Utilitários (jwt, token-blacklist)
├── test/             # Setup de testes
└── server.ts         # Entry point
```

## Regras de Imports

**NÃO usar arquivos barrel (index.ts) para re-exportar.**

Sempre importar diretamente do arquivo:

```typescript
// CORRETO
import { LoginUseCase } from '@/use-cases/auth/login/login.use-case'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { errorHandler } from '@/plugins/error-handler.plugin'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { users, type User } from '@/db/schema/users'

// ERRADO - não criar index.ts só para re-exportar
import { LoginUseCase } from '@/use-cases/auth'
import { requireAuth } from '@/controllers/middlewares'
```

## Padrões de Código

### Use Cases

Cada use-case é uma classe com método `execute()`:

```typescript
// use-cases/auth/login/login.use-case.ts
type LoginInput = {
  email: string
  password: string
}

type LoginOutput = {
  user: { id: string; email: string; name: string; role: string }
  accessToken: string
  refreshToken: string
}

export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    // 1. Validações (verificar isActive ANTES de bcrypt para performance)
    // 2. Lógica de negócio
    // 3. Retorno tipado
  }
}
```

### Repositórios

Interface + Implementação separadas com métodos otimizados:

```typescript
// repositories/contracts/user.repository.ts
export type AuthUser = {
  id: string
  email: string
  password: string | null
  name: string
  role: UserRole
  isActive: boolean
}

export type UserProfile = {
  id: string
  email: string
  name: string
  role: UserRole
  phone: string | null
  avatarUrl: string | null
  isEmailVerified: boolean
  createdAt: Date
}

export type PaginationOptions = {
  page?: number
  limit?: number
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByEmailForAuth(email: string): Promise<AuthUser | null>      // Otimizado para login
  findByIdForProfile(id: string): Promise<UserProfile | null>      // Otimizado para /me
  findByIdForRefresh(id: string): Promise<RefreshUser | null>      // Otimizado para refresh
  create(data: NewUser): Promise<User>
  update(id: string, data: Partial<NewUser>): Promise<User | null>
  delete(id: string): Promise<boolean>
  findByRole(role: UserRole, options?: PaginationOptions): Promise<User[]>
}

// repositories/providers/drizzle/user.repository.ts
export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: Database) {}

  // Usar .select({ col1, col2 }) para evitar over-fetching
  async findByEmailForAuth(email: string): Promise<AuthUser | null> {
    const result = await this.db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)
    return result[0] ?? null
  }
}
```

### Rotas (Controllers)

Estrutura por ação com schema separado:

```
controllers/routes/auth/login/
├── login.ts              # Controller
├── login.e2e.test.ts     # Teste e2e
└── schema.ts             # Schemas TypeBox
```

```typescript
// login.ts
import { Elysia } from 'elysia'
import { auth } from '@/container'
import { loginRateLimiter } from '@/plugins/rate-limit.plugin'
import { loginBodySchema, loginResponseSchema } from './schema'

export const loginController = new Elysia()
  .use(loginRateLimiter)  // Rate limiting obrigatório em auth
  .post(
    '/auth/login',
    async ({ body, set }) => {
      const result = await auth.login.execute(body)
      set.status = 200
      return { success: true as const, data: result }
    },
    {
      body: loginBodySchema,
      response: loginResponseSchema,
    },
  )

// schema.ts - Sempre em camelCase para o frontend
import { t } from 'elysia'

export const loginBodySchema = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 6 }),
})

export const loginResponseSchema = {
  200: t.Object({
    success: t.Literal(true),
    data: t.Object({
      user: t.Object({
        id: t.String(),
        email: t.String(),
        name: t.String(),
        role: t.String(),
      }),
      accessToken: t.String(),
      refreshToken: t.String(),
    }),
  }),
}
```

### Container (DI)

Factory functions manuais, sem biblioteca:

```typescript
// container/modules/repositories.ts
export const repositories = {
  userRepository: new DrizzleUserRepository(db),
}

// container/modules/auth.module.ts
export function createAuthUseCases() {
  return {
    login: new LoginUseCase(repositories.userRepository),
    refreshToken: new RefreshTokenUseCase(repositories.userRepository),
    getMe: new GetMeUseCase(repositories.userRepository),
    logout: new LogoutUseCase(),
  }
}

// container/index.ts
export const auth = createAuthUseCases()
```

### Erros

Usar erros do `@basylab/core/errors` ou `HttpError` local:

```typescript
import { InvalidCredentialsError, UserNotFoundError } from '@basylab/core/errors'
import { BadRequestError, TooManyRequestsError } from '@/errors/http-error'

// No use-case
if (!user) throw new UserNotFoundError()
if (!isValid) throw new InvalidCredentialsError()
throw new BadRequestError('Mensagem customizada')
```

### Middlewares

```typescript
// controllers/middlewares/auth.middleware.ts
export const requireAuth = new Elysia({ name: 'auth-middleware' }).derive(
  { as: 'scoped' },
  async ({ headers }): Promise<AuthContext> => {
    // 1. Extrair Bearer token
    // 2. Verificar se está na blacklist (para logout)
    // 3. Validar JWT
    // 4. Retornar contexto
    return { userId, userRole, tokenPayload }
  },
)

// Uso na rota
export const meController = new Elysia()
  .use(requireAuth)
  .get('/auth/me', async ({ userId }) => { /* ... */ })
```

### Rate Limiting

```typescript
// plugins/rate-limit.plugin.ts
export const loginRateLimiter = createRateLimiter({
  windowMs: 60_000,    // 1 minuto
  maxRequests: 5,       // 5 tentativas
})

export const authRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
})
```

### Token Blacklist (para Logout)

```typescript
// utils/token-blacklist.ts
export const TokenBlacklist = {
  add(token: string, expiresInSeconds: number): void
  isBlacklisted(token: string): boolean
  remove(token: string): void
  clear(): void
}
```

## Fluxos de Autenticação

### Login (`POST /auth/login`)
1. Rate limiting (5 req/min por IP)
2. Normaliza email (toLowerCase + trim)
3. Busca usuário com `findByEmailForAuth()` (apenas 6 colunas)
4. Verifica `isActive` ANTES do bcrypt (economia de ~100ms)
5. Verifica senha com bcrypt
6. Gera tokens (access + refresh)
7. Retorna user + tokens

### Refresh Token (`POST /auth/refresh`)
1. Rate limiting (10 req/min por IP)
2. Verifica JWT signature
3. Busca usuário com `findByIdForRefresh()` (apenas 3 colunas)
4. Verifica `isActive`
5. Gera novos tokens
6. Retorna tokens

### Get Me (`GET /auth/me`)
1. Middleware `requireAuth` (verifica token + blacklist)
2. Busca usuário com `findByIdForProfile()` (apenas 8 colunas)
3. Retorna dados do perfil

### Logout (`POST /auth/logout`)
1. Middleware `requireAuth`
2. Adiciona access token à blacklist
3. Adiciona refresh token à blacklist
4. Retorna sucesso

## Convenções de Nomenclatura

- **Arquivos**: kebab-case (`login.use-case.ts`, `auth.middleware.ts`)
- **Classes**: PascalCase (`LoginUseCase`, `DrizzleUserRepository`)
- **Interfaces**: I + PascalCase (`IUserRepository`)
- **Types**: PascalCase (`AuthUser`, `UserProfile`, `PaginationOptions`)
- **Funções/variáveis**: camelCase (`createAuthUseCases`, `repositories`)
- **Constantes**: UPPER_SNAKE_CASE (`AUTH_CONSTANTS`)
- **Testes**: `*.test.ts` (unit), `*.e2e.test.ts` (e2e)

## Comandos

```bash
bun run dev          # Desenvolvimento com watch
bun run typecheck    # Verificar tipos
bun run lint         # Verificar lint
bun run lint:fix     # Corrigir lint
bun run test         # Rodar todos os testes
bun run test:unit    # Rodar testes unitários
bun run test:e2e     # Rodar testes e2e
bun run db:push      # Sincronizar schema com DB
bun run db:studio    # Abrir Drizzle Studio
```

## Variáveis de Ambiente

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://user:pass@localhost:5432/gradely
JWT_ACCESS_SECRET=secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=secret-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d
```

## Checklist de Validação de Código

Ao implementar ou revisar código, sempre validar:

### 1. N+1 Queries
- Loop com query dentro (`for` + `await repository.find()`)
- Eager loading ausente em relacionamentos
- **Solução**: JOINs ou batch queries

### 2. Over-fetching de Colunas
- `.select()` sem especificar colunas
- Retorno de dados sensíveis (password, secrets)
- **Solução**: Criar métodos específicos como `findByEmailForAuth()`, `findByIdForProfile()`

### 3. Queries Sem Paginação
- `findAll()` ou `findByX()` sem `.limit()`
- **Solução**: Sempre usar `limit` + `offset` com `PaginationOptions`

### 4. Race Conditions
- Read-then-write sem lock
- Contadores sem atomicidade
- **Solução**: `sql\`column + 1\`` ou `SELECT FOR UPDATE`

### 5. Falta de Índices
- WHERE/ORDER BY em colunas sem índice
- **Solução**: `index('name').on(table.column)`

### 6. Transações Ausentes
- Operações relacionadas sem atomicidade
- **Solução**: `db.transaction(async (tx) => {})`

### 7. Vazamento de Dados Sensíveis
- Password/tokens em responses
- **Solução**: Buscar só colunas necessárias com tipos específicos

### 8. Falta de Rate Limiting
- Endpoints de auth/email sem limite
- **Solução**: Usar `loginRateLimiter` ou `authRateLimiter`

### 9. Operações Bloqueantes
- `bcrypt.hashSync()` ou processamento síncrono pesado
- **Solução**: Usar versões async

### 10. Conexões Não Gerenciadas
- `new Client()` sem pool
- **Solução**: Singleton com connection pool

### 11. Falta de Timeout
- `fetch()` sem AbortController
- **Solução**: Timeout com AbortController (5s)

### 12. Validação Apenas no Frontend
- Falta de schema validation no backend
- **Solução**: TypeBox schemas em todos endpoints

### 13. Logs Inadequados
- `console.log(objeto)` com dados sensíveis
- **Solução**: Logger estruturado com contexto

### 14. Secrets Hardcoded
- API keys/senhas no código
- **Solução**: Variáveis de ambiente via `env.ts`

### 15. Falta de Idempotência
- POSTs que criam duplicatas
- **Solução**: Upsert ou idempotency key

### 16. Ordem de Validação Subótima
- Verificar senha antes de verificar status do usuário
- **Solução**: Verificar `isActive` ANTES do bcrypt para economizar CPU

### 17. Tokens Sem Revogação
- JWT stateless sem possibilidade de logout
- **Solução**: Usar `TokenBlacklist` para invalidar tokens no logout

### 18. Respostas Não Padronizadas
- Campos em snake_case ou inconsistentes
- **Solução**: Sempre usar camelCase nos schemas de resposta
