# Deploy Passo a Passo - Guia Completo

Guia completo para fazer deploy de aplicacoes na VPS BasyLab.

---

## Visao Geral da Estrategia

Usamos **deploy com releases e symlinks** (similar ao Capistrano):

```
/apps/projeto/
├── current -> releases/20260108_143000   # Symlink para release ativa
├── releases/
│   ├── 20260108_143000/                  # Release atual
│   ├── 20260107_120000/                  # Release anterior (rollback)
│   └── 20260106_090000/                  # Release mais antiga
└── shared/
    ├── env/                              # Arquivos .env
    │   └── .env.production
    └── logs/                             # Logs persistentes
        ├── out.log
        └── error.log
```

**Vantagens:**
- Rollback instantaneo (troca de symlink)
- Zero-downtime (PM2 reload)
- Historico de releases
- Arquivos compartilhados persistentes

---

## Deploy do Backend (3balug-api)

### Pre-requisitos

1. Acesso SSH configurado (ver [01-ACESSO-VPS.md](01-ACESSO-VPS.md))
2. Codigo testado localmente
3. Build funcionando

### Passo 1: Preparar Build Local

```bash
# 1. Entrar na pasta do projeto
cd ~/Documents/www/bassetto/basylabrepo/apps/3balug/api

# 2. Instalar dependencias
bun install

# 3. Rodar testes (opcional mas recomendado)
bun run test

# 4. Fazer build
bun run build

# 5. Verificar se o build foi criado
ls -la dist/
```

### Passo 2: Criar Nova Release na VPS

```bash
# 1. Conectar na VPS
ssh vps-basylab-public

# 2. Navegar para o projeto
cd /apps/3balug-api

# 3. Criar pasta da nova release com timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "Criando release: $TIMESTAMP"
mkdir -p releases/$TIMESTAMP

# 4. Sair da VPS
exit
```

### Passo 3: Enviar Arquivos para VPS

```bash
# No seu computador local
cd ~/Documents/www/bassetto/basylabrepo/apps/3balug/api

# Definir timestamp (mesmo usado na VPS)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Enviar arquivos via rsync
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'coverage' \
  --exclude '.turbo' \
  ./ vps-basylab-public:/apps/3balug-api/releases/$TIMESTAMP/
```

### Passo 4: Configurar Release na VPS

```bash
# 1. Conectar na VPS
ssh vps-basylab-public

# 2. Entrar na release
TIMESTAMP=$(ls -t /apps/3balug-api/releases | head -1)
cd /apps/3balug-api/releases/$TIMESTAMP
echo "Configurando release: $TIMESTAMP"

# 3. Instalar dependencias de producao
bun install --production

# 4. Fazer build (se nao enviou o dist/)
bun run build

# 5. Linkar arquivo .env
ln -sf /apps/3balug-api/shared/env/.env.production .env

# 6. Verificar se tudo esta ok
ls -la
cat .env | head -5
```

### Passo 5: Ativar Nova Release

```bash
# 1. Ainda na VPS, voltar para raiz do projeto
cd /apps/3balug-api

# 2. Ver release atual (antes de mudar)
ls -la current

# 3. Atualizar symlink para nova release (ATOMICO)
ln -sfn releases/$TIMESTAMP current

# 4. Verificar symlink
ls -la current

# 5. Reload do PM2 (zero-downtime)
pm2 reload 3balug-api --update-env

# 6. Verificar status
pm2 list
pm2 logs 3balug-api --lines 20
```

### Passo 6: Verificar Deploy

```bash
# 1. Na VPS - verificar logs
pm2 logs 3balug-api --lines 50

# 2. No seu computador - testar API
curl https://api-3balug.basylab.com.br/health

# 3. Testar endpoint especifico
curl https://api-3balug.basylab.com.br/
```

### Passo 7: Limpar Releases Antigas

```bash
# Manter apenas as 5 ultimas releases
cd /apps/3balug-api/releases
ls -t | tail -n +6 | xargs -r rm -rf

# Verificar
ls -la
```

---

## Deploy do Frontend (3balug-web)

### Passo 1: Preparar Build Local

```bash
# 1. Entrar na pasta do projeto
cd ~/Documents/www/bassetto/basylabrepo/apps/3balug/web

# 2. Instalar dependencias
bun install

# 3. Definir ambiente de producao
cp .env.production .env

# 4. Fazer build de producao
bun run build

# 5. Verificar build
ls -la dist/
```

