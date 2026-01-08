# Rollback - Guia de Emergencia

Guia para reverter deploys problematicos rapidamente.

---

## Tipos de Rollback

| Tipo | Tempo | Risco | Quando usar |
|------|-------|-------|-------------|
| **Release** | < 1 min | Baixo | Bug no codigo novo |
| **Banco** | 5-15 min | Alto | Migration com problema |
| **Completo** | 15-30 min | Alto | Desastre total |

---

## Rollback de Release (Mais Comum)

### Cenario
Deploy foi feito, mas a nova versao tem bugs.

### Tempo estimado: < 1 minuto

### Passo a Passo

```bash
# 1. Conectar na VPS
ssh vps-basylab-public

# 2. Navegar para o projeto
cd /apps/3balug-api    # Backend
# ou
cd /apps/3balug        # Frontend

# 3. Ver releases disponiveis
ls -la releases/

# Exemplo de saida:
# drwxr-xr-x 20260108_143000  <- Release atual (com bug)
# drwxr-xr-x 20260107_120000  <- Release anterior (estavel)
# drwxr-xr-x 20260106_090000  <- Release mais antiga

# 4. Verificar qual e a release atual
ls -la current
# current -> releases/20260108_143000

# 5. Fazer rollback para release anterior
ln -sfn releases/20260107_120000 current

# 6. Verificar mudanca
ls -la current
# current -> releases/20260107_120000

# 7. Reload da aplicacao (backend)
pm2 reload 3balug-api

# 8. Verificar logs
pm2 logs 3balug-api --lines 20
```

### Script de Rollback Rapido

```bash
#!/bin/bash
# rollback.sh - Rollback rapido

PROJECT=$1  # 3balug-api ou 3balug

if [ -z "$PROJECT" ]; then
    echo "Uso: ./rollback.sh [3balug-api|3balug]"
    exit 1
fi

ssh vps-basylab-public << EOF
    cd /apps/$PROJECT
    
    # Pegar release anterior
    CURRENT=\$(readlink current | xargs basename)
    PREVIOUS=\$(ls -t releases | grep -v \$CURRENT | head -1)
    
    echo "Release atual: \$CURRENT"
    echo "Rollback para: \$PREVIOUS"
    
    # Fazer rollback
    ln -sfn releases/\$PREVIOUS current
    
    # Reload se for backend
    if [ "$PROJECT" = "3balug-api" ]; then
        pm2 reload 3balug-api
    fi
    
    echo "Rollback concluido!"
    ls -la current
EOF
```

---

## Rollback de Banco (Migrations)

### Cenario
Migration foi aplicada e quebrou algo no banco.

### Tempo estimado: 5-15 minutos

### IMPORTANTE: Sempre faca backup ANTES de migrations!

### Passo a Passo

```bash
# 1. Conectar na VPS
ssh vps-basylab-public

# 2. Verificar backups disponiveis
ls -la /tmp/backup_*.sql
ls -la /var/backups/postgres/

# 3. Parar a aplicacao (evitar escrita durante restore)
pm2 stop 3balug-api

# 4. Restaurar backup
psql -U crm_imobil_prod -d crm_imobil_prod < /tmp/backup_20260108_120000.sql

# Se der erro de conexoes ativas:
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'crm_imobil_prod' AND pid <> pg_backend_pid();"

# Tentar novamente
psql -U crm_imobil_prod -d crm_imobil_prod < /tmp/backup_20260108_120000.sql

# 5. Fazer rollback da release tambem
cd /apps/3balug-api
PREVIOUS=$(ls -t releases | head -2 | tail -1)
ln -sfn releases/$PREVIOUS current

# 6. Reiniciar aplicacao
pm2 start 3balug-api

# 7. Verificar
pm2 logs 3balug-api --lines 30
```

### Como fazer backup antes de migrations

