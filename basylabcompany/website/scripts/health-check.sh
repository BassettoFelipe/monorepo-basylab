#!/bin/bash
# health-check.sh - Verifica saude do site e reinicia se necessario
#
# Instalar no cron da VPS:
# crontab -e
# */5 * * * * /apps/basylab-site/scripts/health-check.sh >> /apps/basylab-site/shared/logs/health-check.log 2>&1

DOMAIN="https://basylab.com.br"
PM2_APP="basylab-site"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"
MAX_RETRIES=3
RETRY_DELAY=5

# Funcao para verificar saude
check_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$DOMAIN/health" 2>/dev/null)
    echo $response
}

# Funcao para reiniciar PM2
restart_pm2() {
    echo "$LOG_PREFIX Reiniciando $PM2_APP..."
    pm2 reload $PM2_APP --update-env
    sleep 10
}

# Verificar com retries
for i in $(seq 1 $MAX_RETRIES); do
    STATUS=$(check_health)

    if [ "$STATUS" = "200" ]; then
        echo "$LOG_PREFIX Health check OK (tentativa $i)"
        exit 0
    fi

    echo "$LOG_PREFIX Health check falhou com status $STATUS (tentativa $i/$MAX_RETRIES)"

    if [ $i -lt $MAX_RETRIES ]; then
        sleep $RETRY_DELAY
    fi
done

# Se chegou aqui, todas as tentativas falharam
echo "$LOG_PREFIX ERRO: Todas as tentativas falharam. Reiniciando..."
restart_pm2

# Verificar novamente apos restart
sleep 15
FINAL_STATUS=$(check_health)

if [ "$FINAL_STATUS" = "200" ]; then
    echo "$LOG_PREFIX Servico restaurado apos restart"
else
    echo "$LOG_PREFIX CRITICO: Servico ainda indisponivel apos restart (status: $FINAL_STATUS)"
    # Aqui poderia enviar alerta (email, Slack, etc)
fi
