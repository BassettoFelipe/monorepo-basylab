# Basylab Website

Site oficial da Basylab - Empresa de desenvolvimento de software.

## Regras do Projeto

### Gerenciador de Pacotes

**SEMPRE use `bun` como gerenciador de pacotes.** Nunca use npm, yarn ou pnpm.

Comandos:
- Instalar dependencias: `bun add <pacote>`
- Instalar devDependencies: `bun add -d <pacote>`
- Rodar scripts: `bun run <script>`
- Dev server: `bun run dev`
- Build: `bun run build`
- Start: `bun run start`
- Lint: `bun run lint`

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint
- Turbopack

## Estrutura

O projeto usa App Router com a pasta `src/` para organizar o codigo.

## Diretrizes de Design

### Evitar Padrões Genéricos de IA

**NUNCA crie designs genéricos e previsíveis.** Evite:

- Grids de cards 2x2 ou 3x3 com ícone + título + descrição (clichê de landing page)
- Layouts simétricos e óbvios demais
- Seções com estrutura idêntica (header centralizado + grid de items)
- Ícones genéricos de outline (monitor, celular, engrenagem, etc)
- Títulos como "Nossos Serviços", "Por que nos escolher", "Como funciona"
- Bullet points ou listas genéricas de features
- Testemunhos em cards com aspas e foto circular
- CTAs óbvios como "Saiba mais", "Entre em contato"

### Criar Designs Únicos e Memoráveis

**SEMPRE busque:**

- Layouts assimétricos e inesperados
- Interações criativas (hover states interessantes, micro-animações únicas)
- Tipografia como elemento de design (tamanhos contrastantes, pesos variados)
- Uso criativo de espaço negativo
- Elementos visuais que contam uma história
- Transições suaves entre seções
- Hierarquia visual clara mas não óbvia

### Alternância de Fundos

As seções devem alternar entre fundos para criar ritmo visual:

1. **HeroSection** - Fundo escuro (#030303) com efeitos visuais
2. **Segunda seção** - Fundo levemente diferente ou com elemento visual distintivo
3. **Terceira seção** - Voltar para escuro ou usar accent color
4. Continuar alternando para manter interesse visual

### Tom de Comunicação

- Direto e confiante, sem ser arrogante
- Técnico quando necessário, mas acessível
- Evitar jargões de marketing vazios
- Personalidade da marca: expertise técnica + abordagem humana
