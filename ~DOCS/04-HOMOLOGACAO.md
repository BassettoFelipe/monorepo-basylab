# Homologacao - Ambiente de Testes

Guia completo sobre o ambiente de homologacao.

---

## O que e Homologacao?

Homologacao (ou staging) e um ambiente que replica producao para testar antes do deploy final.

**Fluxo:**
```
Desenvolvimento (local) → Homologacao (VPS) → Producao (VPS)
```

---

## URLs do Ambiente

| Servico | URL Homolog | URL Producao |
|---------|-------------|--------------|
| Frontend | https://3balug.basylab.com.br | https://3balug.basylab.com.br |
| API | https://api-3balug.basylab.com.br | https://api-3balug.basylab.com.br |

> **Nota:** Atualmente homolog e producao compartilham a mesma infraestrutura.
> Para projetos maiores, considerar VPS separada para homolog.

---

## Diferencas entre Ambientes

### Desenvolvimento (Local)

| Item | Valor |
|------|-------|
| API URL | `http://localhost:3001` |
| Frontend URL | `http://localhost:5173` |
| Database | `localhost:5432/basylab` |
| Pagarme | Chaves de **TESTE** |
| Email | Console (nao envia de verdade) |

### Homologacao (VPS)

| Item | Valor |
|------|-------|
| API URL | `https://api-3balug.basylab.com.br` |
| Frontend URL | `https://3balug.basylab.com.br` |
| Database | `localhost:5432/crm_imobil_prod` |
| Pagarme | Chaves de **TESTE** |
| Email | Envia de verdade (Brevo) |

### Producao (VPS)

| Item | Valor |
|------|-------|
| API URL | `https://api-3balug.basylab.com.br` |
| Frontend URL | `https://3balug.basylab.com.br` |
| Database | `localhost:5432/crm_imobil_prod` |
| Pagarme | Chaves de **PRODUCAO** |
| Email | Envia de verdade (Brevo) |

---

## Arquivos de Ambiente

### Backend

```bash
apps/3balug/api/
├── .env                  # Desenvolvimento local
├── .env.example          # Template
├── .env.homolog          # Homologacao
└── .env.production       # Producao
```

### Frontend

```bash
apps/3balug/web/
├── .env                  # Desenvolvimento local
├── .env.example          # Template
├── .env.development      # Desenvolvimento
├── .env.homolog          # Homologacao
└── .env.production       # Producao
```

---

## Deploy em Homologacao

### Passo 1: Configurar ambiente de homolog

```bash
# Backend - usar .env.homolog
cd apps/3balug/api
cp .env.homolog .env

# Frontend - usar .env.homolog
cd apps/3balug/web
cp .env.homolog .env
```

### Passo 2: Build

```bash
# Backend
cd apps/3balug/api
bun install
bun run build

# Frontend
cd apps/3balug/web
bun install
bun run build
```

### Passo 3: Deploy

Seguir o mesmo processo de deploy de producao (ver [02-DEPLOY-PASSO-A-PASSO.md](02-DEPLOY-PASSO-A-PASSO.md)).

---

## Testando Pagamentos em Homologacao

### Pagarme - Cartoes de Teste

Use estes cartoes para testar pagamentos:

| Cartao | Numero | Resultado |
|--------|--------|-----------|
| Visa (aprovado) | `4000000000000010` | Aprovado |
| Visa (recusado) | `4000000000000028` | Recusado |
| Mastercard | `5200000000000007` | Aprovado |
| Elo | `6362970000457013` | Aprovado |

**Dados do cartao de teste:**
- CVV: `123`
- Validade: Qualquer data futura (ex: `12/30`)
- Nome: Qualquer nome

### Exemplo de teste

```bash
# Testar endpoint de checkout
curl -X POST https://api-3balug.basylab.com.br/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "planId": "plan_id_aqui",
    "card": {
      "number": "4000000000000010",
      "holderName": "TESTE USUARIO",
      "expMonth": 12,
      "expYear": 2030,
      "cvv": "123"
    }
  }'
```

---

## Testando Emails em Homologacao

Em homologacao, emails sao enviados de verdade via Brevo (ex-Sendinblue).

### Verificar envio

1. Acesse https://app.brevo.com
2. Login com a conta BasyLab
3. Va em "Transactional" > "Logs"
4. Verifique os emails enviados

### Emails que sao enviados

- Verificacao de email (2FA)
- Recuperacao de senha
- Confirmacao de pagamento
- Notificacoes do sistema

---

## Banco de Dados em Homologacao

### Acessar banco

