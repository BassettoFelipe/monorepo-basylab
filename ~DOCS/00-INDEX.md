# Documentacao BasyLab - Index

Bem-vindo a documentacao centralizada de infraestrutura e desenvolvimento da BasyLab.

---

## Inicio Rapido

| Preciso... | Documento |
|------------|-----------|
| Acessar a VPS | [01-ACESSO-VPS.md](01-ACESSO-VPS.md) |
| Fazer deploy | [02-DEPLOY-PASSO-A-PASSO.md](02-DEPLOY-PASSO-A-PASSO.md) |
| Fazer rollback | [03-ROLLBACK.md](03-ROLLBACK.md) |
| Testar em homolog | [04-HOMOLOGACAO.md](04-HOMOLOGACAO.md) |
| Configurar ambiente dev | [05-CONFIGURACAO-AMBIENTE.md](05-CONFIGURACAO-AMBIENTE.md) |
| Entender a arquitetura | [06-ARQUITETURA-PROJETO.md](06-ARQUITETURA-PROJETO.md) |
| Gerenciar servicos VPS | [07-SERVICOS-VPS.md](07-SERVICOS-VPS.md) |

---

## Documentos

### 01. Acesso a VPS
**Arquivo:** [01-ACESSO-VPS.md](01-ACESSO-VPS.md)

- Informacoes do servidor (IP, usuarios)
- Configuracao SSH local
- Comandos de acesso
- Configuracao Tailscale
- Transferencia de arquivos (scp, rsync)
- Troubleshooting de conexao

### 02. Deploy Passo a Passo
**Arquivo:** [02-DEPLOY-PASSO-A-PASSO.md](02-DEPLOY-PASSO-A-PASSO.md)

- Estrategia de releases com symlinks
- Deploy do backend (3balug-api)
- Deploy do frontend (3balug-web)
- Scripts de deploy automatizado
- Deploy com migrations
- Checklist de deploy

### 03. Rollback
**Arquivo:** [03-ROLLBACK.md](03-ROLLBACK.md)

- Rollback de release (< 1 min)
- Rollback de banco de dados
- Rollback completo (desastre)
- Comandos uteis durante rollback
- Prevencao de problemas
- Checklist de rollback

### 04. Homologacao
**Arquivo:** [04-HOMOLOGACAO.md](04-HOMOLOGACAO.md)

- O que e homologacao
- Diferencas entre ambientes (dev/homolog/prod)
- Arquivos de ambiente
- Testes de pagamento (cartoes de teste)
- Testes de email
- Banco de dados em homolog
- Checklist de homologacao

### 05. Configuracao de Ambiente
**Arquivo:** [05-CONFIGURACAO-AMBIENTE.md](05-CONFIGURACAO-AMBIENTE.md)

- Pre-requisitos (macOS, Linux, Windows)
- Clonar repositorio
- Instalar dependencias
- Subir infraestrutura Docker
- Configurar variaveis de ambiente (.env)
- Setup do banco de dados
- Comandos do dia a dia
- Problemas comuns

### 06. Arquitetura do Projeto
**Arquivo:** [06-ARQUITETURA-PROJETO.md](06-ARQUITETURA-PROJETO.md)

- Stack tecnologica
- Clean Architecture (camadas)
- Estrutura de pastas (backend/frontend)
- Regras obrigatorias de codigo
- Convencoes de nomenclatura
- Padroes de API
- Testes
- Git workflow
- Checklist de code review

### 07. Servicos da VPS
**Arquivo:** [07-SERVICOS-VPS.md](07-SERVICOS-VPS.md)

- Nginx (reverse proxy)
- PM2 (process manager)
- PostgreSQL
- Redis
- MinIO (object storage)
- Certbot (SSL)
- Grafana (monitoramento)
- Monitoramento geral
- Troubleshooting rapido

---

## Informacoes Rapidas

### URLs de Producao

| Servico | URL |
|---------|-----|
| Frontend | https://3balug.basylab.com.br |
| API | https://api-3balug.basylab.com.br |
| Grafana | https://grafana.basylab.com.br |
| MinIO Console | https://minio.basylab.com.br |

### Acesso VPS

```bash
# Via Tailscale (preferencial)
ssh vps-basylab

# Via IP publico
ssh vps-basylab-public

# Como root (emergencias)
ssh vps-basylab-root
```

### IPs

| Tipo | IP |
|------|-----|
| Publico | 46.202.150.28 |
| Tailscale | 100.90.132.66 |

### Portas

| Servico | Porta |
|---------|-------|
| SSH | 22 |
| HTTP | 80 |
| HTTPS | 443 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO API | 9000 |
| MinIO Console | 9001 |
| API (PM2) | 3001/3003/3004 |

### Comandos Mais Usados

```bash
# Deploy rapido backend
./deploy-api.sh

# Deploy rapido frontend
./deploy-web.sh

# Ver logs da API
ssh vps-basylab-public "pm2 logs 3balug-api --lines 50"

# Rollback rapido
ssh vps-basylab-public "cd /apps/3balug-api && ln -sfn releases/RELEASE_ANTERIOR current && pm2 reload 3balug-api"

# Health check
curl https://api-3balug.basylab.com.br/health
```

---

## Estrutura da Pasta ~DOCS

```
~DOCS/
├── 00-INDEX.md                    # Este arquivo
├── 01-ACESSO-VPS.md              # Como acessar a VPS
├── 02-DEPLOY-PASSO-A-PASSO.md    # Como fazer deploy
├── 03-ROLLBACK.md                # Como fazer rollback
├── 04-HOMOLOGACAO.md             # Ambiente de homologacao
├── 05-CONFIGURACAO-AMBIENTE.md   # Setup do ambiente dev
├── 06-ARQUITETURA-PROJETO.md     # Padroes de arquitetura
└── 07-SERVICOS-VPS.md            # Servicos rodando na VPS
```

---

## Projetos no Monorepo

```
basylabrepo/
├── apps/
│   ├── 3balug/              # CRM Imobiliario
│   │   ├── api/             # Backend (Bun + Elysia)
│   │   ├── web/             # Frontend (React 19)
│   │   └── docs/            # Docs especificos do projeto
│   │
│   ├── basyadmin/           # Admin interno BasyLab
│   └── [outros]/
│
├── packages/                # Pacotes compartilhados
└── docker-compose.yml       # Infraestrutura local
```

---

## Contato

| Responsavel | Area |
|-------------|------|
| Felipe Bassetto | Desenvolvimento e Infraestrutura |

---

## Changelog

| Data | Alteracao |
|------|-----------|
| 2026-01-08 | Criacao inicial da documentacao |

---

**Dica:** Use `Ctrl+F` ou `Cmd+F` para buscar rapidamente nesta documentacao.
