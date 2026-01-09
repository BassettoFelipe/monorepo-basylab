# Memory Leak - Diagnostico e Correcao

Data do diagnostico: 2026-01-09

## Problema

A RAM da VPS esta subindo continuamente ao longo das semanas. O problema foi identificado nos plugins de **rate limiting** e **brute force protection** que usam `Map` em memoria para armazenar dados.

## Arquivos Afetados

```
src/plugins/
├── rate-limit.plugin.ts           # 8 instancias de RateLimiter
├── brute-force.plugin.ts          # 2 Maps (ipAttempts, identifierAttempts)
└── enhanced-brute-force.plugin.ts # 2 Maps aninhados (Map<string, Map>)
```

## Causa Raiz

### 1. Rate Limit Plugin (`rate-limit.plugin.ts`)

```typescript
class RateLimiter {
  private requests = new Map<string, RequestRecord>()  // Cresce infinitamente
}
```

Sao criadas **8 instancias** de RateLimiter:
- `rateLimitPlugin`
- `authRateLimitPlugin`
- `apiRateLimitPlugin`
- `verificationRateLimitPlugin`
- `resendRateLimitPlugin`
- `loginRateLimitPlugin`
- `passwordResetRateLimitPlugin`
- `emailVerificationRateLimitPlugin`

O cleanup so remove entradas expiradas, mas IPs que fazem requests regulares nunca sao removidos.

### 2. Brute Force Plugin (`brute-force.plugin.ts`)

```typescript
export class BruteForceProtection {
  private ipAttempts: Map<string, AttemptRecord> = new Map()
  private identifierAttempts: Map<string, AttemptRecord> = new Map()
}
```

### 3. Enhanced Brute Force Plugin (`enhanced-brute-force.plugin.ts`)

```typescript
class EnhancedBruteForceProtection {
  private ipAttempts = new Map<string, Map<string, AttemptRecord>>()  // Map de Maps!
  private identifierAttempts = new Map<string, Map<string, AttemptRecord>>()
}
```

**Este e o pior:** Maps aninhados crescem exponencialmente.

## Impacto Estimado

```
Por dia (trafego moderado):
- ~500 IPs unicos
- Cada registro: ~200 bytes
- Total: ~1MB/dia so de rate limiting
- Enhanced brute force: ~5MB/dia

Em 14 dias: ~50-100MB de leak acumulado
```

## Solucao Recomendada: Migrar para Redis

### Passo 1: Criar Rate Limiter com Redis

Criar novo arquivo `src/plugins/rate-limit-redis.plugin.ts`:

```typescript
import { Elysia } from 'elysia'
import { getRedis } from '@/config/redis'
import { env } from '@/config/env'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix: string
  message?: string
}

class RedisRateLimiter {
  private redis = getRedis()
  
  constructor(private config: RateLimitConfig) {}

  async check(ip: string): Promise<{
    allowed: boolean
    resetTime: number
    remaining: number
  }> {
    const key = `${this.config.keyPrefix}:${ip}`
    const now = Date.now()
    const windowSeconds = Math.ceil(this.config.windowMs / 1000)
    
    // Usar MULTI para operacao atomica
    const pipeline = this.redis.multi()
    pipeline.incr(key)
    pipeline.pttl(key)
    
    const results = await pipeline.exec()
    const count = results?.[0]?.[1] as number || 1
    let ttl = results?.[1]?.[1] as number || -1
    
    // Se nao tem TTL, definir
    if (ttl === -1) {
      await this.redis.expire(key, windowSeconds)
      ttl = this.config.windowMs
    }
    
    const resetTime = now + ttl
    const remaining = Math.max(0, this.config.maxRequests - count)
    
    return {
      allowed: count <= this.config.maxRequests,
      resetTime,
      remaining,
    }
  }
}

export function createRedisRateLimitPlugin(config: RateLimitConfig) {
  const limiter = new RedisRateLimiter(config)
  const message = config.message || 'Muitas requisicoes. Tente novamente mais tarde.'

  return new Elysia({ name: `rate-limit-${config.keyPrefix}` })
    .onBeforeHandle({ as: 'global' }, async ({ request, set }) => {
      if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
        return
      }

      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'

      const result = await limiter.check(ip)

      set.headers['X-RateLimit-Limit'] = config.maxRequests.toString()
      set.headers['X-RateLimit-Remaining'] = result.remaining.toString()
      set.headers['X-RateLimit-Reset'] = new Date(result.resetTime).toISOString()

      if (!result.allowed) {
        set.status = 429
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
        set.headers['Retry-After'] = retryAfter.toString()

        return {
          error: message,
          code: 429,
          type: 'TOO_MANY_REQUESTS',
          retryAfter,
        }
      }
    })
}

// Exportar os mesmos plugins com Redis
export const rateLimitPlugin = createRedisRateLimitPlugin({
  keyPrefix: 'rl:general',
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
})

export const loginRateLimitPlugin = createRedisRateLimitPlugin({
  keyPrefix: 'rl:login',
  windowMs: 1 * 60 * 1000,
  maxRequests: 5,
  message: 'Muitas tentativas de login. Aguarde 1 minuto.',
})

// ... outros plugins
```

