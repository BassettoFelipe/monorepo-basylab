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
