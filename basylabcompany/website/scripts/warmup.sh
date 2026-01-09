#!/bin/bash
# warmup.sh - Script de warm-up para manter o site "quente"
#
# Instalar no cron da VPS:
# crontab -e
# */3 * * * * /apps/basylab-site/scripts/warmup.sh >> /apps/basylab-site/shared/logs/warmup.log 2>&1
#
# Isso executa a cada 3 minutos para evitar cold start

DOMAIN="https://basylab.com.br"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

# Funcao para fazer request com timeout
warmup_url() {
    local url=$1
    local response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" --connect-timeout 10 --max-time 30 "$url" 2>/dev/null)
    local status=$(echo $response | cut -d: -f1)
    local time=$(echo $response | cut -d: -f2)

    if [ "$status" = "200" ]; then
        echo "$LOG_PREFIX OK $url (${time}s)"
    else
        echo "$LOG_PREFIX WARN $url returned $status (${time}s)"
    fi
}

# Warm-up das principais paginas
warmup_url "$DOMAIN/"
warmup_url "$DOMAIN/health"
warmup_url "$DOMAIN/privacidade"
warmup_url "$DOMAIN/termos"
warmup_url "$DOMAIN/sitemap.xml"
