# CRM Imobiliário - Frontend

Sistema de gestão imobiliária completo com sistema de planos e autenticação.

## 📋 Sobre o Projeto

Plataforma web para gestão de imóveis, contratos, clientes e finanças com 3 planos diferentes:

- **Plano Básico (R$ 99/mês)** - Para corretores individuais
  - 1 usuário, 1 gestor, 5 consultas Serasa/mês
  
- **Plano Imobiliária (R$ 299/mês)** - Para pequenas e médias imobiliárias
  - 5 usuários, 2 gestores, 50 consultas Serasa/mês
  - Sistema de cobrança + Marketplace
  
- **Plano House (R$ 799/mês)** - Para grandes imobiliárias e redes
  - Usuários ilimitados, 5 gestores, 200 consultas Serasa/mês
  - Sistema completo + BI avançado

### 🎨 Novidades Recentes

- ✅ Design System 3Balug (Vanilla Extract CSS)
- ✅ Autenticação completa com 2FA (código via email)
- ✅ Integração Pagarme (tokenização + checkout)
- ✅ Sistema de assinaturas funcional
- ✅ Páginas públicas (Termos, Privacidade, Planos)
- ✅ Dashboard básico com informações do usuário
- ✅ Validações avançadas com Zod
- ✅ Preview de cartão de crédito em tempo real

## 🚀 Tecnologias

