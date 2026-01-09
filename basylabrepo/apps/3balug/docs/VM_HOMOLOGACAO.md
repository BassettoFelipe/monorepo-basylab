# VM de Homologacao - BasyLab

Documentacao completa da VM de homologacao configurada do zero.

---

## Informacoes Gerais

| Item | Valor |
|------|-------|
| **IP** | 46.202.150.28 |
| **IP Tailscale** | 100.90.132.66 |
| **Sistema Operacional** | Ubuntu 24.04.3 LTS (Noble Numbat) |
| **Kernel** | 6.8.0-90-generic |
| **Ambiente** | Homologacao (comportamento identico a producao) |
| **Data de Configuracao** | 15/12/2025 |
| **Ultima Atualizacao** | 31/12/2025 |

---

## Indice

1. [Problemas Conhecidos e Solucoes](#problemas-conhecidos-e-solucoes)
2. [Acesso SSH](#acesso-ssh)
3. [Stack Instalada](#stack-instalada)
4. [Infraestrutura Docker](#infraestrutura-docker)
5. [Observabilidade](#observabilidade)
6. [Projetos Ativos](#projetos-ativos)
7. [Guias de Deploy por Projeto](#guias-de-deploy-por-projeto)
8. [Comandos Gerais](#comandos-gerais)
9. [Troubleshooting](#troubleshooting)
10. [Historico de Alteracoes](#historico-de-alteracoes)

---

# Parte 0: Problemas Conhecidos

---

## Problemas Conhecidos e Solucoes

### Analise de 31/12/2025

Esta secao documenta problemas recorrentes identificados nos deploys e suas solucoes.

### Problema 1: Erros 500 - Tabelas Inexistentes

**Sintoma:**
```
PostgresError: relation "properties" does not exist
PostgresError: relation "property_owners" does not exist
```

**Causa:** 
Schema do Drizzle foi alterado (novas tabelas adicionadas) mas migrations NAO foram geradas.

**Solucao:**
```bash
# 1. No Mac, gerar migrations
cd ~/Documents/www/bassetto/3balug/backend
bun run db:generate

# 2. Commitar os novos arquivos em drizzle/

# 3. Fazer deploy do backend

# 4. Na VM, aplicar migrations
ssh deploy@46.202.150.28
cd /apps/3balug-api/current
DATABASE_URL='postgresql://balug_user:balug_secure_pwd_2024@127.0.0.1:5432/3balug' \
  bun run db:migrate
```

**Prevencao:**
- SEMPRE gerar migrations antes do deploy quando houver alteracoes no schema
- Verificar: `bun run db:generate --dry-run`

---

### Problema 2: Conflito de Rotas Elysia

**Sintoma:**
```
error: Cannot create route "/api/properties/:propertyId/photos/:photoId" 
with parameter "propertyId" because a route already exists with a 
different parameter name ("id") in the same location
```

**Causa:**
Elysia/memoirist nao permite parametros com nomes diferentes na mesma posicao da URL.

**Solucao:**
Padronizar TODOS os parametros de rota:
```typescript
// ERRADO - Conflito
.get("/properties/:propertyId", ...)
.get("/properties/:id/photos", ...)

// CORRETO - Padronizado
.get("/properties/:id", ...)
.get("/properties/:id/photos", ...)
```

**Prevencao:**
- Usar sempre `:id` para o primeiro parametro
- Usar nomes especificos apenas para parametros aninhados (`:photoId`)

---

### Problema 3: Dependencias Nativas (Sharp)

**Sintoma:**
```
error: Could not load the "sharp" module using the linux-x64 runtime
```

**Causa:**
Bundle criado no Mac contem binarios compilados para macOS, nao Linux.

**Solucao:**
```bash
# Na VM, reinstalar dependencias
cd /apps/3balug-api/current
sudo -u balug bun install --production --force
sudo systemctl restart 3balug-api-blue
```

**Prevencao:**
- NUNCA incluir node_modules no bundle
- SEMPRE rodar `bun install` na VM apos deploy

---

### Problema 4: Migrations com Credenciais Erradas

**Sintoma:**
```
password authentication failed for user "crm_imobil"
```

**Causa:**
`drizzle.config.ts` tem fallback para credenciais de desenvolvimento.

**Solucao:**
```bash
# Passar DATABASE_URL explicitamente
DATABASE_URL='postgresql://balug_user:balug_secure_pwd_2024@127.0.0.1:5432/3balug' \
  bun run db:migrate
```

---

### Problema 5: Tailscale Inativo

**Sintoma:**
```
ssh: connect to host 100.90.132.66 port 22: Operation timed out
```

**Causa:**
Tailscale pode nao estar ativo no Mac ou na VM.

**Solucao:**
```bash
# No Mac
sudo tailscale up

# Na VM
sudo tailscale status
sudo systemctl restart tailscaled
```

**Alternativa:**
Usar IP publico: `ssh deploy@46.202.150.28`

---

### Checklist Pre-Deploy (OBRIGATORIO)

Antes de qualquer deploy, verificar:

- [ ] Migrations geradas para todas as alteracoes de schema
- [ ] Typecheck passa: `bun run typecheck`
- [ ] Lint passa: `bun run lint`
- [ ] Nao ha conflitos de rotas (parametros padronizados)
- [ ] `.env.production` do frontend aponta para dominio HTTPS
- [ ] VM acessivel via SSH

---

# Parte 1: Configuracao da VM

---

## Acesso SSH

### Conexao

**Via IP Publico (Recomendado - Sempre funciona):**
```bash
ssh deploy@46.202.150.28
```

**Via Tailscale (Se estiver ativo):**
```bash
ssh deploy@100.90.132.66
# ou use o alias:
ssh vps-basylab
```

### Detalhes de Acesso

| Item | Valor |
|------|-------|
| **Usuario** | deploy |
| **IP Publico** | 46.202.150.28 |
| **IP Tailscale** | 100.90.132.66 (fixo, se ativo) |
| **Porta** | 22 |
| **Chave SSH (no Mac)** | ~/.ssh/id_ed25519 |
| **Login por senha** | Desabilitado |
| **Login root** | Desabilitado |

### Tailscale (VPN Mesh)

**Status:** Instalado (pode estar inativo)

**Beneficios:**
- IP fixo (100.90.132.66) que nunca muda
- Nunca bloqueado pelo fail2ban
- Conexao direta (peer-to-peer) - mais rapida
- Gratuito para uso pessoal

**Ativar no Mac:**
```bash
sudo tailscale up
```

**Verificar status:**
```bash
tailscale status  # no Mac
```

**Na VPS:**
```bash
sudo tailscale status
sudo tailscale ip -4  # Ver IP Tailscale
```

### Seguranca

- Autenticacao apenas por chave SSH
- fail2ban ativo (10 tentativas = ban por 1 hora)
- Whitelist: Tailscale (100.64.0.0/10)
- Firewall UFW ativo (22/80/443 globais)
- Systemd hardening aplicado nas APIs (NoNewPrivileges, ProtectSystem, MemoryMax=1G, CPUQuota=80%)
- Security headers no Nginx (HSTS, X-Frame-Options, CSP, etc)

---

## Usuarios do Sistema

| Usuario | Funcao | Home | Shell |
|---------|--------|------|-------|
| deploy | Administracao geral | /home/deploy | /bin/bash |
| balug | Execucao API 3Balug | /apps/3balug-api | /usr/sbin/nologin |

---

## Stack Instalada

| Software | Versao | Funcao |
|----------|--------|--------|
| **Bun** | 1.3.4 | Runtime de aplicacoes |
| **Docker** | 29.1.3 | Containers de infraestrutura |
| **Docker Compose** | v5.0.0 | Orquestracao de containers |
| **Nginx** | 1.24.0 | Reverse proxy + TLS |
| **Certbot** | 2.9.0 | Certificados Let's Encrypt |
| **fail2ban** | - | Protecao contra brute-force |
| **UFW** | - | Firewall |

---

## Estrutura de Pastas

```
/apps/
├── 3balug/                    # Frontend 3Balug
│   ├── releases/
│   ├── current -> releases/X
│   └── shared/
│
└── 3balug-api/                # Backend 3Balug
    ├── releases/
    ├── current -> releases/X
    └── shared/
        └── .env

/infra/
├── backups/
│   └── postgres/              # Dumps diarios
├── docker-compose.yml         # Postgres + Redis + MinIO
├── init-databases.sql
├── .env
└── observability/             # Grafana, Prometheus, Loki
    ├── docker-compose.yml
    ├── grafana/
    ├── loki/
    └── prometheus/
```

---

## Infraestrutura Docker

### Containers Ativos

| Container | Imagem | Funcao | Status |
|-----------|--------|--------|--------|
| infra-postgres | postgres:16-alpine | Banco de dados | healthy |
| infra-redis | redis:7-alpine | Cache/Sessions | healthy |
| infra-minio | minio/minio | Object Storage | healthy |

### Observabilidade

| Container | Funcao |
|-----------|--------|
| observability-prometheus | Metricas |
| observability-grafana | Dashboards |
| observability-loki | Logs |
| observability-promtail | Coletor de logs |
| observability-node-exporter | Metricas do host |
| observability-postgres-exporter | Metricas Postgres |
| observability-redis-exporter | Metricas Redis |
| observability-nginx-exporter | Metricas Nginx |
| observability-alertmanager | Alertas |

### Databases

| Database | Usuario | Projeto |
|----------|---------|---------|
| 3balug | balug_user | 3Balug |

### Gerenciamento

```bash
# Ver status
cd /infra && docker compose ps

# Ver containers
docker ps --format 'table {{.Names}}\t{{.Status}}'

# Reiniciar
cd /infra && docker compose restart

# Logs
docker logs infra-postgres
docker logs infra-redis
```

---

## Observabilidade

Stack de observabilidade local:

- **Grafana**: https://grafana.basylab.com.br
- **Prometheus**: metricas (localhost:9090)
- **Loki + Promtail**: logs

### Retencao

- Prometheus: 14 dias
- Loki: 14 dias
- journald: 7 dias

### Logs Coletados

- Journald (systemd)
- Nginx (access/error)
- auth.log
- ufw.log

---

## Backups

Backups do Postgres sao feitos via systemd timer.

- Script: `/usr/local/bin/pg-backup.sh`
- Timer: `pg-backup.timer` (diario 02:30)
- Destino: `/infra/backups/postgres`
- Retencao: 7 dias
- Formato: `pg_dump -Fc`

---

## Dominios Autorizados

| Dominio | Funcao |
|---------|--------|
| 3balug.basylab.com.br | Frontend |
| api-3balug.basylab.com.br | API |
| grafana.basylab.com.br | Observabilidade |

Qualquer outro dominio retorna **444** (conexao fechada).

---

## Certificados SSL

| Item | Valor |
|------|-------|
| Provedor | Let's Encrypt |
| Validade | 90 dias (renovacao automatica) |
| Tipo | ECDSA |

### Renovacao

```bash
# Testar renovacao
sudo certbot renew --dry-run

# Renovacao manual
sudo certbot renew
```

---

# Parte 2: Projetos Ativos

---

## Projetos Ativos

### 3Balug

| Componente | Dominio | Porta |
|------------|---------|-------|
| Frontend | https://3balug.basylab.com.br | - |
| API Blue | https://api-3balug.basylab.com.br | 3003 |
| API Green | (backup) | 3004 |

**Estado do Banco (31/12/2025):**

Tabelas existentes:
- companies
- users
- plans
- subscriptions
- pending_payments
- custom_fields
- custom_field_responses

Tabelas pendentes (migrations nao aplicadas):
- properties
- property_owners
- property_photos
- tenants
- contracts

---

# Parte 3: Guias de Deploy

---

## Deploy 3Balug

**IMPORTANTE: Consulte o arquivo `DEPLOY.md` para o guia completo.**

### Resumo Rapido

#### Backend

```bash
# 1. Local - Preparar bundle
cd ~/Documents/www/bassetto/3balug/backend
RELEASE=$(date +%Y%m%d%H%M%S)
tar -czf /tmp/bundle-api-$RELEASE.tar.gz src/ package.json bun.lock tsconfig.json drizzle/ drizzle.config.ts

# 2. Enviar
scp /tmp/bundle-api-$RELEASE.tar.gz deploy@46.202.150.28:/tmp/

# 3. Na VM
ssh deploy@46.202.150.28
RELEASE=<TIMESTAMP>
sudo mkdir -p /apps/3balug-api/releases/$RELEASE
sudo tar -xzf /tmp/bundle-api-*.tar.gz -C /apps/3balug-api/releases/$RELEASE
sudo ln -sf /apps/3balug-api/shared/.env /apps/3balug-api/releases/$RELEASE/.env
sudo chown -R balug:balug /apps/3balug-api/releases/$RELEASE
sudo -u balug -- bash -lc "cd /apps/3balug-api/releases/$RELEASE && bun install --production --frozen-lockfile"
sudo rm -f /apps/3balug-api/current
sudo ln -sf /apps/3balug-api/releases/$RELEASE /apps/3balug-api/current
sudo systemctl restart 3balug-api-blue
```

#### Frontend

```bash
# 1. Local - Build e bundle
cd ~/Documents/www/bassetto/3balug/client
bun run build
RELEASE=$(date +%Y%m%d%H%M%S)
tar -czf /tmp/bundle-front-$RELEASE.tar.gz -C dist .

# 2. Enviar
scp /tmp/bundle-front-$RELEASE.tar.gz deploy@46.202.150.28:/tmp/

# 3. Na VM
ssh deploy@46.202.150.28
RELEASE=<TIMESTAMP>
sudo mkdir -p /apps/3balug/releases/$RELEASE
sudo tar -xzf /tmp/bundle-front-*.tar.gz -C /apps/3balug/releases/$RELEASE
sudo chown -R www-data:www-data /apps/3balug/releases/$RELEASE
sudo rm -f /apps/3balug/current
sudo ln -sf /apps/3balug/releases/$RELEASE /apps/3balug/current
```

### Migrations

```bash
# Gerar (local)
cd ~/Documents/www/bassetto/3balug/backend
bun run db:generate

# Aplicar (VM)
ssh deploy@46.202.150.28
cd /apps/3balug-api/current
DATABASE_URL='postgresql://balug_user:balug_secure_pwd_2024@127.0.0.1:5432/3balug' \
  bun run db:migrate
```

### Variaveis de Ambiente

**Localizacao:** `/apps/3balug-api/shared/.env`

Variaveis criticas:
```env
NODE_ENV=production
DATABASE_URL=postgresql://balug_user:balug_secure_pwd_2024@127.0.0.1:5432/3balug
REDIS_URL=redis://:redis_secure_pwd_2024@127.0.0.1:6379
FRONTEND_URL=https://3balug.basylab.com.br
API_URL=https://api-3balug.basylab.com.br
CORS_ALLOWED_ORIGINS=https://3balug.basylab.com.br
```

### Rollback

```bash
# Ver releases disponiveis
ls -lt /apps/3balug-api/releases/

# Rollback
sudo rollback api 3balug
sudo rollback frontend 3balug
```

---

# Parte 4: Comandos Gerais

---

## Services systemd

### APIs Ativas

| Service | Projeto | Porta | Status |
|---------|---------|-------|--------|
| 3balug-api-blue | 3Balug | 3003 | active |
| 3balug-api-green | 3Balug | 3004 | inactive |

### Comandos Uteis

```bash
# Status
sudo systemctl status 3balug-api-blue

# Reiniciar
sudo systemctl restart 3balug-api-blue

# Ver logs
sudo journalctl -u 3balug-api-blue -f

# Ultimos 50 logs
sudo journalctl -u 3balug-api-blue -n 50

# Apenas erros
sudo journalctl -u 3balug-api-blue | grep -i error
```

---

## Logs do Sistema

```bash
# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# fail2ban
sudo tail -f /var/log/fail2ban.log
```

---

## Configuracao Nginx

### Arquivos

```
/etc/nginx/sites-available/
├── default                        # Rejeita dominios nao autorizados
├── api-3balug.basylab.com.br
└── 3balug.basylab.com.br
```

### Comandos

```bash
# Testar configuracao
sudo nginx -t

# Recarregar
sudo systemctl reload nginx
```

### Caracteristicas

- HTTP redireciona para HTTPS
- WebSocket suportado
- Blue/Green upstream com backup
- Cache de assets estaticos (1 ano)
- Security headers via snippets

---

## Recursos

```bash
# Disco
df -h /

# Memoria
free -h

# Espaco por projeto
du -sh /apps/*
```

---

# Parte 5: Troubleshooting

---

## Troubleshooting Rapido

### API nao inicia

```bash
# Ver logs
sudo journalctl -u 3balug-api-blue -n 50

# Verificar current
ls -la /apps/3balug-api/current

# Verificar permissoes
ls -la /apps/3balug-api/
```

### 502 Bad Gateway

```bash
# API rodando?
sudo systemctl status 3balug-api-blue

# Porta em uso?
sudo ss -tlnp | grep 3003

# Reiniciar
sudo systemctl restart 3balug-api-blue
```

### Tabelas nao existem

```bash
# Verificar tabelas
docker exec infra-postgres psql -U balug_user -d 3balug -c '\dt'

# Aplicar migrations
cd /apps/3balug-api/current
DATABASE_URL='postgresql://balug_user:balug_secure_pwd_2024@127.0.0.1:5432/3balug' \
  bun run db:migrate
```

### Container nao inicia

```bash
# Ver logs
cd /infra && docker compose logs postgres

# Recriar
cd /infra && docker compose down && docker compose up -d
```

---

## Checklist de Validacao

- [x] Acesso SSH via chave funcionando
- [x] Login por senha desabilitado
- [x] Login root desabilitado
- [x] Firewall ativo (22, 80, 443)
- [x] fail2ban ativo
- [x] Bun instalado (v1.3.4)
- [x] Docker instalado (v29.1.3)
- [x] Docker Compose instalado (v5.0.0)
- [x] Nginx instalado (v1.24.0)
- [x] Certbot instalado (v2.9.0)
- [x] Postgres rodando (healthy)
- [x] Redis rodando (healthy)
- [x] MinIO rodando (healthy)
- [x] Prometheus rodando (healthy)
- [x] Grafana rodando (healthy)
- [x] Loki rodando (healthy)
- [x] Estrutura de pastas criada
- [x] Services systemd criados
- [x] Certificados SSL emitidos
- [x] HTTPS funcionando em todos os dominios
- [x] Scripts de deploy criados
- [x] Script de rollback criado

---

# Parte 6: Historico

---

## Historico de Alteracoes

### 31/12/2025 - Analise Completa e Documentacao

**Problemas Identificados:**
- Erros 500 causados por tabelas inexistentes (properties, property_owners, tenants, contracts, property_photos)
- Migrations nao geradas para novas tabelas do schema
- Conflito de rotas Elysia (parametros `:id` vs `:propertyId`)
- Falta de validacao pre-deploy

**Acoes:**
- Documentacao atualizada com secao de problemas conhecidos
- Checklist pre-deploy adicionado
- Guia de troubleshooting expandido
- Correcao de conflito de rotas no codigo

**Pendente:**
- Gerar migrations para tabelas: properties, property_owners, property_photos, tenants, contracts
- Aplicar migrations na VM

### 30/12/2025 - Ajustes de Deploy e Logs

- Bundle do backend sem `node_modules` (instalacao na VM com Bun)
- Instrucoes de migracao alinhadas ao schema `drizzle`

### 20/12/2025 - Hardening de Seguranca e Tailscale

**Hardening Aplicado:**
- Systemd hardening nos servicos 3balug
- Security headers no Nginx
- Fail2ban configurado com whitelist
- Kernel atualizado: 6.8.0-88 -> 6.8.0-90-generic

**Tailscale Configurado:**
- Instalado e ativo na VPS (IP: 100.90.132.66)
- IP fixo que nunca muda

### 20/12/2025 - Observabilidade e Limpeza

- Stack de observabilidade consolidada
- Dashboards atualizados
- Limpeza de releases antigas

### 18/12/2025 - Remocao Completa do Dinefy

- Servicos, database, diretorios e configs removidos
- VM dedicada exclusivamente ao 3Balug

---

## Contatos e Suporte

- **Documentacao criada em:** 15/12/2025
- **Ultima atualizacao:** 31/12/2025
- **VM provisionada por:** Claude Code

---

*Esta VM e espelho fiel do ambiente de producao. Servicos terceiros devem usar endpoints SANDBOX.*
