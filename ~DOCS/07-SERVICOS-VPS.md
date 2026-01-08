# Servicos da VPS - Guia Completo

Documentacao de todos os servicos rodando na VPS BasyLab.

---

## Visao Geral dos Servicos

```
┌─────────────────────────────────────────────────────────────┐
│                          INTERNET                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   NGINX (Reverse Proxy)                      │
│                      Portas 80, 443                          │
├─────────────────────────────────────────────────────────────┤
│  3balug.basylab.com.br  │  api-3balug.basylab.com.br       │
│       (Frontend)         │        (Backend)                  │
│    /apps/3balug/current  │    upstream → :3003/:3004        │
└─────────────┬────────────┴──────────────┬───────────────────┘
              │                            │
              ▼                            ▼
┌─────────────────────────┐  ┌─────────────────────────────────┐
│   Arquivos Estaticos    │  │      PM2 (Process Manager)      │
│   (HTML, JS, CSS)       │  │   3balug-api (2 instancias)     │
│                         │  │      Portas 3001/3003/3004      │
└─────────────────────────┘  └──────────────┬──────────────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              ▼                             ▼                             ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│       PostgreSQL        │  │          Redis          │  │          MinIO          │
│        Porta 5432       │  │        Porta 6379       │  │   Portas 9000/9001      │
│   crm_imobil_prod       │  │     Cache/Sessions      │  │    Object Storage       │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

## 1. Nginx (Reverse Proxy)

### O que faz
- Recebe todas as requisicoes HTTP/HTTPS
- Redireciona HTTP para HTTPS
- Serve arquivos estaticos do frontend
- Faz proxy para o backend
- Gerencia certificados SSL

### Arquivos de Configuracao

```bash
/etc/nginx/
├── nginx.conf                    # Config principal
├── sites-available/              # Sites disponiveis
├── sites-enabled/                # Sites ativos (symlinks)
│   ├── 3balug.conf              # Frontend + API
│   ├── grafana.conf             # Grafana
│   └── minio.conf               # MinIO
├── snippets/                     # Configs reutilizaveis
│   ├── security-headers.conf
│   ├── api-security-headers.conf
│   └── timeouts.conf
└── ssl/                          # Certificados
```

### Comandos

```bash
# Testar configuracao
nginx -t

# Reload (sem downtime)
sudo systemctl reload nginx

# Restart (com downtime breve)
sudo systemctl restart nginx

# Ver status
sudo systemctl status nginx

