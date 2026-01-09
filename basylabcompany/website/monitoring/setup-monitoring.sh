#!/bin/bash
# setup-monitoring.sh - Configura monitoramento do basylab-site na VPS
#
# Este script deve ser executado na VPS para configurar:
# 1. PM2 Prometheus Exporter (metricas do PM2)
# 2. Adicionar target ao Prometheus
# 3. Importar dashboard no Grafana
#
# Executar: ssh vps-basylab "bash -s" < monitoring/setup-monitoring.sh

set -e

echo "=== Configurando Monitoramento do Basylab Site ==="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# =============================================
# 1. Instalar PM2 Prometheus Exporter
# =============================================
echo -e "${GREEN}[1/4] Instalando PM2 Prometheus Exporter...${NC}"

# Verificar se ja esta instalado
if pm2 list | grep -q "pm2-prometheus-exporter"; then
    echo "PM2 Prometheus Exporter ja esta rodando"
else
    # Instalar o modulo
    pm2 install pm2-prometheus-exporter

    # Configurar porta (padrao 9209)
    pm2 set pm2-prometheus-exporter:port 9209

    echo "PM2 Prometheus Exporter instalado na porta 9209"
fi

# =============================================
# 2. Configurar Prometheus
# =============================================
echo -e "${GREEN}[2/4] Configurando Prometheus...${NC}"

# Verificar se Prometheus esta instalado
if command -v prometheus &> /dev/null || [ -f /etc/prometheus/prometheus.yml ]; then
    # Criar arquivo de targets
    sudo mkdir -p /etc/prometheus/targets

    cat << 'EOF' | sudo tee /etc/prometheus/targets/basylab-site.yml
- targets:
    - 'localhost:9209'
  labels:
    job: 'pm2'
    app: 'basylab-site'
    env: 'production'
EOF

    # Verificar se o job ja existe no prometheus.yml
    if ! grep -q "basylab-site.yml" /etc/prometheus/prometheus.yml; then
        echo ""
        echo -e "${YELLOW}ATENCAO: Adicione o seguinte ao /etc/prometheus/prometheus.yml:${NC}"
        echo ""
        echo "scrape_configs:"
        echo "  - job_name: 'pm2-basylab'"
        echo "    file_sd_configs:"
        echo "      - files:"
        echo "          - '/etc/prometheus/targets/basylab-site.yml'"
        echo ""
    fi

    # Recarregar Prometheus
    if systemctl is-active --quiet prometheus; then
        sudo systemctl reload prometheus
        echo "Prometheus recarregado"
    fi
else
    echo -e "${YELLOW}Prometheus nao encontrado. Instalando...${NC}"

    # Instalar Prometheus
    sudo apt-get update
    sudo apt-get install -y prometheus

    # Adicionar job ao prometheus.yml
    sudo cat << 'EOF' >> /etc/prometheus/prometheus.yml

  - job_name: 'pm2-basylab'
    static_configs:
      - targets: ['localhost:9209']
        labels:
          app: 'basylab-site'
          env: 'production'
EOF

    sudo systemctl enable prometheus
    sudo systemctl start prometheus
fi

# =============================================
# 3. Criar pastas e copiar arquivos
# =============================================
echo -e "${GREEN}[3/4] Configurando scripts de monitoramento...${NC}"

mkdir -p /apps/basylab-site/scripts
mkdir -p /apps/basylab-site/shared/error-pages
mkdir -p /apps/basylab-site/shared/logs

# =============================================
# 4. Configurar Crontab para warm-up
# =============================================
echo -e "${GREEN}[4/4] Configurando cron jobs...${NC}"

# Verificar se cron jobs ja existem
CRON_EXISTS=$(crontab -l 2>/dev/null | grep -c "basylab-site" || true)

if [ "$CRON_EXISTS" -eq 0 ]; then
    # Adicionar cron jobs
    (crontab -l 2>/dev/null || true; echo "# Basylab Site - Warmup (a cada 3 minutos)") | crontab -
    (crontab -l 2>/dev/null; echo "*/3 * * * * /apps/basylab-site/scripts/warmup.sh >> /apps/basylab-site/shared/logs/warmup.log 2>&1") | crontab -
    (crontab -l 2>/dev/null; echo "") | crontab -
    (crontab -l 2>/dev/null; echo "# Basylab Site - Health Check (a cada 5 minutos)") | crontab -
    (crontab -l 2>/dev/null; echo "*/5 * * * * /apps/basylab-site/scripts/health-check.sh >> /apps/basylab-site/shared/logs/health-check.log 2>&1") | crontab -

    echo "Cron jobs adicionados"
else
    echo "Cron jobs ja configurados"
fi

# =============================================
# Verificacao Final
# =============================================
echo ""
echo "=== Verificacao ==="
echo ""

# PM2 Prometheus Exporter
echo -n "PM2 Prometheus Exporter: "
if curl -s http://localhost:9209/metrics > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}Verificar (porta 9209)${NC}"
fi

# Prometheus
echo -n "Prometheus: "
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}Verificar${NC}"
fi

# Cron
echo -n "Cron jobs: "
if crontab -l 2>/dev/null | grep -q "basylab-site"; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}Verificar${NC}"
fi

echo ""
echo "=== Setup Concluido ==="
echo ""
echo "Proximos passos:"
echo "1. Importar o dashboard no Grafana: monitoring/grafana-dashboard.json"
echo "2. Verificar metricas em: https://grafana.basylab.com.br"
echo "3. Testar endpoint: curl http://localhost:9209/metrics"
