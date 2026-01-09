# Análise de Performance dos Fluxos de Auth

Data da análise: 2025-01-09

## Resumo Executivo

Foram identificados problemas de performance e segurança nos fluxos de autenticação (login, refresh, me). Os principais issues são:
- **Over-fetching** em todas as queries de usuário (27 colunas buscadas, 4-8 utilizadas)
- **Falta de cache** no endpoint `/auth/me`
- **Ausência de rate limiting** nos endpoints de auth
- **Tokens JWT stateless** sem possibilidade de revogação

---

## 1. Login Flow (`login.use-case.ts`)

### Fluxo Atual
```
POST /auth/login
  ↓
1. Normaliza email (toLowerCase + trim)
  ↓
2. Query DB: findByEmail() → busca 27 colunas
  ↓
3. Verifica senha com bcrypt (~100ms)
  ↓
4. Verifica isActive
  ↓
5. Gera tokens (Promise.all)
  ↓
200 { user, accessToken, refreshToken }
```

### Problemas Encontrados

#### P1: Over-fetching de Colunas (Alta Prioridade)
**Arquivo**: `repositories/providers/drizzle/user.repository.ts:8-11`
```typescript
async findByEmail(email: string): Promise<User | null> {
  const result = await this.db
    .select() // ← busca TODAS as 27 colunas
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1)
  return result[0] ?? null
}
```
**Impacto**: Busca 27 colunas incluindo `verificationSecret`, `passwordResetSecret`, etc. O login usa apenas 5: `id`, `email`, `password`, `name`, `role`, `isActive`.

**Solução**:
```typescript
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
```

#### P2: Ordem de Validação Subótima (Média Prioridade)
**Arquivo**: `use-cases/auth/login/login.use-case.ts:30-36`
```typescript
// Verifica senha ANTES de verificar isActive
const isPasswordValid = await PasswordUtils.verify(input.password, user.password)
if (!isPasswordValid) {
  throw new InvalidCredentialsError()
}
if (!user.isActive) {  // ← deveria ser verificado ANTES do bcrypt
  throw new AccountDeactivatedError()
}
```
**Impacto**: Se usuário está desativado, desperdiça ~100ms de CPU com bcrypt.

**Solução**:
```typescript
if (!user.isActive) {
  throw new AccountDeactivatedError()
}
const isPasswordValid = await PasswordUtils.verify(input.password, user.password)
```

#### P3: Falta de Rate Limiting (Alta Prioridade - Segurança)
**Impacto**: Endpoint vulnerável a brute force attacks.

**Solução**: Adicionar rate limiting de 5 tentativas/minuto por IP e 10/minuto por email.

---

## 2. Refresh Token Flow (`refresh-token.use-case.ts`)

### Fluxo Atual
```
POST /auth/refresh
  ↓
1. Verifica JWT signature (sem DB) ✓
  ↓
2. Query DB: findById() → busca 27 colunas
  ↓
3. Verifica isActive
  ↓
4. Gera novos tokens (Promise.all)
  ↓
200 { accessToken, refreshToken }
```

### Problemas Encontrados

#### P4: DB Hit Obrigatório em Cada Refresh (Alta Prioridade)
**Arquivo**: `use-cases/auth/refresh-token/refresh-token.use-case.ts:18-21`
```typescript
const user = await this.userRepository.findById(payload.sub)
```
**Impacto**: Toda renovação de token (frequente) gera query no banco.

**Solução**: Cache Redis do status do usuário (TTL 5min) ou incluir `isActive` no payload do refresh token (menos seguro).

#### P5: Tokens Stateless Sem Revogação (Alta Prioridade - Segurança)
**Impacto**: Impossível invalidar tokens após logout ou comprometimento.

**Solução**: Implementar tabela `refresh_tokens` para tracking:
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### P6: Sem Rate Limiting (Média Prioridade)
**Impacto**: Pode ser explorado para DDoS ou token guessing.

---

## 3. Get Me Flow (`get-me.use-case.ts`)

### Fluxo Atual
```
GET /auth/me
  ↓
1. Middleware: Verifica JWT (sem DB) ✓
  ↓
2. Query DB: findById() → busca 27 colunas
  ↓
3. Mapeia para 8 campos
  ↓
200 { user data }
```

### Problemas Encontrados

#### P7: DB Hit em Endpoint de Alta Frequência (Crítico)
**Arquivo**: `use-cases/auth/get-me/get-me.use-case.ts:20`
```typescript
const user = await this.userRepository.findById(input.userId)
```
**Impacto**: Frontend tipicamente chama `/auth/me` em cada page load para verificar auth state. Isso gera query desnecessária já que os dados do usuário raramente mudam.