- **Runtime/Build**: [Bun](https://bun.sh) 1.3+
- **Framework**: [React](https://react.dev) v19
- **Linguagem**: TypeScript 5.9+
- **Roteamento**: React Router v7
- **State Management**: TanStack Query v5 (server state) + local state
- **Formulários**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Styling**: Vanilla Extract CSS (Design System 3Balug)
- **Pagamentos**: React Credit Cards 2
- **Notificações**: React Toastify
- **Ícones**: Lucide React
- **Linter/Formatter**: [Biome](https://biomejs.dev)
- **Dead Code**: [Knip](https://knip.dev)

## 📁 Estrutura do Projeto

```
client/src/
├── components/          # Componentes reutilizáveis
│   ├── Button/         # Botão com variantes
│   ├── Input/          # Input com validação
│   ├── Select/         # Select customizado
│   └── ...
│
├── pages/              # Páginas da aplicação
│   ├── Auth/           # Login, Register, Setup Profile
│   ├── Admin/          # Dashboard, Imóveis, Contratos, Equipe
│   ├── Public/         # Páginas públicas
│   └── Subscription/   # Planos, checkout e pagamentos
│
├── queries/            # Hooks React Query
│   ├── auth/
│   ├── properties/
│   └── ...
│
├── services/           # Services modulares (1 arquivo = 1 função)
│   ├── auth/
│   ├── properties/
│   ├── property-photos/
│   └── ...
│
├── lib/                # Cliente HTTP (Axios)
│   └── api.ts
│
├── router/             # Definição de rotas
├── routing/            # Guards e setup de navegação
│
├── design-system/      # Design system 3Balug
├── layouts/            # Layouts compartilhados
├── hooks/              # Custom hooks
├── types/              # TypeScript types
├── utils/              # Utilitários
└── styles/             # Estilos globais
```

## 🎨 Design System

O projeto utiliza CSS Custom Properties para design tokens:

- **Cores**: Escalas de primary, gray, success, warning, error
- **Espaçamento**: `--spacing-xs` até `--spacing-3xl`
- **Tipografia**: `--text-xs` até `--text-5xl`
- **Border Radius**: `--radius-sm` até `--radius-full`
- **Sombras**: `--shadow-xs` até `--shadow-xl`

Suporte a dark mode via `prefers-color-scheme`.

## ⚙️ Instalação

```bash
# Instalar dependências
bun install

# Configurar variáveis de ambiente
cp .env.example .env
```

## 🛠️ Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento (com HMR)
bun dev
# Acesse: http://localhost:3000

# Build de produção
bun run build

# Verificar qualidade do código
bun run check

# Detectar código morto
bun run knip
```

## 🔐 Sistema de Autenticação

### Fluxo de Login
1. Usuário faz login com email/senha
2. Backend valida e retorna JWT + dados do usuário com assinatura
3. Token armazenado no localStorage
4. Token injetado automaticamente em todas requisições (header Authorization)
5. Middleware do backend valida JWT e assinatura ativa

### Proteção de Rotas
- **ProtectedRoute** verifica autenticação e assinatura ativa
- Redireciona para `/login` se não autenticado
- Redireciona para `/plans` se sem assinatura ativa

### Estrutura do Token JWT
```typescript
{
  userId: string,
  email: string,
  subscriptionId: string,
  planId: string,
  iat: number,
  exp: number
}
```

## 📦 Sistema de Planos

### Planos Disponíveis

#### 🔵 Plano Básico (R$ 99/mês)
- 1 usuário
- 1 gestor
- 5 consultas Serasa/mês
- Gestão básica de imóveis e contratos

#### 🟢 Plano Imobiliária (R$ 299/mês)
- 5 usuários
- 2 gestores
- 50 consultas Serasa/mês
- Sistema de cobrança
- Marketplace

#### 🟡 Plano House (R$ 799/mês)
- Usuários ilimitados
- 5 gestores
- 200 consultas Serasa/mês
- Sistema completo de cobrança
- Marketplace
- BI avançado

### Middleware de Validação

O backend possui 3 middlewares principais:

```typescript
// authMiddleware - Valida JWT
// subscriptionMiddleware - Valida assinatura ativa
// authWithPlanMiddleware - Valida JWT + assinatura
```

## 🎯 Scripts Disponíveis

```bash
# Desenvolvimento
bun dev              # Servidor dev com HMR

# Build
bun run build        # Build de produção

# Code Quality
bun run format       # Formatar código
bun run lint         # Executar linter
bun run check        # Lint + format (recomendado)
bun run ci           # Validação CI/CD

# Análise
bun run knip         # Detectar código morto
```

## 🔧 Variáveis de Ambiente

Criar arquivo `.env` na raiz de `client/`:

```env
# URL da API
VITE_API_URL=http://localhost:3000
```

## 📚 Padrões de Código

### Componentes
```typescript
// Named exports apenas (sem default)
export function Button({ variant = "primary", ...props }: ButtonProps) {
  // Implementation
}
```

### Services
```typescript
// 1 arquivo por função (services/auth/session/login.ts)
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // Implementation
};
```

### Formulários
```typescript
// React Hook Form + Zod validation
const schema = z.object({
  email: z.string().email(),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema)
});
```

## 🧪 Qualidade de Código

### Biome
- Linting automático
- Formatação consistente
- Organização de imports
- Zero configuração

### Knip
- Detecta arquivos não utilizados
- Detecta exports não utilizados
- Detecta dependências não utilizadas
- Mantém codebase limpo

### TypeScript
- Strict mode habilitado
- Path aliases (`@/*`)
- Type safety em 100% do código

## 🔒 Segurança

- ✅ JWT para autenticação
- ✅ Tokens com expiração
- ✅ Validação de entrada com Zod
- ✅ Proteção de rotas
- ✅ Validação de assinatura ativa
- ✅ HTTPS em produção

## 📖 Documentação Adicional

- [FRONTEND_STRUCTURE.md](./FRONTEND_STRUCTURE.md) - Arquitetura detalhada
- [FRONTEND_REFACTOR_SUMMARY.md](./FRONTEND_REFACTOR_SUMMARY.md) - Histórico de mudanças
- [CLEANUP.md](./CLEANUP.md) - Guia de qualidade de código

## 🎯 Próximos Passos

- [x] Estrutura base e autenticação
- [x] Sistema de planos
- [ ] CRUD de imóveis
- [ ] CRUD de contratos
- [ ] Dashboard financeiro
- [ ] Marketplace
- [ ] Painel administrativo
- [ ] Aplicativo mobile

## 🐛 Troubleshooting

### Build falha
```bash
# Limpar cache e reinstalar
rm -rf node_modules bun.lock dist
bun install
bun run build
```

### Hot reload não funciona
```bash
# Reiniciar servidor dev
bun dev
```

### Erros de tipo
```bash
# Verificar tipos
bunx tsc --noEmit
```

## 📞 Suporte

Para dúvidas e problemas, consulte a documentação ou abra uma issue no repositório.

---

**Desenvolvido com ❤️ usando Bun + React**