```bash
# Na VPS
ssh vps-basylab-public

# Conectar ao PostgreSQL
psql -U crm_imobil_prod -d crm_imobil_prod

# Comandos uteis
\dt          # Listar tabelas
\d users     # Descrever tabela users
SELECT * FROM users LIMIT 5;  # Ver dados
\q           # Sair
```

### Limpar dados de teste

```bash
# CUIDADO: Isso apaga todos os dados!
# Use apenas em ambiente de teste

psql -U crm_imobil_prod -d crm_imobil_prod << EOF
TRUNCATE TABLE 
  leads,
  contracts,
  properties,
  tenants,
  property_owners,
  users
CASCADE;
EOF

# Recriar dados iniciais
cd /apps/3balug-api/current
bun run db:seed
```

### Criar usuario de teste

```bash
# Na VPS
cd /apps/3balug-api/current

# Usar Drizzle Studio (GUI)
bun run db:studio
# Acesse http://localhost:4983

# Ou via SQL
psql -U crm_imobil_prod -d crm_imobil_prod << EOF
INSERT INTO users (id, email, name, password_hash, role)
VALUES (
  gen_random_uuid(),
  'teste@teste.com',
  'Usuario Teste',
  '\$2b\$10\$hash_aqui',  -- Hash de "123456"
  'OWNER'
);
EOF
```

---

## Checklist de Homologacao

### Antes de enviar para producao

- [ ] Todas as features funcionando
- [ ] Fluxo de cadastro testado
- [ ] Fluxo de login testado (incluindo 2FA)
- [ ] Pagamentos testados (cartao de teste)
- [ ] Emails sendo enviados
- [ ] Upload de arquivos funcionando
- [ ] CRUD de todas as entidades
- [ ] Responsividade mobile
- [ ] Performance aceitavel
- [ ] Sem erros no console
- [ ] Sem erros nos logs

### Testes especificos 3Balug

- [ ] Cadastro de usuario + verificacao email
- [ ] Escolha de plano + pagamento
- [ ] Login pos-pagamento
- [ ] CRUD Proprietarios
- [ ] CRUD Imoveis (com fotos)
- [ ] CRUD Inquilinos
- [ ] CRUD Contratos
- [ ] Dashboard com dados reais

---

## Fluxo de Aprovacao

### 1. Desenvolvedor

```
1. Desenvolve feature local
2. Testa local
3. Faz deploy em homolog
4. Testa em homolog
5. Comunica que esta pronto
```

### 2. QA / Tester (se houver)

```
1. Acessa ambiente de homolog
2. Executa testes
3. Reporta bugs (se houver)
4. Aprova (se OK)
```

### 3. Cliente (se aplicavel)

```
1. Acessa ambiente de homolog
2. Valida funcionalidades
3. Solicita ajustes (se necessario)
4. Aprova para producao
```

### 4. Deploy em Producao

```
1. Backup do banco de producao
2. Deploy em producao
3. Testes rapidos em producao
4. Monitoramento
```

---

## Troubleshooting

### API retorna erro em homolog mas funciona local

1. Verificar variaveis de ambiente
```bash
ssh vps-basylab-public "cat /apps/3balug-api/current/.env"
```

2. Verificar logs
```bash
ssh vps-basylab-public "pm2 logs 3balug-api --lines 100"
```

3. Verificar se build esta atualizado
```bash
ssh vps-basylab-public "ls -la /apps/3balug-api/current/dist/"
```

### Frontend nao atualiza em homolog

1. Limpar cache do navegador (Ctrl+Shift+R)
2. Verificar se deploy foi feito
```bash
ssh vps-basylab-public "ls -la /apps/3balug/current/"
```
3. Verificar symlink
```bash
ssh vps-basylab-public "readlink /apps/3balug/current"
```

### Pagamento nao funciona em homolog

1. Verificar se esta usando chaves de TESTE
```bash
ssh vps-basylab-public "cat /apps/3balug-api/current/.env | grep PAGARME"
# Deve mostrar sk_test_xxx e pk_test_xxx
```

2. Verificar logs de erro
```bash
ssh vps-basylab-public "pm2 logs 3balug-api --err --lines 50"
```

3. Verificar no painel Pagarme
   - Acesse https://dash.pagar.me
   - Modo Sandbox (teste)
   - Verifique transacoes

---

## Ambientes Futuros (Recomendacao)

Para projetos maiores, considerar:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Local    │ →   │   Homolog   │ →   │  Producao   │
│  localhost  │     │ staging.xxx │     │    xxx.com  │
│   DB local  │     │ DB separado │     │  DB prod    │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Vantagens:**
- Homolog pode ser quebrado sem afetar producao
- Dados de teste isolados
- Testes mais realistas

---

**Proxima leitura:** [05-CONFIGURACAO-AMBIENTE.md](05-CONFIGURACAO-AMBIENTE.md)