### Passo 2: Criar Release e Enviar

```bash
# 1. Definir timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 2. Criar pasta na VPS
ssh vps-basylab-public "mkdir -p /apps/3balug/releases/$TIMESTAMP"

# 3. Enviar build via rsync
rsync -avz --progress --delete \
  dist/ vps-basylab-public:/apps/3balug/releases/$TIMESTAMP/

# 4. Atualizar symlink na VPS
ssh vps-basylab-public "cd /apps/3balug && ln -sfn releases/$TIMESTAMP current"

# 5. Verificar
ssh vps-basylab-public "ls -la /apps/3balug/current/"
```

### Passo 3: Verificar Deploy

```bash
# Testar no navegador
open https://3balug.basylab.com.br

# Ou via curl
curl -I https://3balug.basylab.com.br
```

### Passo 4: Limpar Releases Antigas

```bash
ssh vps-basylab-public "cd /apps/3balug/releases && ls -t | tail -n +6 | xargs -r rm -rf"
```

---

## Script de Deploy Automatizado

### Backend (deploy-api.sh)

Crie este script na raiz do projeto:

```bash
#!/bin/bash
# deploy-api.sh - Deploy automatizado do backend

set -e  # Para no primeiro erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuracoes
PROJECT_DIR="$HOME/Documents/www/bassetto/basylabrepo/apps/3balug/api"
REMOTE_HOST="vps-basylab-public"
REMOTE_PATH="/apps/3balug-api"
PM2_APP="3balug-api"

echo -e "${YELLOW}=== Deploy Backend 3Balug ===${NC}"

# 1. Entrar no diretorio
cd "$PROJECT_DIR"
echo -e "${GREEN}[1/7] Diretorio: $PROJECT_DIR${NC}"

# 2. Verificar branch
BRANCH=$(git branch --show-current)
echo -e "${GREEN}[2/7] Branch atual: $BRANCH${NC}"
read -p "Continuar com deploy da branch $BRANCH? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deploy cancelado${NC}"
    exit 1
fi

# 3. Build local
echo -e "${GREEN}[3/7] Fazendo build...${NC}"
bun install
bun run build

# 4. Criar release
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}[4/7] Criando release: $TIMESTAMP${NC}"
ssh $REMOTE_HOST "mkdir -p $REMOTE_PATH/releases/$TIMESTAMP"

# 5. Enviar arquivos
echo -e "${GREEN}[5/7] Enviando arquivos...${NC}"
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env*' \
  --exclude 'coverage' \
  --exclude '.turbo' \
  ./ $REMOTE_HOST:$REMOTE_PATH/releases/$TIMESTAMP/

# 6. Configurar e ativar
echo -e "${GREEN}[6/7] Configurando release...${NC}"
ssh $REMOTE_HOST << EOF
  cd $REMOTE_PATH/releases/$TIMESTAMP
  bun install --production
  ln -sf $REMOTE_PATH/shared/env/.env.production .env
  cd $REMOTE_PATH
  ln -sfn releases/$TIMESTAMP current
  pm2 reload $PM2_APP --update-env
EOF

# 7. Limpar releases antigas
echo -e "${GREEN}[7/7] Limpando releases antigas...${NC}"
ssh $REMOTE_HOST "cd $REMOTE_PATH/releases && ls -t | tail -n +6 | xargs -r rm -rf"

# Verificar
echo -e "${YELLOW}=== Verificando deploy ===${NC}"
ssh $REMOTE_HOST "pm2 list"
echo ""
curl -s https://api-3balug.basylab.com.br/health | head -5

echo -e "${GREEN}=== Deploy concluido! ===${NC}"
echo "Release: $TIMESTAMP"
```

### Frontend (deploy-web.sh)

