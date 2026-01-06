# Plano de Migração para Monorepo - BasyLab

> **Data:** 05/01/2026  
> **Status:** Em Execução  
> **Versão:** 2.1

---

## Sumário Executivo

Este documento descreve o plano de migração para criar o monorepo **basylabrepo** com a migração inicial do projeto **3balug**. A pasta original do 3balug será mantida intacta por segurança.

### Princípios Norteadores

1. **Simplicidade sobre abstração** - Código direto, sem camadas desnecessárias
2. **Reutilizar código, não serviços** - Packages compartilhados, não APIs
3. **Banco como fonte da verdade** - Acesso direto ao PostgreSQL
4. **Evitar overengineering** - Apenas o necessário para funcionar
5. **Segurança na migração** - Manter pastas originais intactas

---

## Estrutura Alvo

### Nova Estrutura do Monorepo

```
bassetto/
├── basylabrepo/                  # NOVO MONOREPO
│   ├── apps/
│   │   ├── 3balug/               # 3Balug migrado
│   │   │   ├── api/              # Backend (antigo backend/)
│   │   │   └── web/              # Frontend (antigo client/)
│   │   │
│   │   └── [outros-projetos]/    # Futuros: timearena, gradely, dinefy
│   │
│   ├── packages/
│   │   ├── core/                 # Código compartilhado
│   │   │   ├── src/
│   │   │   │   ├── auth/         # JWT, hashing, TOTP
│   │   │   │   ├── db/           # Conexão, schemas compartilhados
│   │   │   │   ├── errors/       # Erros padronizados
│   │   │   │   ├── types/        # Types compartilhados
│   │   │   │   ├── utils/        # Crypto, validation, etc
│   │   │   │   └── validation/   # Schemas Zod/TypeBox
│   │   │   └── package.json
│   │   │
│   │   ├── ui/                   # Componentes React (futuro)
│   │   └── config/               # Configs compartilhadas (futuro)
│   │
│   ├── package.json              # Root workspace
│   ├── turbo.json                # Configuração Turborepo
│   ├── biome.json                # Linting/Formatting
│   └── docker-compose.yml        # Infra unificada
│
├── 3balug/                       # ORIGINAL - NÃO MEXER
├── timearena/                    # Original - migrar depois
├── gradely/                      # Original - migrar depois
├── dinefy/                       # Original - migrar depois
└── PLANO_MIGRACAO_MONOREPO_V2.md
```

---

## Checklist de Migração

### FASE 0: Preparação e Backup

- [ ] Criar backup completo do banco do 3Balug
- [ ] Verificar que todos os testes do 3Balug estão passando
- [ ] Documentar estado atual das variáveis de ambiente
- [ ] Confirmar que o 3Balug está funcionando em produção

**Comandos:**
```bash
# Backup do banco 3Balug
pg_dump -h localhost -p 5434 -U crm_imobil -d crm_imobil > backup_3balug_$(date +%Y%m%d).sql

# Verificar testes
cd 3balug/backend && bun test
```

---

### FASE 1: Criar Estrutura do Monorepo basylabrepo ✅

- [x] Criar pasta `basylabrepo/`
- [x] Criar `basylabrepo/package.json` (root workspace)
- [x] Criar `basylabrepo/turbo.json`
- [x] Criar `basylabrepo/biome.json`
- [x] Criar pasta `basylabrepo/apps/`
- [x] Criar pasta `basylabrepo/packages/`
- [x] Executar `bun install` na raiz

**Arquivos a Criar:**

**`basylabrepo/package.json`**
```json
{
  "name": "basylabrepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "apps/*/api",
    "apps/*/web",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "@biomejs/biome": "2.3.8",
    "turbo": "^2.7.2",
    "typescript": "^5.9.3"
  }
}
```

**`basylabrepo/turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

### FASE 2: Copiar 3Balug para o Monorepo ✅

**IMPORTANTE: Não mexer na pasta original `3balug/`**

- [x] Criar pasta `basylabrepo/apps/3balug/`
- [x] Copiar `3balug/backend/` para `basylabrepo/apps/3balug/api/`
- [x] Copiar `3balug/client/` para `basylabrepo/apps/3balug/web/`
- [x] Atualizar `package.json` do api com nome `@3balug/api`
- [x] Atualizar `package.json` do web com nome `@3balug/web`
- [x] Atualizar imports relativos se necessário
- [x] Copiar arquivos de documentação relevantes
- [x] Copiar docker-compose.yml e ajustar paths

**Comandos:**
```bash
# Criar estrutura
mkdir -p basylabrepo/apps/3balug

# Copiar backend
cp -r 3balug/backend basylabrepo/apps/3balug/api

# Copiar frontend
cp -r 3balug/client basylabrepo/apps/3balug/web

# Copiar docker-compose
cp 3balug/docker-compose.yml basylabrepo/apps/3balug/
cp 3balug/docker-compose.dev.yml basylabrepo/apps/3balug/
```

---

### FASE 3: Configurar e Testar 3Balug no Monorepo ✅

- [x] Instalar dependências: `cd basylabrepo && bun install`
- [x] Verificar typecheck do backend: `bun run typecheck --filter=@3balug/api`
- [x] Verificar typecheck do frontend: `bun run typecheck --filter=@3balug/web`
- [x] Executar testes: `bun run test --filter=@3balug/api` (1324 testes passando)
- [x] Verificar build backend: `bun run build --filter=@3balug/api`
- [x] Verificar build frontend: `bun run build --filter=@3balug/web`

**Validação:**
- [x] Backend typecheck sem erros
- [x] Frontend typecheck sem erros
- [x] Testes passam 100% (1324 testes)
- [x] Build completo sem erros
- [x] Aplicação pronta para uso

---

### FASE 4: Criar Package Core (Opcional - para futuro)

> Esta fase pode ser feita depois, quando migrar outros projetos

- [ ] Criar estrutura `basylabrepo/packages/core/`
- [ ] Criar `packages/core/package.json`
- [ ] Criar `packages/core/tsconfig.json`
- [ ] Extrair utilitários compartilhados (quando necessário)

---

## Projetos para Migrar Depois

| Projeto | Prioridade | Notas |
|---------|------------|-------|
| timearena | Alta | Migrar após validar 3balug |
| gradely | Média | - |
| dinefy | Média | Em produção, cuidado extra |

---

## Comandos Úteis

```bash
# Instalar dependências do monorepo
cd basylabrepo && bun install

# Rodar dev do 3balug api
bun run dev --filter=@3balug/api

# Rodar dev do 3balug web
bun run dev --filter=@3balug/web

# Rodar testes do 3balug
bun run test --filter=@3balug/api

# Build de tudo
bun run build

# Lint de tudo
bun run lint
```

---

## Notas de Segurança

1. **Pasta original intacta**: A pasta `3balug/` original permanece sem alterações
2. **Rollback simples**: Se algo der errado, basta deletar `basylabrepo/`
3. **Backup de banco**: Sempre fazer backup antes de qualquer migração de dados

---

## Próximos Passos

1. [x] Revisar e aprovar este plano
2. [ ] Executar Fase 0 (backup e preparação)
3. [x] Executar Fase 1 (criar estrutura monorepo)
4. [x] Executar Fase 2 (copiar 3balug)
5. [x] Executar Fase 3 (configurar e testar)
6. [x] Validar tudo funcionando
7. [ ] Migrar outros projetos quando apropriado

---

*Documento criado em: 05/01/2026*  
*Última atualização: 05/01/2026*