**Solução 1 - Cache Redis**:
```typescript
async execute(input: GetMeInput): Promise<GetMeOutput> {
  const cacheKey = `user:${input.userId}:profile`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  const user = await this.userRepository.findByIdForProfile(input.userId)
  await redis.setex(cacheKey, 300, JSON.stringify(user)) // TTL 5min
  return user
}
```

**Solução 2 - Incluir dados no JWT**:
Adicionar `name`, `email`, `avatarUrl` no payload do access token. Frontend usa dados do token, `/auth/me` só para refresh.

#### P8: Over-fetching (Alta Prioridade)
Mesmo problema do login - busca 27 colunas, retorna 8.

---

## 4. Repositório (`user.repository.ts`)

### Problemas Encontrados

#### P9: Over-fetching Global
Todos os métodos usam `.select()` sem especificar colunas.

#### P10: `findByRole()` Sem Paginação (Alta Prioridade)
**Arquivo**: `repositories/providers/drizzle/user.repository.ts:38-40`
```typescript
async findByRole(role: UserRole): Promise<User[]> {
  return this.db.select().from(users).where(eq(users.role, role))
}
```
**Impacto**: Pode retornar milhares de registros, causando OOM.

**Solução**:
```typescript
async findByRole(role: UserRole, page = 1, limit = 20): Promise<User[]> {
  return this.db
    .select()
    .from(users)
    .where(eq(users.role, role))
    .limit(limit)
    .offset((page - 1) * limit)
}
```

---

## 5. Auth Middleware (`auth.middleware.ts`)

### Pontos Positivos
- Validação stateless (sem DB hit) ✓
- Extração correta do Bearer token ✓
- Tratamento de erros adequado ✓

### Problemas Encontrados

#### P11: Tokens Não Podem Ser Revogados
Mesmo problema do refresh - JWT stateless.

---

## 6. Schema de Banco (`users.ts`)

### Problemas Encontrados

#### P12: Tabela Muito Larga (27 Colunas)
```typescript
// Colunas de verificação de email (6)
verificationSecret, verificationExpiresAt, verificationAttempts,
verificationLastAttemptAt, verificationResendCount, verificationLastResendAt

// Colunas de reset de senha (6)
passwordResetSecret, passwordResetExpiresAt, passwordResetAttempts,
passwordResetLastAttemptAt, passwordResetResendCount, passwordResetCooldownEndsAt
```
**Impacto**: Toda query de usuário carrega dados irrelevantes para auth.

**Solução**: Mover para tabelas separadas `email_verifications` e `password_resets`.

#### P13: Sem Tabela de Refresh Tokens
**Impacto**: Impossível rastrear/revogar sessões.

---

## Matriz de Priorização

| ID | Problema | Severidade | Esforço | Prioridade |
|----|----------|------------|---------|------------|
| P7 | DB hit em /auth/me | Crítico | Médio | 1 |
| P1 | Over-fetching login | Alta | Baixo | 2 |
| P8 | Over-fetching get-me | Alta | Baixo | 2 |
| P3 | Rate limiting login | Alta | Baixo | 3 |
| P5 | Tokens sem revogação | Alta | Alto | 4 |
| P10 | findByRole sem paginação | Alta | Baixo | 5 |
| P4 | DB hit em refresh | Alta | Médio | 6 |
| P2 | Ordem validação login | Média | Baixo | 7 |
| P12 | Tabela users larga | Média | Alto | 8 |

---

## Plano de Ação Sugerido

### Fase 1 - Quick Wins (1-2 dias)
1. Criar métodos `findByIdForAuth()` e `findByEmailForAuth()` no repositório
2. Corrigir ordem de validação no login (isActive antes de bcrypt)
3. Adicionar paginação no `findByRole()`
4. Adicionar rate limiting nos endpoints de auth

### Fase 2 - Cache (3-5 dias)
1. Implementar cache Redis para `/auth/me` (TTL 5min)
2. Invalidar cache em updates de usuário

### Fase 3 - Segurança (1 semana)
1. Criar tabela `refresh_tokens`
2. Implementar refresh token rotation
3. Adicionar endpoint de logout que revoga tokens
4. Implementar detecção de reuso de token

### Fase 4 - Refatoração (2 semanas)
1. Mover dados de verificação para tabela separada
2. Mover dados de reset para tabela separada
3. Implementar tracking de sessões

---

## Métricas de Sucesso

- **P50 latency /auth/me**: < 5ms (com cache) vs ~50ms (atual)
- **P50 latency /auth/login**: < 150ms (bcrypt é o gargalo)
- **DB queries por login**: 1 (atual: 1, mas buscando menos dados)
- **DB queries por /auth/me com cache hit**: 0 (atual: 1)
