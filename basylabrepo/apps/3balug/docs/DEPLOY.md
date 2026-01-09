# Guia de Deploy - 3Balug (Homologacao)

Este documento descreve o processo completo de deploy do projeto 3Balug na VM de homologacao.

---

## Indice

1. [Analise de Problemas Recorrentes](#analise-de-problemas-recorrentes)
2. [Pre-Deploy Checklist (OBRIGATORIO)](#pre-deploy-checklist-obrigatorio)
3. [Deploy do Backend](#deploy-do-backend)
4. [Deploy do Frontend](#deploy-do-frontend)
5. [Migrations do Banco de Dados](#migrations-do-banco-de-dados)
6. [Validacao Pos-Deploy](#validacao-pos-deploy)
7. [Troubleshooting](#troubleshooting)
8. [Scripts de Automacao](#scripts-de-automacao)

---

## Analise de Problemas Recorrentes

### Problemas Identificados (31/12/2025)

| Problema | Causa Raiz | Impacto | Solucao |
|----------|-----------|---------|---------|
| **Erros 500 - Tabelas inexistentes** | Migrations nao geradas/aplicadas para novas tabelas (properties, property_owners, tenants, contracts, property_photos) | API quebrada | Gerar migrations antes do deploy |
| **Conflito de rotas Elysia** | Parametros com nomes diferentes na mesma posicao (`:id` vs `:propertyId`) | API nao inicia | Padronizar nomes de parametros |
| **Sharp/dependencias nativas** | Bundle do Mac nao funciona no Linux | Erros de imagem | Sempre rodar `bun install` na VM |
| **Migrations com credenciais erradas** | `drizzle.config.ts` tem fallback para credenciais antigas | Migrations falham | Usar DATABASE_URL explicito |
| **Deploy sem validacao** | Nao ha verificacao pre-deploy | Deploys quebrados | Implementar pre-deploy checks |

### Causa Raiz Principal

O fluxo de desenvolvimento NAO inclui verificacao obrigatoria de:
1. **Migrations pendentes** - Schema alterado sem gerar SQL
2. **Testes locais** - Codigo deployado sem testar
3. **Compatibilidade de rotas** - Conflitos nao detectados

---

## Pre-Deploy Checklist (OBRIGATORIO)

**EXECUTE TODOS OS PASSOS ANTES DE QUALQUER DEPLOY**

### 1. Verificar Migrations Pendentes

```bash
cd ~/Documents/www/bassetto/3balug/backend

# Comparar schema local vs migrations existentes
bun run db:generate --dry-run 2>&1 | head -20

# Se houver diferencas, gerar migrations
bun run db:generate
```

**Se gerar novos arquivos em `drizzle/`, commite-os antes do deploy!**

### 2. Verificar Conflitos de Rotas

```bash
# Buscar parametros inconsistentes nas rotas
grep -r "/:.*Id" src/controllers/routes --include="*.ts" | \
  grep -E "\.(get|post|put|patch|delete)\(" | \
  sed 's/.*"\(\/[^"]*\)".*/\1/' | sort | uniq -c | sort -rn

# Regra: Todas as rotas devem usar :id para o primeiro parametro
# Exemplo CORRETO:   /properties/:id/photos/:photoId
# Exemplo ERRADO:    /properties/:propertyId/photos/:photoId
```

### 3. Rodar Testes Localmente

```bash
# Typecheck
bun run typecheck

# Lint
bun run lint

# Testes unitarios
bun run test:unit

# Se houver erros, NAO faca deploy!
```

### 4. Verificar Variaveis de Ambiente

```bash
# Frontend - deve apontar para dominio HTTPS
cat ~/Documents/www/bassetto/3balug/client/.env.production
# VITE_API_URL=https://api-3balug.basylab.com.br  <-- CORRETO
# VITE_API_URL=http://46.202.150.28:3003          <-- ERRADO!
```

### 5. Verificar Estado da VM

```bash
# Conexao OK?
ssh deploy@46.202.150.28 "echo 'OK'"

# Servicos rodando?
ssh deploy@46.202.150.28 "sudo systemctl is-active 3balug-api-blue"

# Banco acessivel?
ssh deploy@46.202.150.28 "docker exec infra-postgres pg_isready -U balug_user -d 3balug"
```

---

## Deploy do Backend

### Passo 1: Pre-Deploy Checks (NAO PULE!)

```bash
cd ~/Documents/www/bassetto/3balug/backend

# 1. Verificar se ha migrations pendentes
echo "=== Verificando migrations ==="
PENDING=$(bun run db:generate --dry-run 2>&1 | grep -c "CREATE TABLE\|ALTER TABLE" || true)
if [ "$PENDING" -gt 0 ]; then
  echo "ERRO: Ha migrations pendentes! Gere-as primeiro com: bun run db:generate"
  exit 1
fi

# 2. Typecheck
echo "=== Typecheck ==="
bun run typecheck || { echo "ERRO: Typecheck falhou!"; exit 1; }

# 3. Lint
echo "=== Lint ==="
bun run lint || { echo "ERRO: Lint falhou!"; exit 1; }

echo "=== Pre-deploy checks OK! ==="
```

### Passo 2: Preparar Bundle

```bash
cd ~/Documents/www/bassetto/3balug/backend

# Instalar dependencias
bun install

# Criar bundle (sem node_modules - sera instalado na VM)
RELEASE=$(date +%Y%m%d%H%M%S)
tar -czvf /tmp/bundle-api-$RELEASE.tar.gz \
  src/ \
  package.json \
  bun.lock \
  tsconfig.json \
  drizzle/ \
  drizzle.config.ts

echo "Bundle criado: /tmp/bundle-api-$RELEASE.tar.gz"
echo "RELEASE=$RELEASE"
```

### Passo 3: Enviar para VM

```bash
# Usar IP publico (Tailscale pode estar inativo)
scp /tmp/bundle-api-$RELEASE.tar.gz deploy@46.202.150.28:/tmp/
```

### Passo 4: Deploy na VM

```bash
ssh deploy@46.202.150.28

# Usar o mesmo timestamp do bundle
RELEASE=<TIMESTAMP_DO_BUNDLE>

# Criar diretorio
sudo mkdir -p /apps/3balug-api/releases/$RELEASE

# Extrair (ignorar warnings de metadados macOS)
sudo tar -xzf /tmp/bundle-api-*.tar.gz -C /apps/3balug-api/releases/$RELEASE 2>/dev/null

# Linkar .env
sudo ln -sf /apps/3balug-api/shared/.env /apps/3balug-api/releases/$RELEASE/.env

# Permissoes
sudo chown -R balug:balug /apps/3balug-api/releases/$RELEASE

# IMPORTANTE: Instalar dependencias na VM (Linux)
sudo -u balug -- bash -lc "cd /apps/3balug-api/releases/$RELEASE && bun install --production --frozen-lockfile"

# Atualizar symlink
sudo rm -f /apps/3balug-api/current
sudo ln -sf /apps/3balug-api/releases/$RELEASE /apps/3balug-api/current

# Reiniciar servico
sudo systemctl restart 3balug-api-blue

# Aguardar inicializacao
sleep 3

# Verificar status
sudo systemctl status 3balug-api-blue --no-pager | head -15

# Limpar bundle
rm -f /tmp/bundle-api-*.tar.gz
```

### Passo 5: Validar Backend

```bash
# Health check (deve retornar "healthy")
curl -s https://api-3balug.basylab.com.br/health | jq -r '.status'

# Ver logs se houver problemas
sudo journalctl -u 3balug-api-blue -n 50 --no-pager
```

---

## Deploy do Frontend

### Passo 1: Build

```bash
cd ~/Documents/www/bassetto/3balug/client

# Verificar .env.production
grep VITE_API_URL .env.production
# Deve ser: VITE_API_URL=https://api-3balug.basylab.com.br

# Instalar e buildar
bun install
bun run build
```

### Passo 2: Enviar Bundle

```bash
RELEASE=$(date +%Y%m%d%H%M%S)
tar -czvf /tmp/bundle-front-$RELEASE.tar.gz -C dist .
scp /tmp/bundle-front-$RELEASE.tar.gz deploy@46.202.150.28:/tmp/
echo "RELEASE=$RELEASE"
```

### Passo 3: Deploy na VM

```bash
ssh deploy@46.202.150.28

RELEASE=<TIMESTAMP_DO_BUNDLE>

# Criar diretorio e extrair
sudo mkdir -p /apps/3balug/releases/$RELEASE
sudo tar -xzf /tmp/bundle-front-*.tar.gz -C /apps/3balug/releases/$RELEASE 2>/dev/null

# Permissoes
sudo chown -R www-data:www-data /apps/3balug/releases/$RELEASE

# Atualizar symlink
sudo rm -f /apps/3balug/current
sudo ln -sf /apps/3balug/releases/$RELEASE /apps/3balug/current

# Limpar
rm -f /tmp/bundle-front-*.tar.gz
```

### Passo 4: Validar Frontend

```bash
# Deve retornar HTTP 200
curl -sI https://3balug.basylab.com.br | head -1
```

---

## Migrations do Banco de Dados

### Fluxo Correto de Migrations

```
1. Alterar schema em src/db/schema/*.ts
2. Gerar migration: bun run db:generate
3. Revisar SQL gerado em drizzle/
4. Commitar a migration
5. Deploy do backend
6. Aplicar migration na VM
```

### Gerar Migrations (Local)

```bash
cd ~/Documents/www/bassetto/3balug/backend

# Gerar migrations baseado no schema atual
bun run db:generate

# Verificar o que foi gerado
ls -la drizzle/
cat drizzle/*.sql | tail -50
```

### Aplicar Migrations (VM)

```bash
ssh deploy@46.202.150.28

cd /apps/3balug-api/current

# Aplicar migrations com credenciais corretas
DATABASE_URL='postgresql://balug_user:balug_secure_pwd_2024@127.0.0.1:5432/3balug' \
  bun run db:migrate
```

### Verificar Estado do Banco

```bash
# Listar tabelas
ssh deploy@46.202.150.28 \
  "docker exec infra-postgres psql -U balug_user -d 3balug -c '\dt'"

# Verificar migrations aplicadas
ssh deploy@46.202.150.28 \
  "docker exec infra-postgres psql -U balug_user -d 3balug \
   -c 'SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5;'"
```

### Aplicar SQL Manualmente (Fallback)

Se `db:migrate` falhar:

```bash
# Ver arquivos de migration
ls /apps/3balug-api/current/drizzle/*.sql

# Aplicar um arquivo especifico
cat /apps/3balug-api/current/drizzle/0007_nova_tabela.sql | \
  docker exec -i infra-postgres psql -U balug_user -d 3balug
```

---

## Validacao Pos-Deploy

### Checklist Obrigatorio

```bash
# 1. API Health
curl -s https://api-3balug.basylab.com.br/health | jq .

# 2. Endpoints funcionando
curl -s https://api-3balug.basylab.com.br/plans | jq '.[].name'

# 3. Frontend acessivel
curl -sI https://3balug.basylab.com.br | head -3

# 4. Sem erros 500 nos logs
ssh deploy@46.202.150.28 \
  "sudo journalctl -u 3balug-api-blue --since '5 minutes ago' | grep -c 'status\":500'" 
# Deve retornar 0

# 5. Tabelas existem
ssh deploy@46.202.150.28 \
  "docker exec infra-postgres psql -U balug_user -d 3balug -c '\dt' | wc -l"
# Deve retornar numero >= 10 (header + tabelas)
```

---

## Troubleshooting

### Erro: "relation does not exist"

**Causa:** Tabelas nao existem no banco (migrations nao aplicadas)

**Solucao:**
```bash
# 1. Verificar tabelas existentes
ssh deploy@46.202.150.28 \
  "docker exec infra-postgres psql -U balug_user -d 3balug -c '\dt'"

# 2. Gerar migrations localmente
cd ~/Documents/www/bassetto/3balug/backend
bun run db:generate

# 3. Fazer novo deploy do backend (com as migrations)

# 4. Aplicar migrations na VM
ssh deploy@46.202.150.28
cd /apps/3balug-api/current
DATABASE_URL='postgresql://balug_user:balug_secure_pwd_2024@127.0.0.1:5432/3balug' \
  bun run db:migrate
```

### Erro: "Cannot create route with different parameter name"

**Causa:** Conflito de parametros em rotas (ex: `:id` vs `:propertyId`)

**Solucao:**
```bash
# Encontrar conflitos
grep -r "/:.*Id" src/controllers/routes --include="*.ts"

# Padronizar para :id em todas as rotas principais
# /properties/:id          (nao :propertyId)
# /properties/:id/photos   (nao :propertyId/photos)
```

### Erro: "password authentication failed"

**Causa:** Credenciais do drizzle.config.ts estao erradas

**Solucao:**
```bash
# Passar DATABASE_URL explicitamente
DATABASE_URL='postgresql://balug_user:balug_secure_pwd_2024@127.0.0.1:5432/3balug' \
  bun run db:migrate
```

### API retorna 502 Bad Gateway

**Verificar:**
```bash
# 1. Servico rodando?
sudo systemctl status 3balug-api-blue

# 2. Ver logs de erro
sudo journalctl -u 3balug-api-blue -n 100 | grep -i error

# 3. Porta ocupada?
sudo ss -tlnp | grep 3003

# 4. Reiniciar servico
sudo systemctl restart 3balug-api-blue
```

### Sharp/Imagens nao funcionam

**Causa:** Dependencias nativas compiladas no Mac

**Solucao:**
```bash
ssh deploy@46.202.150.28
cd /apps/3balug-api/current
sudo -u balug bun install --production --force
sudo systemctl restart 3balug-api-blue
```

---

## Scripts de Automacao

### Script de Deploy Completo

Salvar como `~/Documents/www/bassetto/3balug/scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

BACKEND_DIR=~/Documents/www/bassetto/3balug/backend
CLIENT_DIR=~/Documents/www/bassetto/3balug/client
VM="deploy@46.202.150.28"

echo "=========================================="
echo "  DEPLOY 3BALUG - $(date)"
echo "=========================================="

# Pre-checks
echo ""
echo "[1/8] Pre-deploy checks..."
cd $BACKEND_DIR
bun run typecheck || { echo "ERRO: Typecheck falhou!"; exit 1; }

# Bundle backend
echo ""
echo "[2/8] Criando bundle do backend..."
RELEASE=$(date +%Y%m%d%H%M%S)
tar -czf /tmp/bundle-api-$RELEASE.tar.gz src/ package.json bun.lock tsconfig.json drizzle/ drizzle.config.ts

# Bundle frontend
echo ""
echo "[3/8] Build do frontend..."
cd $CLIENT_DIR
bun run build
tar -czf /tmp/bundle-front-$RELEASE.tar.gz -C dist .

# Enviar bundles
echo ""
echo "[4/8] Enviando bundles para VM..."
scp /tmp/bundle-api-$RELEASE.tar.gz $VM:/tmp/
scp /tmp/bundle-front-$RELEASE.tar.gz $VM:/tmp/

# Deploy na VM
echo ""
echo "[5/8] Executando deploy na VM..."
ssh $VM "
set -e

# Backend
echo '>> Deploying backend...'
sudo mkdir -p /apps/3balug-api/releases/$RELEASE
sudo tar -xzf /tmp/bundle-api-*.tar.gz -C /apps/3balug-api/releases/$RELEASE 2>/dev/null
sudo ln -sf /apps/3balug-api/shared/.env /apps/3balug-api/releases/$RELEASE/.env
sudo chown -R balug:balug /apps/3balug-api/releases/$RELEASE
sudo -u balug -- bash -lc 'cd /apps/3balug-api/releases/$RELEASE && bun install --production --frozen-lockfile'
sudo rm -f /apps/3balug-api/current
sudo ln -sf /apps/3balug-api/releases/$RELEASE /apps/3balug-api/current
sudo systemctl restart 3balug-api-blue

# Frontend
echo '>> Deploying frontend...'
sudo mkdir -p /apps/3balug/releases/$RELEASE
sudo tar -xzf /tmp/bundle-front-*.tar.gz -C /apps/3balug/releases/$RELEASE 2>/dev/null
sudo chown -R www-data:www-data /apps/3balug/releases/$RELEASE
sudo rm -f /apps/3balug/current
sudo ln -sf /apps/3balug/releases/$RELEASE /apps/3balug/current

# Cleanup
rm -f /tmp/bundle-*.tar.gz
"

# Validacao
echo ""
echo "[6/8] Aguardando API iniciar..."
sleep 5

echo ""
echo "[7/8] Validando deploy..."
HEALTH=$(curl -s https://api-3balug.basylab.com.br/health | jq -r '.status' 2>/dev/null || echo "failed")
if [ "$HEALTH" != "healthy" ]; then
  echo "ERRO: Health check falhou!"
  echo "Verifique os logs: ssh $VM 'sudo journalctl -u 3balug-api-blue -n 50'"
  exit 1
fi

FRONTEND=$(curl -sI https://3balug.basylab.com.br | head -1 | grep -c "200" || true)
if [ "$FRONTEND" -eq 0 ]; then
  echo "AVISO: Frontend pode nao estar acessivel"
fi

# Cleanup local
echo ""
echo "[8/8] Limpando bundles locais..."
rm -f /tmp/bundle-*.tar.gz

echo ""
echo "=========================================="
echo "  DEPLOY CONCLUIDO COM SUCESSO!"
echo "=========================================="
echo ""
echo "URLs:"
echo "  Frontend: https://3balug.basylab.com.br"
echo "  API:      https://api-3balug.basylab.com.br/health"
echo ""
```

### Script de Validacao

```bash
#!/bin/bash
# validate-deploy.sh

echo "=== Validacao do Deploy ==="
echo ""

# API Health
echo "1. API Health Check:"
curl -s https://api-3balug.basylab.com.br/health | jq .
echo ""

# Planos
echo "2. Planos disponiveis:"
curl -s https://api-3balug.basylab.com.br/plans | jq '.[].name'
echo ""

# Frontend
echo "3. Frontend status:"
curl -sI https://3balug.basylab.com.br | head -3
echo ""

# Erros recentes
echo "4. Erros nos ultimos 5 minutos:"
ssh deploy@46.202.150.28 \
  "sudo journalctl -u 3balug-api-blue --since '5 minutes ago' 2>/dev/null | grep -c 'status\":500' || echo 0"
echo ""

echo "=== Validacao concluida ==="
```

---

## Configuracao de Ambiente

### Backend (.env na VM)

Localizacao: `/apps/3balug-api/shared/.env`

```env
# Ambiente
NODE_ENV=production
PORT=3003

# Database (SEMPRE 127.0.0.1 na VM)
DATABASE_URL=postgresql://balug_user:balug_secure_pwd_2024@127.0.0.1:5432/3balug

# Redis (SEMPRE 127.0.0.1 na VM)
REDIS_URL=redis://:redis_secure_pwd_2024@127.0.0.1:6379

# URLs Publicas
API_URL=https://api-3balug.basylab.com.br
FRONTEND_URL=https://3balug.basylab.com.br

# CORS
CORS_ALLOWED_ORIGINS=https://3balug.basylab.com.br

# JWT (gerados com openssl rand -base64 48)
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>

# Pagar.me SANDBOX
PAGARME_API_KEY=sk_test_...
PAGARME_PUBLIC_KEY=pk_test_...
```

### Frontend (.env.production)

```env
VITE_API_URL=https://api-3balug.basylab.com.br
VITE_PAGARME_PUBLIC_KEY=pk_test_...
```

---

## Comandos Rapidos

```bash
# === LOGS ===
# Logs em tempo real
ssh deploy@46.202.150.28 "sudo journalctl -u 3balug-api-blue -f"

# Ultimos 50 logs
ssh deploy@46.202.150.28 "sudo journalctl -u 3balug-api-blue -n 50"

# Apenas erros
ssh deploy@46.202.150.28 "sudo journalctl -u 3balug-api-blue | grep -i error | tail -20"

# === SERVICOS ===
# Status
ssh deploy@46.202.150.28 "sudo systemctl status 3balug-api-blue"

# Restart
ssh deploy@46.202.150.28 "sudo systemctl restart 3balug-api-blue"

# === BANCO ===
# Listar tabelas
ssh deploy@46.202.150.28 "docker exec infra-postgres psql -U balug_user -d 3balug -c '\dt'"

# Query direta
ssh deploy@46.202.150.28 "docker exec infra-postgres psql -U balug_user -d 3balug -c 'SELECT COUNT(*) FROM users;'"

# === ROLLBACK ===
# Ver releases disponiveis
ssh deploy@46.202.150.28 "ls -lt /apps/3balug-api/releases/"

# Rollback
ssh deploy@46.202.150.28 "sudo rollback api 3balug"
```

---

**Documento atualizado em:** 31/12/2025  
**Autor:** Claude Code  
**VM:** BasyLab Homologacao (46.202.150.28)