```bash
#!/bin/bash
# deploy-web.sh - Deploy automatizado do frontend

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuracoes
PROJECT_DIR="$HOME/Documents/www/bassetto/basylabrepo/apps/3balug/web"
REMOTE_HOST="vps-basylab-public"
REMOTE_PATH="/apps/3balug"

echo -e "${YELLOW}=== Deploy Frontend 3Balug ===${NC}"

# 1. Entrar no diretorio
cd "$PROJECT_DIR"
echo -e "${GREEN}[1/5] Diretorio: $PROJECT_DIR${NC}"

# 2. Build
echo -e "${GREEN}[2/5] Fazendo build de producao...${NC}"
cp .env.production .env
bun install
bun run build

# 3. Criar release
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}[3/5] Criando release: $TIMESTAMP${NC}"
ssh $REMOTE_HOST "mkdir -p $REMOTE_PATH/releases/$TIMESTAMP"

# 4. Enviar
echo -e "${GREEN}[4/5] Enviando arquivos...${NC}"
rsync -avz --progress --delete \
  dist/ $REMOTE_HOST:$REMOTE_PATH/releases/$TIMESTAMP/

# 5. Ativar
echo -e "${GREEN}[5/5] Ativando release...${NC}"
ssh $REMOTE_HOST "cd $REMOTE_PATH && ln -sfn releases/$TIMESTAMP current"

# Limpar antigas
ssh $REMOTE_HOST "cd $REMOTE_PATH/releases && ls -t | tail -n +6 | xargs -r rm -rf"

echo -e "${GREEN}=== Deploy concluido! ===${NC}"
echo "Release: $TIMESTAMP"
echo "URL: https://3balug.basylab.com.br"
```

### Como usar os scripts

```bash
# Dar permissao de execucao
chmod +x deploy-api.sh
chmod +x deploy-web.sh

# Executar
./deploy-api.sh
./deploy-web.sh
```

---

## Deploy com Migrations de Banco

Quando houver alteracoes no banco de dados:

### Passo 1: Verificar migrations pendentes

```bash
# Local
cd apps/3balug/api
bun run db:status
```

### Passo 2: Fazer backup do banco (IMPORTANTE!)

```bash
# Na VPS
ssh vps-basylab-public

# Backup
pg_dump -U crm_imobil_prod -d crm_imobil_prod > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql

# Verificar backup
ls -la /tmp/backup_*.sql
```

### Passo 3: Deploy normal + Migration

```bash
# Apos o deploy (na VPS, dentro da release)
cd /apps/3balug-api/current

# Aplicar migrations
bun run db:migrate

# Verificar
bun run db:status
```

### Passo 4: Se der erro, restaurar backup

```bash
# Restaurar banco
psql -U crm_imobil_prod -d crm_imobil_prod < /tmp/backup_YYYYMMDD_HHMMSS.sql

# Fazer rollback da release
cd /apps/3balug-api
ln -sfn releases/RELEASE_ANTERIOR current
pm2 reload 3balug-api
```

---

## Checklist de Deploy

### Pre-Deploy
- [ ] Codigo commitado e pushado
- [ ] Testes passando localmente
- [ ] Build funcionando
- [ ] .env de producao atualizado (se necessario)
- [ ] Verificar se ha migrations pendentes

### Durante Deploy
- [ ] Backup do banco (se houver migrations)
- [ ] Criar nova release
- [ ] Enviar arquivos
- [ ] Instalar dependencias
- [ ] Linkar .env
- [ ] Aplicar migrations (se houver)
- [ ] Atualizar symlink
- [ ] Reload PM2

### Pos-Deploy
- [ ] Verificar logs (pm2 logs)
- [ ] Testar health check
- [ ] Testar principais funcionalidades
- [ ] Limpar releases antigas
- [ ] Avisar equipe

---

## Troubleshooting

### Build falha na VPS

```bash
# Ver erro completo
cd /apps/3balug-api/releases/TIMESTAMP
bun run build 2>&1 | tee build.log

# Verificar memoria
free -h

# Se falta memoria, fazer build local e enviar dist/
```

### PM2 nao reinicia

```bash
# Verificar status
pm2 list

# Ver logs de erro
pm2 logs 3balug-api --err --lines 100

# Forcar restart
pm2 delete 3balug-api
pm2 start ecosystem.config.cjs --env production
```

### API retorna 502 Bad Gateway

```bash
# Verificar se PM2 esta rodando
pm2 list

# Verificar porta
ss -tlnp | grep 3001

# Verificar nginx
nginx -t
systemctl status nginx

# Ver logs nginx
tail -50 /var/log/nginx/error.log
```

### Arquivos estaticos nao atualizam

```bash
# Limpar cache do navegador (Ctrl+Shift+R)

# Verificar se symlink esta correto
ls -la /apps/3balug/current

# Verificar nginx
nginx -t
systemctl reload nginx
```

---

**Proxima leitura:** [03-ROLLBACK.md](03-ROLLBACK.md)
