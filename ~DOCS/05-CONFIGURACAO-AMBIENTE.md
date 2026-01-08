# Configuracao de Ambiente - Setup Completo

Guia para configurar ambiente de desenvolvimento do zero.

---

## Pre-requisitos

### macOS

```bash
# 1. Instalar Homebrew (se nao tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Instalar Bun
curl -fsSL https://bun.sh/install | bash

# 3. Instalar Docker Desktop
brew install --cask docker

# 4. Instalar Git
brew install git

# 5. Instalar ferramentas uteis
brew install jq httpie
```

### Linux (Ubuntu/Debian)

```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Bun
curl -fsSL https://bun.sh/install | bash

# 3. Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 4. Instalar Git
sudo apt install git -y
```

### Windows (WSL2)

```bash
# 1. Instalar WSL2 (PowerShell como admin)
wsl --install

# 2. Reiniciar e abrir Ubuntu
# 3. Seguir instrucoes do Linux acima
```

---

## Passo 1: Clonar Repositorio

```bash
# 1. Criar pasta de projetos
mkdir -p ~/Documents/www/bassetto
cd ~/Documents/www/bassetto

# 2. Clonar monorepo
git clone git@github.com:SEU_USUARIO/basylabrepo.git

# 3. Entrar no projeto
cd basylabrepo
```

---

## Passo 2: Instalar Dependencias

```bash
# Na raiz do monorepo
bun install
```

---

## Passo 3: Subir Infraestrutura Local

```bash
# Subir PostgreSQL, Redis e MinIO
docker-compose up -d

# Verificar se esta rodando
docker-compose ps

# Deve mostrar:
# basylab-postgres      running   0.0.0.0:5432->5432/tcp
# basylab-postgres-test running   0.0.0.0:5433->5432/tcp
# basylab-redis         running   0.0.0.0:6379->6379/tcp
# basylab-minio         running   0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp
```

### Portas utilizadas

| Servico | Porta | Uso |
|---------|-------|-----|
| PostgreSQL | 5432 | Banco principal |
| PostgreSQL Test | 5433 | Banco de testes |
| Redis | 6379 | Cache |
| MinIO API | 9000 | Object storage |
| MinIO Console | 9001 | Interface web |

---

## Passo 4: Configurar Variaveis de Ambiente

### Backend (api)

```bash
cd apps/3balug/api

# Copiar template
cp .env.example .env

# Editar com suas configuracoes
nano .env
# ou
code .env
```

### Conteudo do .env (Desenvolvimento)

```bash
# ==========================================
# DESENVOLVIMENTO LOCAL - BACKEND
# ==========================================

# Environment
NODE_ENV=development

# Server
PORT=3001

# ==========================================
# Database (Docker local)
# ==========================================
POSTGRES_USER=basylab
POSTGRES_PASSWORD=basylab123
POSTGRES_DB=basylab
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Database URLs
DATABASE_URL=postgresql://basylab:basylab123@localhost:5432/basylab
TEST_DATABASE_URL=postgresql://basylab:basylab123@localhost:5433/basylab_test

# ==========================================
# JWT Secrets (Desenvolvimento - pode ser qualquer string longa)
# ==========================================
JWT_ACCESS_SECRET=dev-access-secret-muito-longo-com-mais-de-32-caracteres
JWT_REFRESH_SECRET=dev-refresh-secret-muito-longo-com-mais-de-32-caracteres
JWT_RESET_PASSWORD_SECRET=dev-reset-secret-muito-longo-com-mais-de-32-caracteres
JWT_CHECKOUT_SECRET=dev-checkout-secret-muito-longo-com-mais-de-32-caracteres

# JWT Expiration
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_RESET_PASSWORD_EXPIRES_IN=15m
JWT_CHECKOUT_EXPIRES_IN=30m

# ==========================================
# CORS
# ==========================================
CORS_ORIGIN=http://localhost:5173

# ==========================================
# Pagar.me (TESTE - Sandbox)
# ==========================================
# Crie sua conta em https://dash.pagar.me
# Use as chaves do modo SANDBOX
PAGARME_ACCOUNT_ID=acc_XXXXXXXXX
PAGARME_API_KEY=sk_test_XXXXXXXXX
PAGARME_PUBLIC_KEY=pk_test_XXXXXXXXX

# ==========================================
# SMTP (Desenvolvimento - usar Mailtrap ou similar)
# ==========================================
# Opcao 1: Mailtrap (emails vao para inbox de teste)
# Crie conta gratuita em https://mailtrap.io
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=seu_usuario_mailtrap
SMTP_PASS=sua_senha_mailtrap
EMAIL_FROM=dev@3balug.local

# Opcao 2: Console (apenas loga no terminal, nao envia)
# Deixe as variaveis vazias e o sistema vai logar no console

# ==========================================
# TOTP (2FA)
# ==========================================
TOTP_SECRET=dev-totp-secret-muito-longo-com-mais-de-32-caracteres
TOTP_DIGITS=6
TOTP_STEP_SECONDS=300

# ==========================================
# MinIO (Object Storage - Docker local)
# ==========================================
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=3balug
MINIO_USE_SSL=false
```

### Frontend (web)

```bash
cd apps/3balug/web

# Copiar template
cp .env.example .env

# Editar
nano .env
```

