# Acesso a VPS - Guia Completo

Guia passo a passo para acessar a VPS da BasyLab.

---

## Informacoes do Servidor

| Item | Valor |
|------|-------|
| **Provedor** | Contabo |
| **IP Publico** | `46.202.150.28` |
| **IP Tailscale** | `100.90.132.66` |
| **Porta SSH** | `22` |
| **OS** | Ubuntu 22.04 LTS |

### Usuarios

| Usuario | Proposito | Senha |
|---------|-----------|-------|
| `root` | Administracao total | Chave SSH |
| `deploy` | Deploy de aplicacoes | Chave SSH |
| `balug` | Execucao do 3balug-api | Sistema |

---

## Passo 1: Configurar SSH Local

### 1.1 Verificar se tem chave SSH

```bash
ls -la ~/.ssh/
```

Se nao tiver `id_ed25519` ou `id_rsa`, crie uma:

```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
```

### 1.2 Configurar arquivo SSH config

Edite o arquivo `~/.ssh/config`:

```bash
nano ~/.ssh/config
# ou
code ~/.ssh/config
```

Adicione as seguintes configuracoes:

```bash
# ==========================================
# VPS BasyLab
# ==========================================

# Acesso via Tailscale (preferencial - mais estavel)
Host vps-basylab
    HostName 100.90.132.66
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes
    ServerAliveInterval 60
    ServerAliveCountMax 3

# Acesso via IP publico (fallback)
Host vps-basylab-public
    HostName 46.202.150.28
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes
    ServerAliveInterval 60
    ServerAliveCountMax 3

# Acesso como root (apenas emergencias)
Host vps-basylab-root
    HostName 46.202.150.28
    User root
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes
```

### 1.3 Ajustar permissoes

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/config
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

---

## Passo 2: Primeira Conexao

### 2.1 Testar conexao

```bash
# Via Tailscale (se tiver Tailscale instalado)
ssh vps-basylab

# Via IP publico
ssh vps-basylab-public
```

### 2.2 Se pedir confirmacao de fingerprint

```
The authenticity of host '46.202.150.28 (46.202.150.28)' can't be established.
ED25519 key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Digite `yes` e pressione Enter.

### 2.3 Se der erro de permissao

Se aparecer `Permission denied (publickey)`:

1. Verifique se a chave publica esta no servidor:
```bash
# Copiar chave para servidor (peca para o admin)
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@46.202.150.28
```

2. Ou adicione manualmente (como root):
```bash
# No servidor
cat >> /home/deploy/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1... seu-email@exemplo.com
EOF
```

---

## Passo 3: Comandos Uteis Pos-Conexao

### 3.1 Verificar onde voce esta

```bash
# Ver usuario atual
whoami

# Ver diretorio atual
pwd

# Ver hostname
hostname
```

### 3.2 Navegar para os projetos

```bash
# Frontend 3Balug
cd /apps/3balug

# Backend 3Balug
cd /apps/3balug-api

# Ver estrutura
ls -la
```

### 3.3 Ver processos rodando

```bash
# PM2 (gerenciador de processos Node/Bun)
pm2 list

# Ver logs em tempo real
pm2 logs

# Ver uso de recursos
htop
```

### 3.4 Ver logs do sistema

```bash
# Logs do nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs da aplicacao
tail -f /apps/3balug-api/shared/logs/out.log
tail -f /apps/3balug-api/shared/logs/error.log
```

---

## Passo 4: Tailscale (Opcional mas Recomendado)

O Tailscale cria uma VPN que permite acesso mais estavel a VPS.

### 4.1 Instalar Tailscale no Mac

```bash
# Via Homebrew
brew install tailscale

# Ou baixar do site
# https://tailscale.com/download/mac
```

### 4.2 Fazer login

```bash
tailscale up
```

Vai abrir o navegador para autenticar. Use a conta BasyLab.

### 4.3 Verificar conexao

```bash
# Ver dispositivos na rede
tailscale status

