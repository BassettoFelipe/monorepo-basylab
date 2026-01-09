# Basylab - Landing Page

Site institucional da Basylab, empresa de desenvolvimento de software sob medida.

**URL:** https://basylab.com.br

## Stack

- **Framework:** Next.js 16 (App Router)
- **Runtime:** Bun
- **Styling:** CSS Modules + Tailwind CSS
- **Linting:** Biome
- **Deploy:** VPS (Contabo) com Nginx + PM2

## Desenvolvimento

```bash
# Instalar dependencias
bun install

# Rodar em desenvolvimento
bun dev

# Build de producao
bun run build

# Preview do build
bun start
```

## Deploy

O deploy e feito via script automatizado para a VPS:

```bash
# Deploy normal (com confirmacao)
./deploy.sh

# Deploy rapido (sem confirmacao)
./deploy.sh --quick

# Primeiro deploy (configura cron jobs e monitoramento)
./deploy.sh --setup
```

O script:
1. Faz build do projeto (Next.js standalone)
2. Envia arquivos para a VPS via rsync
3. Envia scripts de health check e warm-up
4. Atualiza symlink e reinicia PM2
5. Verifica health check e status

## Estrutura

```
src/
├── app/                    # Rotas (App Router)
│   ├── page.tsx           # Home
│   ├── health/            # Health check endpoint
│   ├── privacidade/       # Politica de privacidade
│   ├── termos/            # Termos de uso
│   ├── sitemap.ts         # Sitemap dinamico
│   └── layout.tsx         # Layout root
├── components/            # Componentes reutilizaveis
├── sections/              # Secoes da landing page
└── styles/                # Estilos globais e tokens

scripts/
├── warmup.sh              # Warm-up para evitar cold start
├── health-check.sh        # Verificacao automatica de saude
└── 50x.html               # Pagina de erro customizada

monitoring/
├── grafana-dashboard.json # Dashboard para Grafana
├── prometheus-targets.yml # Targets para Prometheus
└── setup-monitoring.sh    # Script de setup do monitoramento
```

## SEO

- Sitemap dinamico em `/sitemap.xml`
- JSON-LD Schema (Organization, ProfessionalService, FAQ)
- Open Graph e Twitter Cards
- robots.txt configurado

## Monitoramento

O site possui monitoramento integrado:

- **Health Check:** `/health` - Retorna status, uptime e uso de memoria
- **Warm-up:** Cron job a cada 3 minutos para evitar cold start
- **Auto-recovery:** Health check a cada 5 minutos com restart automatico
- **Grafana:** Dashboard em https://grafana.basylab.com.br

### Configurar monitoramento na VPS

```bash
# Na primeira vez, execute:
./deploy.sh --setup

# Ou manualmente:
ssh vps-basylab "bash -s" < monitoring/setup-monitoring.sh
```

## Configuracao da VPS

Arquivos de configuracao:

- `nginx.conf` - Configuracao do Nginx (reverse proxy)
- `ecosystem.config.cjs` - Configuracao do PM2

### Timeouts e Performance

O Nginx esta configurado com:
- Timeouts de 120s para acomodar cold start do Next.js
- Retry automatico em caso de erro 502/503/504
- Keepalive de 64 conexoes

O PM2 esta configurado com:
- Limite de memoria de 512MB
- Min uptime de 30s (evita restart em loop)
- Listen timeout de 15s para cold start

## Licenca

Codigo proprietario - Basylab Softwares.