### Passo 2: Criar Brute Force com Redis

Criar novo arquivo `src/plugins/brute-force-redis.plugin.ts`:

```typescript
import { Elysia } from 'elysia'
import { getRedis } from '@/config/redis'

interface BruteForceConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
  keyPrefix: string
}

class RedisBruteForceProtection {
  private redis = getRedis()
  
  constructor(private config: BruteForceConfig) {}

  async isBlocked(ip: string, identifier?: string): Promise<{
    blocked: boolean
    reason?: string
    retryAfter?: number
  }> {
    const keys = [
      `${this.config.keyPrefix}:ip:${ip}`,
      identifier ? `${this.config.keyPrefix}:id:${identifier}` : null,
    ].filter(Boolean) as string[]

    for (const key of keys) {
      const blockKey = `${key}:blocked`
      const ttl = await this.redis.pttl(blockKey)
      
      if (ttl > 0) {
        return {
          blocked: true,
          reason: 'TOO_MANY_ATTEMPTS',
          retryAfter: Math.ceil(ttl / 1000),
        }
      }
    }

    return { blocked: false }
  }

  async registerFailedAttempt(ip: string, identifier?: string): Promise<void> {
    const keys = [
      `${this.config.keyPrefix}:ip:${ip}`,
      identifier ? `${this.config.keyPrefix}:id:${identifier}` : null,
    ].filter(Boolean) as string[]

    const windowSeconds = Math.ceil(this.config.windowMs / 1000)
    const blockSeconds = Math.ceil(this.config.blockDurationMs / 1000)

    for (const key of keys) {
      const count = await this.redis.incr(key)
      
      if (count === 1) {
        await this.redis.expire(key, windowSeconds)
      }

      if (count >= this.config.maxAttempts) {
        const blockKey = `${key}:blocked`
        await this.redis.setex(blockKey, blockSeconds, '1')
      }
    }
  }

  async registerSuccessfulAttempt(ip: string, identifier?: string): Promise<void> {
    const keys = [
      `${this.config.keyPrefix}:ip:${ip}`,
      identifier ? `${this.config.keyPrefix}:id:${identifier}` : null,
    ].filter(Boolean) as string[]

    for (const key of keys) {
      await this.redis.del(key, `${key}:blocked`)
    }
  }
}

export const bruteForceProtection = new RedisBruteForceProtection({
  keyPrefix: 'bf',
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 30 * 60 * 1000,
})

export const bruteForcePlugin = new Elysia({ name: 'brute-force-redis' })
  .decorate('bruteForce', {
    protection: bruteForceProtection,
    getClientIp: (request: Request) => {
      return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
    },
  })
```

### Passo 3: Substituir imports

Em cada arquivo que usa os plugins antigos, trocar:

```typescript
// Antes
import { rateLimitPlugin } from '@/plugins/rate-limit.plugin'
import { bruteForcePlugin } from '@/plugins/brute-force.plugin'

// Depois
import { rateLimitPlugin } from '@/plugins/rate-limit-redis.plugin'
import { bruteForcePlugin } from '@/plugins/brute-force-redis.plugin'
```

### Passo 4: Remover arquivos antigos

Apos migrar todos os imports:
- Deletar `src/plugins/rate-limit.plugin.ts`
- Deletar `src/plugins/brute-force.plugin.ts`
- Deletar `src/plugins/enhanced-brute-force.plugin.ts`

## Solucao Temporaria (Workaround)

Enquanto nao implementa a correcao, adicionar restart periodico no PM2:

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: '3balug-api',
    script: './dist/server.js',
    interpreter: '/root/.bun/bin/bun',
    instances: 2,
    exec_mode: 'fork',
    
    // ADICIONAR ESTAS LINHAS:
    cron_restart: '0 4 * * *',  // Reinicia todo dia as 4h da manha
    max_memory_restart: '400M', // Reinicia se passar de 400MB
    
    // ... resto da config
  }]
};
```

Aplicar na VPS:
```bash
pm2 reload 3balug-api --update-env
pm2 save
```

## Verificacao

Apos implementar, monitorar memoria:

```bash
# Ver uso de memoria do processo
pm2 monit

# Ver historico de restarts
pm2 show 3balug-api

# Ver tamanho das chaves no Redis
redis-cli INFO memory
redis-cli DBSIZE
```

## Checklist de Implementacao

- [ ] Criar `src/plugins/rate-limit-redis.plugin.ts`
- [ ] Criar `src/plugins/brute-force-redis.plugin.ts`
- [ ] Atualizar imports em todos os controllers
- [ ] Testar localmente
- [ ] Deploy para producao
- [ ] Monitorar memoria por 1 semana
- [ ] Remover plugins antigos
- [ ] Remover workaround do cron_restart

## Contato

Diagnostico realizado por Claude Code em 2026-01-09.
