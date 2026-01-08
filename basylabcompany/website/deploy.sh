#!/bin/bash
# deploy.sh - Deploy automatizado do site BasyLab para basylab.com.br

set -e  # Para no primeiro erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuracoes
PROJECT_DIR="$HOME/Documents/www/bassetto/basylabcompany/website"
REMOTE_HOST="vps-basylab-public"
REMOTE_PATH="/apps/basylab-site"
PM2_APP="basylab-site"
DOMAIN="basylab.com.br"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Deploy BasyLab Website${NC}"
echo -e "${BLUE}   Dominio: ${DOMAIN}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. Entrar no diretorio
cd "$PROJECT_DIR"
echo -e "${GREEN}[1/7] Diretorio: $PROJECT_DIR${NC}"

# 2. Verificar branch
if [ -d ".git" ]; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "N/A")
    echo -e "${GREEN}[2/7] Branch atual: $BRANCH${NC}"
else
    echo -e "${YELLOW}[2/7] Nao e um repositorio git${NC}"
fi

read -p "Continuar com deploy? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deploy cancelado${NC}"
    exit 1
fi

# 3. Instalar dependencias e fazer build
echo -e "${GREEN}[3/7] Instalando dependencias e fazendo build...${NC}"
bun install
bun run build

# 4. Verificar se build foi criado
if [ ! -d ".next/standalone" ]; then
    echo -e "${RED}Erro: Build standalone nao foi criado${NC}"
    echo -e "${RED}Verifique se 'output: standalone' esta no next.config.ts${NC}"
    exit 1
fi

# 5. Criar timestamp e pasta na VPS
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}[4/7] Criando release: $TIMESTAMP${NC}"
ssh $REMOTE_HOST "mkdir -p $REMOTE_PATH/releases/$TIMESTAMP"

# 6. Enviar arquivos
echo -e "${GREEN}[5/7] Enviando arquivos...${NC}"

# Enviar standalone (servidor + dependencias minimas)
rsync -avz --progress \
  .next/standalone/ $REMOTE_HOST:$REMOTE_PATH/releases/$TIMESTAMP/

# Enviar arquivos estaticos (.next/static)
rsync -avz --progress \
  .next/static/ $REMOTE_HOST:$REMOTE_PATH/releases/$TIMESTAMP/.next/static/

# Enviar pasta public
rsync -avz --progress \
  public/ $REMOTE_HOST:$REMOTE_PATH/releases/$TIMESTAMP/public/

# 7. Ativar release e restart PM2
echo -e "${GREEN}[6/7] Ativando release e reiniciando PM2...${NC}"
ssh $REMOTE_HOST << EOF
  cd $REMOTE_PATH

  # Atualizar symlink (atomico)
  ln -sfn releases/$TIMESTAMP current

  # Verificar se PM2 app existe
  if pm2 list | grep -q "$PM2_APP"; then
    echo "Recarregando $PM2_APP..."
    pm2 reload $PM2_APP --update-env
  else
    echo "Iniciando $PM2_APP pela primeira vez..."
    cd current
    PORT=3005 pm2 start server.js --name $PM2_APP
    pm2 save
  fi
EOF

# 8. Limpar releases antigas (manter 5)
echo -e "${GREEN}[7/7] Limpando releases antigas...${NC}"
ssh $REMOTE_HOST "cd $REMOTE_PATH/releases && ls -t | tail -n +6 | xargs -r rm -rf"

# Verificar deploy
echo ""
echo -e "${YELLOW}=== Verificando deploy ===${NC}"
ssh $REMOTE_HOST "pm2 list | grep $PM2_APP"
echo ""

# Testar endpoint
echo -e "${YELLOW}Testando endpoint...${NC}"
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}Site respondendo com HTTP 200${NC}"
else
    echo -e "${YELLOW}HTTP Code: $HTTP_CODE (pode levar alguns segundos para ficar disponivel)${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Deploy concluido com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Release: ${BLUE}$TIMESTAMP${NC}"
echo -e "URL: ${BLUE}https://$DOMAIN${NC}"
echo -e "URL: ${BLUE}https://www.$DOMAIN${NC}"
