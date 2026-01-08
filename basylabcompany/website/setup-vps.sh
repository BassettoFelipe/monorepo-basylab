#!/bin/bash
# setup-vps.sh - Setup inicial na VPS para o site BasyLab
# Executar APENAS UMA VEZ antes do primeiro deploy

set -e

REMOTE_HOST="vps-basylab-public"
REMOTE_PATH="/apps/basylab-site"
DOMAIN="basylab.com.br"

echo "=== Setup inicial do BasyLab Site na VPS ==="
echo ""

# 1. Criar estrutura de pastas
echo "[1/4] Criando estrutura de pastas..."
ssh $REMOTE_HOST << EOF
    mkdir -p $REMOTE_PATH/releases
    mkdir -p $REMOTE_PATH/shared/logs
    mkdir -p $REMOTE_PATH/shared/env
    echo "Estrutura criada:"
    ls -la $REMOTE_PATH
EOF

# 2. Copiar config do Nginx
echo "[2/4] Copiando configuracao Nginx..."
scp nginx.conf $REMOTE_HOST:/tmp/basylab-site.conf

ssh $REMOTE_HOST << EOF
    sudo mv /tmp/basylab-site.conf /etc/nginx/sites-available/basylab-site

    # Remover link se existir
    sudo rm -f /etc/nginx/sites-enabled/basylab-site

    # Criar link simbolico
    sudo ln -s /etc/nginx/sites-available/basylab-site /etc/nginx/sites-enabled/

    echo "Nginx config instalada"
EOF

# 3. Gerar certificado SSL (se necessario)
echo "[3/4] Verificando certificado SSL..."
ssh $REMOTE_HOST << EOF
    if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo "Gerando certificado SSL para $DOMAIN..."
        sudo certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email contato@basylab.com.br
    else
        echo "Certificado SSL ja existe"
    fi
EOF

# 4. Testar e recarregar Nginx
echo "[4/4] Testando e recarregando Nginx..."
ssh $REMOTE_HOST << EOF
    sudo nginx -t
    sudo systemctl reload nginx
    echo "Nginx recarregado"
EOF

echo ""
echo "=== Setup concluido! ==="
echo ""
echo "Proximos passos:"
echo "1. Execute ./deploy.sh para fazer o primeiro deploy"
echo "2. Verifique https://$DOMAIN"