```bash
# Na VPS, ANTES de aplicar migration
pg_dump -U crm_imobil_prod -d crm_imobil_prod -F c -f /tmp/backup_$(date +%Y%m%d_%H%M%S).dump

# Ou em SQL puro (mais lento mas mais compativel)
pg_dump -U crm_imobil_prod -d crm_imobil_prod > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Rollback Completo (Desastre)

### Cenario
Tudo esta quebrado, precisa voltar para estado anterior completo.

### Tempo estimado: 15-30 minutos

### Passo a Passo

```bash
# 1. Conectar na VPS
ssh vps-basylab-public

# 2. Parar tudo
pm2 stop all

# 3. Identificar ultimas releases estaveis
ls -la /apps/3balug-api/releases/
ls -la /apps/3balug/releases/

# 4. Rollback do backend
cd /apps/3balug-api
ln -sfn releases/RELEASE_ESTAVEL current

# 5. Rollback do frontend
cd /apps/3balug
ln -sfn releases/RELEASE_ESTAVEL current

# 6. Restaurar banco (se necessario)
psql -U crm_imobil_prod -d crm_imobil_prod < /tmp/backup_ESTAVEL.sql

# 7. Reiniciar tudo
pm2 start all

# 8. Verificar nginx
nginx -t
systemctl reload nginx

# 9. Testar
curl https://api-3balug.basylab.com.br/health
curl -I https://3balug.basylab.com.br
```

---

## Comandos Uteis Durante Rollback

### Ver logs em tempo real

```bash
# Logs da aplicacao
pm2 logs 3balug-api

# Logs do nginx
tail -f /var/log/nginx/error.log

# Logs do sistema
journalctl -f
```

### Verificar saude dos servicos

```bash
# PM2
pm2 list
pm2 monit

# Nginx
systemctl status nginx
nginx -t

# PostgreSQL
systemctl status postgresql
psql -U crm_imobil_prod -c "SELECT 1"

# Disco
df -h

# Memoria
free -h
```

### Recriar processos PM2

```bash
# Se PM2 estiver muito bugado
pm2 delete all
pm2 start /apps/3balug-api/current/ecosystem.config.cjs --env production
```

---

## Prevencao de Problemas

### 1. Sempre faca backup antes de migrations

```bash
# Adicione isso ao seu script de deploy
ssh vps-basylab-public "pg_dump -U crm_imobil_prod -d crm_imobil_prod > /tmp/backup_\$(date +%Y%m%d_%H%M%S).sql"
```

### 2. Mantenha pelo menos 5 releases

```bash
# Nao apague releases muito rapido
ls -t releases | tail -n +6 | xargs rm -rf  # Mantem 5
```

### 3. Teste em homologacao primeiro

Sempre faca deploy em homolog antes de producao.

### 4. Deploy em horarios de baixo trafego

Evite deploy em horarios de pico.

### 5. Tenha um plano de comunicacao

- Avise a equipe antes do deploy
- Tenha canal de comunicacao rapido (Slack, WhatsApp)
- Documente o que foi feito

---

## Checklist de Rollback

### Antes de comecar
- [ ] Identificar o problema
- [ ] Comunicar equipe
- [ ] Identificar release estavel

### Durante rollback
- [ ] Fazer rollback de release
- [ ] Restaurar banco (se necessario)
- [ ] Reload/restart servicos

### Depois do rollback
- [ ] Verificar logs
- [ ] Testar funcionalidades
- [ ] Comunicar que esta estavel
- [ ] Documentar o que aconteceu
- [ ] Investigar causa raiz

---

## Contatos de Emergencia

| Situacao | Acao |
|----------|------|
| Bug simples | Rollback de release |
| Banco corrompido | Rollback de banco + release |
| VPS inacessivel | Contato com provedor (Contabo) |
| Certificado SSL | `certbot renew && systemctl reload nginx` |

---

**Proxima leitura:** [04-HOMOLOGACAO.md](04-HOMOLOGACAO.md)