### Conteudo do .env (Desenvolvimento)

```bash
# ==========================================
# DESENVOLVIMENTO LOCAL - FRONTEND
# ==========================================

# API URL
VITE_API_URL=http://localhost:3001

# Pagar.me Public Key (TESTE)
VITE_PAGARME_PUBLIC_KEY=pk_test_XXXXXXXXX
```

---

## Passo 5: Setup do Banco de Dados

```bash
cd apps/3balug/api

# 1. Criar tabelas (push do schema)
bun run db:push

# 2. Popular dados iniciais (seeds)
bun run db:seed

# 3. Verificar (opcional - abre interface web)
bun run db:studio
# Acesse http://localhost:4983
```

---

## Passo 6: Iniciar Aplicacao

### Opcao 1: Todos os apps juntos (Turborepo)

```bash
# Na raiz do monorepo
bun run dev

# Abre:
# - API: http://localhost:3001
# - Web: http://localhost:5173
```

### Opcao 2: Separadamente

```bash
# Terminal 1 - Backend
cd apps/3balug/api
bun run dev

# Terminal 2 - Frontend
cd apps/3balug/web
bun run dev
```

---

## Passo 7: Verificar se esta funcionando

### Health check da API

```bash
curl http://localhost:3001/health
# Deve retornar: {"status":"ok"}

curl http://localhost:3001/
# Deve retornar info da API
```

### Frontend

Abra http://localhost:5173 no navegador.

### MinIO Console

Abra http://localhost:9001
- Usuario: `minioadmin`
- Senha: `minioadmin123`

### Drizzle Studio (DB GUI)

```bash
cd apps/3balug/api
bun run db:studio
# Abra http://localhost:4983
```

---

## Comandos do Dia a Dia

### Desenvolvimento

```bash
# Iniciar tudo
bun run dev

# Apenas backend
cd apps/3balug/api && bun run dev

# Apenas frontend
cd apps/3balug/web && bun run dev
```

### Banco de Dados

```bash
cd apps/3balug/api

# Ver tabelas (GUI)
bun run db:studio

# Atualizar schema (apos mudar arquivos em db/schema/)
bun run db:push

# Gerar migration
bun run db:generate

# Aplicar migrations
bun run db:migrate

# Resetar banco (APAGA TUDO!)
bun run db:reset
```

### Testes

```bash
cd apps/3balug/api

# Todos os testes
bun run test

# Apenas unitarios
bun run test:unit

# Apenas E2E
bun run test:e2e

# Testes com watch
bun run test --watch
```

### Qualidade de Codigo

```bash
# Na raiz ou na pasta do app

# Lint
bun run lint

# Lint com fix
bun run lint:fix

# Verificar tipos TypeScript
bun run typecheck

# Verificar tudo
bun run validate
```

### Docker

```bash
# Subir infra
docker-compose up -d

# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Parar e remover volumes (APAGA DADOS!)
docker-compose down -v
```

---

## Problemas Comuns

### Porta ja em uso

```bash
# Encontrar processo usando porta
lsof -i :3001
lsof -i :5173
lsof -i :5432

# Matar processo
kill -9 PID
```

### Docker nao sobe

```bash
# Verificar se Docker esta rodando
docker info

# Se nao estiver, iniciar Docker Desktop

# Limpar e tentar novamente
docker-compose down -v
docker-compose up -d
```

### Erro de conexao com banco

```bash
# Verificar se PostgreSQL esta rodando
docker-compose ps | grep postgres

# Testar conexao
psql -h localhost -U basylab -d basylab -c "SELECT 1"
# Senha: basylab123

# Se nao conectar, reiniciar
docker-compose restart postgres
```

### Erro de permissao no Bun

```bash
# Reinstalar Bun
curl -fsSL https://bun.sh/install | bash

# Recarregar shell
source ~/.bashrc
# ou
source ~/.zshrc
```

### node_modules corrompido

```bash
# Limpar e reinstalar
rm -rf node_modules
rm -rf apps/*/node_modules
rm bun.lock
bun install
```

---

## Estrutura de Pastas

```
~/Documents/www/bassetto/
└── basylabrepo/                    # Monorepo principal
    ├── apps/
    │   ├── 3balug/                 # Projeto CRM Imobiliario
    │   │   ├── api/                # Backend
    │   │   │   ├── src/
    │   │   │   ├── .env            # Variaveis locais
    │   │   │   └── package.json
    │   │   ├── web/                # Frontend
    │   │   │   ├── src/
    │   │   │   ├── .env
    │   │   │   └── package.json
    │   │   └── docs/               # Documentacao do projeto
    │   │
    │   └── [outros-projetos]/
    │
    ├── packages/                   # Pacotes compartilhados
    ├── docker-compose.yml          # Infraestrutura local
    ├── turbo.json                  # Config Turborepo
    └── package.json                # Root package
```

---

## Proximos Passos

Apos configurar o ambiente:

1. Ler a documentacao do projeto em `apps/3balug/docs/`
2. Entender a arquitetura em `apps/3balug/docs/ARCHITECTURE.md`
3. Ver o roadmap em `apps/3balug/docs/ROADMAP.md`
4. Explorar o codigo

---

**Proxima leitura:** [06-ARQUITETURA-PROJETO.md](06-ARQUITETURA-PROJETO.md)