# Ping na VPS
ping 100.90.132.66
```

### 4.4 Conectar via Tailscale

```bash
ssh vps-basylab
```

**Vantagens do Tailscale:**
- IP fixo (100.90.132.66)
- Conexao mais estavel
- Funciona mesmo se IP publico mudar
- Criptografia adicional

---

## Passo 5: Transferir Arquivos

### 5.1 Copiar arquivo local para VPS

```bash
# Arquivo unico
scp arquivo.txt vps-basylab-public:/apps/3balug/

# Pasta inteira
scp -r pasta/ vps-basylab-public:/apps/3balug/

# Com rsync (melhor para muitos arquivos)
rsync -avz pasta/ vps-basylab-public:/apps/3balug/pasta/
```

### 5.2 Copiar arquivo da VPS para local

```bash
# Arquivo unico
scp vps-basylab-public:/apps/3balug/arquivo.txt ./

# Pasta inteira
scp -r vps-basylab-public:/apps/3balug/pasta/ ./
```

### 5.3 Rsync (recomendado para deploy)

```bash
# Sincronizar pasta local com VPS (apenas arquivos alterados)
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  ./dist/ vps-basylab-public:/apps/3balug/releases/nova-release/
```

---

## Passo 6: Comandos de Emergencia

### 6.1 Reiniciar servicos

```bash
# Reiniciar nginx
sudo systemctl restart nginx

# Reiniciar aplicacao (PM2)
pm2 restart all

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 6.2 Ver uso de disco

```bash
# Espaco em disco
df -h

# Tamanho de pastas
du -sh /apps/*
du -sh /var/log/*
```

### 6.3 Ver uso de memoria

```bash
# Memoria
free -h

# Processos por memoria
ps aux --sort=-%mem | head -10
```

### 6.4 Matar processo travado

```bash
# Encontrar PID
ps aux | grep nome-do-processo

# Matar processo
kill -9 PID
```

---

## Troubleshooting

### Erro: Connection refused

```
ssh: connect to host 46.202.150.28 port 22: Connection refused
```

**Causas possiveis:**
1. Servidor reiniciando
2. SSH nao esta rodando
3. Firewall bloqueando

**Solucao:**
- Aguarde alguns minutos e tente novamente
- Acesse o painel do provedor (Contabo) para verificar status
- Use o console web do provedor se disponivel

### Erro: Connection timed out

```
ssh: connect to host 46.202.150.28 port 22: Connection timed out
```

**Causas possiveis:**
1. IP incorreto
2. Servidor offline
3. Firewall bloqueando

**Solucao:**
- Verifique o IP
- Tente via Tailscale: `ssh vps-basylab`
- Verifique no painel do provedor

### Erro: Permission denied

```
Permission denied (publickey,password).
```

**Causas possiveis:**
1. Chave SSH nao configurada no servidor
2. Chave SSH incorreta
3. Usuario incorreto

**Solucao:**
```bash
# Verificar qual chave esta sendo usada
ssh -v vps-basylab-public

# Especificar chave manualmente
ssh -i ~/.ssh/id_ed25519 deploy@46.202.150.28
```

### Conexao cai frequentemente

**Solucao:** Adicione ao `~/.ssh/config`:

```bash
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    TCPKeepAlive yes
```

---

## Checklist de Acesso

- [ ] Chave SSH gerada (`~/.ssh/id_ed25519`)
- [ ] Arquivo `~/.ssh/config` configurado
- [ ] Permissoes corretas (chmod 600)
- [ ] Chave publica adicionada ao servidor
- [ ] Teste de conexao bem sucedido
- [ ] (Opcional) Tailscale instalado e configurado

---

## Links Uteis

- **Painel Contabo:** https://my.contabo.com
- **Tailscale:** https://login.tailscale.com
- **Status da VPS:** `ssh vps-basylab-public "uptime"`

---

**Proxima leitura:** [02-DEPLOY-PASSO-A-PASSO.md](02-DEPLOY-PASSO-A-PASSO.md)
