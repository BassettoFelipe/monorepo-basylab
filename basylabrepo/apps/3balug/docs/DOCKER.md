# 🐳 Docker Setup - 3Balug

## 📋 Pré-requisitos

- Docker >= 20.10
- Docker Compose >= 2.0

## 🚀 Quick Start (Apenas Infraestrutura)

Para rodar **apenas PostgreSQL, Redis e MinIO** em containers:

```bash
# Subir infraestrutura
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down

# Parar e remover volumes (apaga dados)
docker-compose down -v
```

**Portas expostas:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`

**Credenciais:**
- PostgreSQL: `postgres` / `postgres`
- MinIO: `minioadmin` / `minioadmin123`

Depois de subir a infraestrutura, rode o backend e frontend localmente:

```bash
# Terminal 1 - Backend
cd backend
bun install
bun run db:push
bun run db:seed
bun run dev

# Terminal 2 - Frontend
cd client
npm install
npm run dev
```

---

## 🔥 Full Stack com Hot-Reload

Para rodar **infraestrutura + backend + frontend** tudo em containers com hot-reload:

```bash
# Subir stack completo
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend

# Parar
docker-compose -f docker-compose.dev.yml down
```

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger Docs: http://localhost:3000/swagger
- MinIO Console: http://localhost:9001

**Health Checks:**
- Backend: http://localhost:3000/health
- Metrics: http://localhost:3000/metrics

---

## 🛠️ Comandos Úteis

### Infraestrutura

```bash
# Rebuild containers
docker-compose build

# Ver logs de serviço específico
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f minio

# Acessar shell do container
docker-compose exec postgres psql -U postgres -d 3balug_dev
docker-compose exec redis redis-cli

# Restart de serviço específico
docker-compose restart postgres
```

### Banco de Dados

```bash
# Conectar ao PostgreSQL
docker-compose exec postgres psql -U postgres -d 3balug_dev

# Backup do banco
docker-compose exec postgres pg_dump -U postgres 3balug_dev > backup.sql

# Restore do banco
docker-compose exec -T postgres psql -U postgres -d 3balug_dev < backup.sql

# Resetar banco (apaga tudo)
docker-compose exec backend bun run db:reset
```

### Redis

```bash
# Conectar ao Redis CLI
docker-compose exec redis redis-cli

# Ver todas as keys
docker-compose exec redis redis-cli KEYS '*'

# Limpar Redis
docker-compose exec redis redis-cli FLUSHALL
```

### MinIO

```bash
# Acessar console web
# Abra http://localhost:9001
# Login: minioadmin / minioadmin123

# Listar buckets
docker-compose exec minio mc ls minio

# Ver arquivos no bucket
docker-compose exec minio mc ls minio/3balug
```

---

## 🧹 Limpeza

```bash
# Parar e remover containers
docker-compose down

# Remover volumes (apaga dados)
docker-compose down -v

# Remover tudo (containers, volumes, networks, images)
docker-compose down -v --rmi all

# Limpar tudo do Docker (cuidado!)
docker system prune -a --volumes
```

---

## 📊 Monitoramento

### Health Checks

Todos os serviços têm health checks configurados:

```bash
# Ver status de saúde
docker-compose ps

# Verificar logs de health
docker inspect --format='{{json .State.Health}}' 3balug-postgres | jq
docker inspect --format='{{json .State.Health}}' 3balug-redis | jq
docker inspect --format='{{json .State.Health}}' 3balug-minio | jq
```

### Recursos

```bash
# Ver uso de recursos
docker stats

# Ver apenas containers do projeto
docker stats 3balug-postgres 3balug-redis 3balug-minio
```

---

## 🔧 Troubleshooting

### Porta já em uso

```bash
# Verificar o que está usando a porta
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# Matar processo
kill -9 <PID>
```

### Container não inicia

```bash
# Ver logs completos
docker-compose logs <service>

# Ver logs em tempo real
docker-compose logs -f <service>

# Restart do serviço
docker-compose restart <service>

# Rebuild e restart
docker-compose up -d --build <service>
```

### Banco de dados corrompido

```bash
# Parar tudo
docker-compose down

# Remover volume do postgres
docker volume rm 3balug_postgres_data

# Subir novamente
docker-compose up -d

# Rodar migrations
cd backend && bun run db:push && bun run db:seed
```

---

## 📝 Variáveis de Ambiente

### Backend (.env)

```env
NODE_ENV=development
PORT=3000

# Database (Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/3balug_dev

# Redis (Docker)
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO (Docker)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=3balug
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

---

## 🎯 Ambientes

### Development (Local)
```bash
docker-compose up -d
# Backend e Frontend rodam localmente
```

### Development (Full Docker)
```bash
docker-compose -f docker-compose.dev.yml up -d
# Tudo roda em containers com hot-reload
```

### Production
Use variáveis de ambiente de produção e serviços gerenciados:
- PostgreSQL: AWS RDS, Supabase, Neon
- Redis: AWS ElastiCache, Upstash
- MinIO: AWS S3, Cloudflare R2

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs -f`
2. Verifique health checks: `docker-compose ps`
3. Reinicie os serviços: `docker-compose restart`
4. Último recurso: `docker-compose down -v && docker-compose up -d`

**Documentação:**
- Docker: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose
- PostgreSQL: https://www.postgresql.org/docs
- Redis: https://redis.io/docs
- MinIO: https://min.io/docs