# Ver logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Ver conexoes ativas
ss -tlnp | grep nginx
```

### Config do Frontend (3balug.basylab.com.br)

```nginx
server {
    listen 443 ssl http2;
    server_name 3balug.basylab.com.br;

    ssl_certificate /etc/letsencrypt/live/3balug.basylab.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/3balug.basylab.com.br/privkey.pem;

    root /apps/3balug/current;
    index index.html;

    # SPA - todas as rotas vao para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estaticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Config da API (api-3balug.basylab.com.br)

```nginx
# Upstream para balanceamento
upstream balug_api {
    server 127.0.0.1:3003;
    server 127.0.0.1:3004 backup;
}

server {
    listen 443 ssl http2;
    server_name api-3balug.basylab.com.br;

    ssl_certificate /etc/letsencrypt/live/3balug.basylab.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/3balug.basylab.com.br/privkey.pem;

    location / {
        proxy_pass http://balug_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 2. PM2 (Process Manager)

### O que faz
- Gerencia processos Node/Bun
- Mantem aplicacao rodando (auto-restart)
- Zero-downtime reload
- Logs centralizados
- Monitoramento de recursos

### Arquivo de Configuracao

```javascript
// /apps/3balug-api/current/ecosystem.config.cjs
module.exports = {
  apps: [{
    name: '3balug-api',
    script: './dist/server.js',
    interpreter: '/root/.bun/bin/bun',
    instances: 2,
    exec_mode: 'fork',
    listen_timeout: 3000,
    kill_timeout: 5000,
    autorestart: true,
    max_restarts: 10,
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    error_file: '/apps/3balug-api/shared/logs/error.log',
    out_file: '/apps/3balug-api/shared/logs/out.log',
  }]
};
```

### Comandos

```bash
# Ver todos os processos
pm2 list

# Ver detalhes de um processo
pm2 show 3balug-api

# Ver logs
pm2 logs                      # Todos
pm2 logs 3balug-api           # Especifico
pm2 logs 3balug-api --lines 100  # Ultimas 100 linhas

# Reload (zero-downtime)
pm2 reload 3balug-api

# Restart (com downtime)
pm2 restart 3balug-api

# Parar
pm2 stop 3balug-api

# Iniciar
pm2 start 3balug-api

# Deletar processo
pm2 delete 3balug-api

# Monitoramento em tempo real
pm2 monit

# Salvar configuracao atual
pm2 save

# Restaurar processos ao reiniciar servidor
pm2 startup
```

### Status dos Processos

```bash
pm2 list

# Exemplo de saida:
┌─────┬──────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┐
│ id  │ name         │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │
├─────┼──────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┤
│ 0   │ 3balug-api   │ default     │ 1.0.0   │ fork    │ 12345    │ 5D     │ 0    │ online    │ 0%       │
│ 1   │ 3balug-api   │ default     │ 1.0.0   │ fork    │ 12346    │ 5D     │ 0    │ online    │ 0%       │
└─────┴──────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┘
```

---

## 3. PostgreSQL

### O que faz
- Banco de dados relacional principal
- Armazena todos os dados da aplicacao

### Configuracao

| Item | Valor |
|------|-------|
| Versao | 16 |
| Porta | 5432 |
| Database | crm_imobil_prod |
| Usuario | crm_imobil_prod |

### Comandos

```bash
# Conectar
psql -U crm_imobil_prod -d crm_imobil_prod

# Listar databases
psql -U postgres -c "\l"

# Listar tabelas
psql -U crm_imobil_prod -d crm_imobil_prod -c "\dt"

# Backup
pg_dump -U crm_imobil_prod -d crm_imobil_prod > backup.sql

# Backup comprimido
pg_dump -U crm_imobil_prod -d crm_imobil_prod -F c > backup.dump

# Restore
psql -U crm_imobil_prod -d crm_imobil_prod < backup.sql

# Ver tamanho do banco
psql -U crm_imobil_prod -d crm_imobil_prod -c "SELECT pg_size_pretty(pg_database_size('crm_imobil_prod'));"

# Ver conexoes ativas
psql -U postgres -c "SELECT * FROM pg_stat_activity WHERE datname = 'crm_imobil_prod';"

# Status do servico
sudo systemctl status postgresql

# Restart
sudo systemctl restart postgresql

# Logs
tail -f /var/log/postgresql/postgresql-16-main.log
```

### Queries Uteis

```sql
-- Ver todas as tabelas com tamanho
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver usuarios
SELECT * FROM users LIMIT 10;

-- Contar registros por tabela
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts;
```

---

## 4. Redis

### O que faz
- Cache de dados
- Sessoes de usuario
- Rate limiting
- Filas (se necessario)

### Configuracao

| Item | Valor |
|------|-------|
| Versao | 7 |
| Porta | 6379 |
| Persistencia | AOF (append-only file) |

### Comandos

```bash
# Conectar
redis-cli

# Dentro do redis-cli:
PING                    # Deve retornar PONG
INFO                    # Informacoes do servidor
DBSIZE                  # Quantidade de chaves
KEYS *                  # Listar todas chaves (cuidado em prod!)
GET chave               # Ver valor de uma chave
DEL chave               # Deletar chave
FLUSHALL                # Limpar tudo (CUIDADO!)

# Fora do redis-cli:
redis-cli PING
redis-cli INFO
redis-cli DBSIZE

# Status do servico
sudo systemctl status redis

# Restart
sudo systemctl restart redis

# Logs
tail -f /var/log/redis/redis-server.log
```

---

## 5. MinIO (Object Storage)

### O que faz
- Armazena arquivos (fotos, documentos)
- Compativel com API S3 da AWS
- Interface web para gerenciamento

### URLs

| Servico | URL |
|---------|-----|
| API (S3) | https://s3.basylab.com.br |
| Console | https://minio.basylab.com.br |

### Buckets

| Bucket | Uso |
|--------|-----|
| 3balug | Arquivos do 3Balug (fotos, docs) |
| timearena | Arquivos do TimeArena |
| gradely | Arquivos do Gradely |
| dinefy | Arquivos do Dinefy |

### Comandos

```bash
# MinIO Client (mc)

# Configurar alias
mc alias set minio http://localhost:9000 minioadmin minioadmin123

# Listar buckets
mc ls minio

# Listar arquivos de um bucket
mc ls minio/3balug

# Upload de arquivo
mc cp arquivo.jpg minio/3balug/

# Download de arquivo
mc cp minio/3balug/arquivo.jpg ./

# Ver informacoes do bucket
mc stat minio/3balug

# Criar bucket
mc mb minio/novo-bucket

# Definir politica publica
mc anonymous set download minio/novo-bucket
```

### Acessar Console Web

1. Acesse https://minio.basylab.com.br
2. Usuario: `minioadmin`
3. Senha: `minioadmin123`

---

## 6. Certbot (SSL)

### O que faz
- Gerencia certificados SSL Let's Encrypt
- Renovacao automatica

### Certificados Ativos

```bash
certbot certificates

# Exemplo de saida:
Certificate Name: 3balug.basylab.com.br
    Domains: 3balug.basylab.com.br api-3balug.basylab.com.br
    Expiry Date: 2026-03-15
```

### Comandos

```bash
# Ver certificados
certbot certificates

# Renovar todos
certbot renew

# Renovar forcado
certbot renew --force-renewal

# Criar novo certificado
certbot --nginx -d novo-dominio.basylab.com.br

# Testar renovacao (dry-run)
certbot renew --dry-run

# Logs
tail -f /var/log/letsencrypt/letsencrypt.log
```

### Renovacao Automatica

O Certbot configura automaticamente um cron/timer para renovacao:

```bash
# Ver timer
systemctl list-timers | grep certbot

# Ou cron
cat /etc/cron.d/certbot
```

---

## 7. Grafana (Monitoramento)

### O que faz
- Dashboards de monitoramento
- Metricas do sistema
- Alertas

### URL

https://grafana.basylab.com.br

### Acesso

Protegido por autenticacao basica do Nginx:
- Usuario: (configurado em `/etc/nginx/auth/grafana.htpasswd`)
- Senha: (configurado em `/etc/nginx/auth/grafana.htpasswd`)

### Comandos

```bash
# Status
sudo systemctl status grafana-server

# Restart
sudo systemctl restart grafana-server

# Logs
tail -f /var/log/grafana/grafana.log
```

---

## Monitoramento Geral

### Ver uso de recursos

```bash
# CPU e Memoria
htop

# Disco
df -h

# Processos por memoria
ps aux --sort=-%mem | head -10

# Processos por CPU
ps aux --sort=-%cpu | head -10
```

### Health Checks

```bash
# API
curl https://api-3balug.basylab.com.br/health

# Frontend
curl -I https://3balug.basylab.com.br

# PostgreSQL
psql -U crm_imobil_prod -c "SELECT 1"

# Redis
redis-cli PING

# Nginx
nginx -t && echo "OK"
```

### Script de Health Check Completo

```bash
#!/bin/bash
# health-check.sh

echo "=== Health Check VPS BasyLab ==="
echo ""

# Nginx
echo -n "Nginx: "
if nginx -t 2>/dev/null; then echo "OK"; else echo "ERRO"; fi

# PostgreSQL
echo -n "PostgreSQL: "
if psql -U crm_imobil_prod -c "SELECT 1" > /dev/null 2>&1; then echo "OK"; else echo "ERRO"; fi

# Redis
echo -n "Redis: "
if redis-cli PING > /dev/null 2>&1; then echo "OK"; else echo "ERRO"; fi

# PM2
echo -n "PM2 (3balug-api): "
if pm2 show 3balug-api > /dev/null 2>&1; then echo "OK"; else echo "ERRO"; fi

# API
echo -n "API Health: "
if curl -s https://api-3balug.basylab.com.br/health | grep -q "ok"; then echo "OK"; else echo "ERRO"; fi

# Frontend
echo -n "Frontend: "
if curl -sI https://3balug.basylab.com.br | grep -q "200"; then echo "OK"; else echo "ERRO"; fi

echo ""
echo "=== Recursos ==="
echo "Disco: $(df -h / | awk 'NR==2 {print $5 " usado"}')"
echo "Memoria: $(free -h | awk 'NR==2 {print $3 "/" $2}')"
echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
```

---

## Troubleshooting Rapido

### Servico nao responde

```bash
# 1. Verificar se esta rodando
sudo systemctl status SERVICO

# 2. Ver logs
journalctl -u SERVICO -f

# 3. Tentar restart
sudo systemctl restart SERVICO
```

### Disco cheio

```bash
# Ver o que esta ocupando
du -sh /* | sort -h

# Limpar logs antigos
find /var/log -name "*.gz" -mtime +30 -delete

# Limpar releases antigas
cd /apps/3balug/releases && ls -t | tail -n +6 | xargs rm -rf
cd /apps/3balug-api/releases && ls -t | tail -n +6 | xargs rm -rf
```

### Memoria esgotada

```bash
# Ver processos por memoria
ps aux --sort=-%mem | head -10

# Limpar cache do sistema
sudo sync && sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'

# Restart de servicos que podem ter memory leak
pm2 restart all
```

---

**Proxima leitura:** [00-INDEX.md](00-INDEX.md)
