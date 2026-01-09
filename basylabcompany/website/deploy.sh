#!/bin/bash
# deploy.sh - Deploy automatizado do site BasyLab para basylab.com.br
#
# Uso:
#   ./deploy.sh           # Deploy normal
#   ./deploy.sh --quick   # Deploy sem confirmacao
#   ./deploy.sh --setup   # Primeiro deploy (configura tudo)

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

# Flags
QUICK_MODE=false
SETUP_MODE=false

# Parse argumentos
for arg in "$@"; do
    case $arg in
        --quick)
            QUICK_MODE=true
            shift
            ;;
        --setup)
            SETUP_MODE=true
            shift
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Deploy BasyLab Website${NC}"
echo -e "${BLUE}   Dominio: ${DOMAIN}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. Entrar no diretorio
cd "$PROJECT_DIR"
echo -e "${GREEN}[1/9] Diretorio: $PROJECT_DIR${NC}"

# 2. Verificar branch
if [ -d ".git" ]; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "N/A")
    echo -e "${GREEN}[2/9] Branch atual: $BRANCH${NC}"
else
    echo -e "${YELLOW}[2/9] Nao e um repositorio git${NC}"
fi

if [ "$QUICK_MODE" = false ]; then
    read -p "Continuar com deploy? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deploy cancelado${NC}"
        exit 1
    fi
fi

# 3. Instalar dependencias e fazer build
echo -e "${GREEN}[3/9] Instalando dependencias e fazendo build...${NC}"
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
echo -e "${GREEN}[4/9] Criando release: $TIMESTAMP${NC}"
ssh $REMOTE_HOST "mkdir -p $REMOTE_PATH/releases/$TIMESTAMP"

# 6. Enviar arquivos
echo -e "${GREEN}[5/9] Enviando arquivos...${NC}"

# Enviar standalone (servidor + dependencias minimas)
rsync -avz --progress \
  .next/standalone/ $REMOTE_HOST:$REMOTE_PATH/releases/$TIMESTAMP/

# Enviar arquivos estaticos (.next/static)
rsync -avz --progress \
  .next/static/ $REMOTE_HOST:$REMOTE_PATH/releases/$TIMESTAMP/.next/static/

# Enviar pasta public
rsync -avz --progress \
  public/ $REMOTE_HOST:$REMOTE_PATH/releases/$TIMESTAMP/public/

# 7. Enviar scripts de monitoramento e configuracao
echo -e "${GREEN}[6/9] Enviando scripts de suporte...${NC}"
ssh $REMOTE_HOST "mkdir -p $REMOTE_PATH/scripts $REMOTE_PATH/shared/error-pages $REMOTE_PATH/shared/logs"

# Enviar scripts
rsync -avz scripts/ $REMOTE_HOST:$REMOTE_PATH/scripts/
rsync -avz scripts/50x.html $REMOTE_HOST:$REMOTE_PATH/shared/error-pages/

# Dar permissao de execucao
ssh $REMOTE_HOST "chmod +x $REMOTE_PATH/scripts/*.sh 2>/dev/null || true"

# 8. Ativar release e restart PM2
echo -e "${GREEN}[7/9] Ativando release e reiniciando PM2...${NC}"
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

# 9. Setup inicial (apenas se --setup)
if [ "$SETUP_MODE" = true ]; then
    echo -e "${GREEN}[8/9] Configurando monitoramento e cron jobs...${NC}"

    ssh $REMOTE_HOST << 'EOF'
        # Configurar cron jobs se nao existirem
        CRON_EXISTS=$(crontab -l 2>/dev/null | grep -c "basylab-site" || true)

        if [ "$CRON_EXISTS" -eq 0 ]; then
            (crontab -l 2>/dev/null || true; echo "# Basylab Site - Warmup (a cada 3 minutos)") | crontab -
            (crontab -l 2>/dev/null; echo "*/3 * * * * /apps/basylab-site/scripts/warmup.sh >> /apps/basylab-site/shared/logs/warmup.log 2>&1") | crontab -
            (crontab -l 2>/dev/null; echo "# Basylab Site - Health Check (a cada 5 minutos)") | crontab -
            (crontab -l 2>/dev/null; echo "*/5 * * * * /apps/basylab-site/scripts/health-check.sh >> /apps/basylab-site/shared/logs/health-check.log 2>&1") | crontab -
            echo "Cron jobs configurados"
        else
            echo "Cron jobs ja existem"
        fi
EOF
else
    echo -e "${GREEN}[8/9] Pulando setup (use --setup para configurar cron jobs)${NC}"
fi

# 10. Limpar releases antigas (manter 5)
echo -e "${GREEN}[9/9] Limpando releases antigas...${NC}"
ssh $REMOTE_HOST "cd $REMOTE_PATH/releases && ls -t | tail -n +6 | xargs -r rm -rf"

# Verificar deploy
echo ""
echo -e "${YELLOW}=== Verificando deploy ===${NC}"
ssh $REMOTE_HOST "pm2 list | grep $PM2_APP"
echo ""

# Testar endpoints
echo -e "${YELLOW}Testando endpoints...${NC}"
sleep 3

# Testar pagina principal
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}Homepage: HTTP 200 OK${NC}"
else
    echo -e "${YELLOW}Homepage: HTTP $HTTP_CODE (pode levar alguns segundos)${NC}"
fi

# Testar health check
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health 2>/dev/null || echo "000")
if [ "$HEALTH_CODE" = "200" ]; then
    echo -e "${GREEN}Health Check: HTTP 200 OK${NC}"
    # Mostrar detalhes do health
    curl -s https://$DOMAIN/health | head -1
else
    echo -e "${YELLOW}Health Check: HTTP $HEALTH_CODE${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Deploy concluido com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Release: ${BLUE}$TIMESTAMP${NC}"
echo -e "URL: ${BLUE}https://$DOMAIN${NC}"
echo -e "URL: ${BLUE}https://www.$DOMAIN${NC}"
echo -e "Health: ${BLUE}https://$DOMAIN/health${NC}"
echo ""
echo -e "${YELLOW}Monitoramento:${NC}"
echo -e "  Grafana: ${BLUE}https://grafana.basylab.com.br${NC}"
echo -e "  Logs: ${BLUE}ssh $REMOTE_HOST 'pm2 logs $PM2_APP'${NC}"
