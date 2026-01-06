# Checkup de Qualidade - Monorepo BasyLab

Este documento e a **fonte unica de verdade** para auditoria e qualidade de TODO o monorepo.

TODAS as regras se aplicam a:
- Codigo novo
- Codigo legado
- Qualquer arquivo ja existente no repositorio
- Todos os apps e packages

---

## Filosofia

**ZERO TOLERANCIA** para warnings, errors, codigo morto e gambiarras.

**QUALIDADE > VELOCIDADE**. Sempre resolver corretamente, nunca contornar problemas.

Codigo deve ser autoexplicativo. Comentarios sao excecao extrema e somente permitidos para regras de negocio criticas.

---

## Regras Absolutas

### Codigo

- **NAO usar comentarios**
  - Permitido somente para regra critica de negocio impossivel de expressar via codigo
  - Comentarios obrigatoriamente em INGLES quando absolutamente necessarios

- **NAO usar console.***
  - Logs apenas via pino e somente quando indispensaveis a observabilidade

- **NAO deixar NADA sem uso:**
  - Variaveis
  - Imports
  - Funcoes
  - Tipos / Interfaces
  - Hooks
  - Components
  - Exports

- **NAO usar parametros ignorados com _**
  - Se nao e usado, remover

- **PROIBIDO suprimir problemas:**
  - @ts-ignore
  - @ts-expect-error
  - biome-ignore (exceto limitacoes tecnicas justificadas)
  - eslint-disable
  - any
  - as any

- **NAO criar abstracoes sem efeito real no produto**

- **NAO manter helpers ou libs sem impacto direto**

---

## Arquitetura Obrigatoria

### Dependency Injection com Awilix

**OBRIGATORIO** usar Awilix para servicos que possuem multiplos providers:

- Email Service (SMTP, SendGrid, etc.)
- Payment Gateway (Pagarme, Stripe, etc.)
- Storage Service (S3, Local, etc.)
- Cache Service (Redis, Memory, etc.)

**Localizacao:** `apps/*/api/src/container/`

---

## Escopo de Validacao Global

Aplicar este CHECKUP em:

- 100% do codigo
- Todos os apps (`apps/*`)
- Todos os packages (`packages/*`)
- Scripts
- Configs

NADA pode ser ignorado.

---

## Runtime

Utilizar **EXCLUSIVAMENTE BUN**:

- scripts
- lint
- build
- testes
- typecheck
- knip

---

## Limpeza Total

### Codigo morto

Remover:

- Imports sem uso
- Variaveis nunca utilizadas
- Funcoes nao chamadas
- Exports orfaos
- Tipos nao utilizados
- Codigo comentado

Detectar via:

- Biome
- TypeScript
- Knip

### Buscas de Auditoria

```bash
# Comentarios
grep -r "//\|/\*" --include="*.ts" --include="*.tsx" src | grep -v "http://\|https://"

# Consoles
grep -r "console\." --include="*.ts" --include="*.tsx" src

# Debug
grep -r "debugger" --include="*.ts" --include="*.tsx" src

# Suppressoes
grep -r "@ts-ignore\|@ts-expect-error\|biome-ignore" --include="*.ts" --include="*.tsx" src

# Any
grep -r ": any\|as any" --include="*.ts" --include="*.tsx" src
```

---

## Limpeza de Arquivos

Remover globalmente:

- .sh desnecessarios
- Markdown inuteis (manter apenas README, docs essenciais)
- *.example.*
- *.sample.*
- *.template.*
- Assets nao utilizados
- Diretorios vazios
- Lockfiles concorrentes (manter apenas bun.lock)
- Configs obsoletas:
  - .eslintrc*
  - .prettierrc*
  - jsconfig.json se usar TS

---

## Comandos de Validacao

### Raiz do Monorepo (via Turborepo)

```bash
# Todos os apps/packages
bun run typecheck
bun run lint
bun run test
bun run build
```

### Por App/Package Individual

```bash
# 3balug API
cd apps/3balug/api && bun run typecheck && bun run lint && bun run knip && bun run test

# 3balug Web
cd apps/3balug/web && bun run typecheck && bun run lint && bun run knip && bun run test

# basyadmin API
cd apps/basyadmin/api && bun run typecheck && bun run lint && bun run knip && bun run test

# Core Package
cd packages/core && bun run typecheck && bun run lint && bun run test
```

### Criterio Inegociavel

- ZERO erros
- ZERO warnings
- ZERO excecoes

---

## Ciclo de Correcao

Se QUALQUER comando falhar:

1. Corrigir todos os problemas apontados
2. Rodar TODO o checklist novamente
3. Repetir ate que TODOS passem JUNTOS na mesma execucao completa

---

## Anti-Padroes Vetados

- Uso de `any` ou `as any`
- Suppressoes de erro injustificadas
- Circular dependencies
- Hacks para burlar tipagem
- Logs improvisados
- Comentarios decorativos
- Codigo morto
- Dependencias sem necessidade real
- Services sem DI container quando possuem multiplos providers

---

## Typing Correto

Obrigatorio usar:

- Interfaces reais
- Type guards
- Narrowing
- Optional chaining
- Nullish coalescing
- Runtime validation

Assertions SOMENTE quando comprovadamente seguras.

---

## Governanca

### Pre-commit

```sh
#!/bin/sh
bun run validate
```

### CI/CD

Pipeline obrigatorio:

```bash
bun run validate
```

Pipeline deve falhar se detectar:

- Qualquer warning
- Qualquer error

---

## Periodicidade

Executar este checkup:

- Antes de toda release
- Apos merges grandes
- Semanalmente
- Apos grandes refactors

---

## Conclusao Final

A tarefa SOMENTE e considerada concluida quando:

- 100% do repositorio foi validado
- Codigo antigo e novo seguem exatamente as MESMAS regras
- Nenhum warning existe
- Nenhum error existe
- Nenhuma suppressao injustificada existe
- Nenhum console fora do padrao existe
- Nenhum comentario decorativo existe
- Nenhuma dependencia morta existe
- Todos os testes passam
- Typecheck limpo
- Biome limpo
- Knip limpo
- Build 100% funcional
- Services com multiplos providers usam Awilix DI container

---

## Estrutura do Monorepo

```
basylabrepo/
├── apps/
│   ├── 3balug/
│   │   ├── api/          # @3balug/api
│   │   └── web/          # @3balug/web
│   └── basyadmin/
│       └── api/          # @basyadmin/api
├── packages/
│   └── core/             # @basylab/core
├── docker-compose.yml
├── turbo.json
├── biome.json
└── package.json
```

---

**Ultima atualizacao:** 06/01/2026
