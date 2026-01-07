# Plano de Correções - Basylab Monorepo

## Resumo dos Problemas Encontrados

### 1. Erros de TypeCheck (41 erros em 8 arquivos)

#### 1.1 Arquivos com módulos/schemas inexistentes (DEVEM SER DELETADOS)
Estes arquivos referenciam schemas e contracts que não existem no projeto:

| Arquivo | Problema |
|---------|----------|
| `src/repositories/providers/drizzle/lgpd-access-log.repository.ts` | Importa `@/db/schema/lgpd-access-logs` e `@/repositories/contracts/lgpd.repository` que não existem |
| `src/repositories/providers/drizzle/lgpd-consent.repository.ts` | Importa `@/db/schema/lgpd-consents` e `@/repositories/contracts/lgpd.repository` que não existem |
| `src/repositories/providers/drizzle/property-audit.repository.ts` | Importa `@/db/schema/property-audits` e `@/repositories/contracts/property-audit.repository` que não existem |
| `src/repositories/providers/drizzle/property-owner-history.repository.ts` | Importa `@/db/schema/property-owner-history` e `@/repositories/contracts/property-owner-history.repository` que não existem |
| `src/repositories/providers/drizzle/property-share.repository.ts` | Importa `@/db/schema/property-shares` e `@/repositories/contracts/property-share.repository` que não existem |

**Ação:** Deletar estes 5 arquivos pois são código morto (funcionalidades não implementadas).

#### 1.2 Erros em `document.repository.ts` (2 erros)
- Importa `BatchDocumentsInput` e `BatchDocumentsResult` que não existem em `@/repositories/contracts/document.repository`

**Ação:** Remover imports não utilizados ou adicionar os tipos ao contract.

#### 1.3 Erros em `property-owner.repository.ts` (10 erros)
- Referencia campos `rg` e `photoUrl` que não existem no schema `propertyOwners`
- Referencia filtros `documentType`, `state`, `hasProperties` que não existem em `PropertyOwnerFilters`
- Importa `PropertyOwnerWithPropertiesCount` que não existe no contract

**Ação:** Remover referências a campos/tipos inexistentes.

#### 1.4 Erros em `property.repository.ts` (16 erros)
- Referencia campos `deletedAt` e `code` que não existem no schema `properties`

**Ação:** Adicionar campos `deletedAt` e `code` ao schema de properties OU remover as referências.

---

### 2. Erros de Lint (47 warnings no @3balug/web)

#### 2.1 `lint/a11y/noStaticElementInteractions` (5 ocorrências)
Elementos estáticos (`<div>`) com event handlers mas sem role semântico adequado.

| Arquivo | Linha |
|---------|-------|
| `src/components/ConfirmDialog/ConfirmDialog.tsx` | 88 |
| `src/components/DocumentPicker/DocumentPicker.tsx` | 274 |
| `src/components/Header/Header.tsx` | 294 |
| `src/components/Modal/Modal.tsx` | 48 |

**Ação:** Trocar `role="presentation"` por `role="dialog"` nos modais/overlays que têm interação.

#### 2.2 `lint/a11y/useSemanticElements` (5 ocorrências)
Divs com `role="button"` que deveriam ser elementos `<button>`.

| Arquivo | Linha |
|---------|-------|
| `src/components/DocumentPicker/DocumentPicker.tsx` | 191 |
| `src/components/DocumentUpload/DocumentUpload.tsx` | 234 |
| `src/components/FileUploadLocal/FileUploadLocal.tsx` | 284 |
| `src/components/PhotoPicker/PhotoPicker.tsx` | 187 |
| `src/components/PropertyPhotoUpload/PropertyPhotoUpload.tsx` | 196 |

**Ação:** Substituir `<div role="button">` por `<button type="button">`.

#### 2.3 `lint/a11y/noLabelWithoutControl` (7+ ocorrências)
Labels sem associação com inputs via `htmlFor`.

| Arquivo | Linhas |
|---------|--------|
| `src/pages/Admin/ContractsPage/Page.tsx` | 140 |
| `src/pages/Admin/MyProfilePage/Page.tsx` | 449 |
| `src/pages/Admin/PropertiesPage/Page.tsx` | 224, 235 |
| `src/pages/Admin/PropertyOwnersPage/Page.tsx` | 132 |
| `src/pages/Admin/TeamPage/Page.tsx` | 297, 316 |

**Ação:** Adicionar `htmlFor` nos labels ou envolver input dentro do label.

#### 2.4 `lint/a11y/useKeyWithClickEvents` (1 ocorrência)
Elemento com onClick sem evento de teclado correspondente.

| Arquivo | Linha |
|---------|-------|
| `src/pages/Admin/PropertyDetailsPage/Page.tsx` | 221 |

**Ação:** Adicionar `onKeyDown` ou `onKeyUp` para acessibilidade.

#### 2.5 `suppressions/unused` (1 warning no @basylab/core)
Comentário de supressão sem efeito.

| Arquivo | Linha |
|---------|-------|
| `packages/core/src/validation/sanitizers.ts` | 47 |

**Ação:** Remover o comentário biome-ignore desnecessário.

---

### 3. Testes

#### Status Atual:
- **@3balug/api:** 192 testes passando (auth use-cases)
- **@basyadmin/api:** 193 testes passando
- **@3balug/web:** Nenhum teste unitário (apenas E2E com Playwright)
- **@basylab/core:** Nenhum teste configurado

**Ação:** Garantir que todos os testes continuem passando após as correções.

---

## Ordem de Execução

### Fase 1: Limpeza de Código Morto (TypeCheck)
1. Deletar `lgpd-access-log.repository.ts`
2. Deletar `lgpd-consent.repository.ts`
3. Deletar `property-audit.repository.ts`
4. Deletar `property-owner-history.repository.ts`
5. Deletar `property-share.repository.ts`

### Fase 2: Correções de Schema/Repository (TypeCheck)
6. Corrigir `document.repository.ts` - remover imports inexistentes
7. Corrigir `property-owner.repository.ts` - remover campos/filtros inexistentes
8. Corrigir `property.repository.ts` - adicionar campos `deletedAt` e `code` ao schema

### Fase 3: Correções de Acessibilidade (Lint)
9. Corrigir `ConfirmDialog.tsx` - ajustar role
10. Corrigir `DocumentPicker.tsx` - button semântico + role
11. Corrigir `DocumentUpload.tsx` - button semântico
12. Corrigir `FileUploadLocal.tsx` - button semântico
13. Corrigir `Header.tsx` - ajustar role
14. Corrigir `Modal.tsx` - ajustar role
15. Corrigir `PhotoPicker.tsx` - button semântico
16. Corrigir `PropertyPhotoUpload.tsx` - button semântico
17. Corrigir `ContractsPage/Page.tsx` - htmlFor
18. Corrigir `MyProfilePage/Page.tsx` - htmlFor
19. Corrigir `PropertiesPage/Page.tsx` - htmlFor
20. Corrigir `PropertyDetailsPage/Page.tsx` - onKeyDown
21. Corrigir `PropertyOwnersPage/Page.tsx` - htmlFor
22. Corrigir `TeamPage/Page.tsx` - htmlFor

### Fase 4: Limpeza Core
23. Corrigir `sanitizers.ts` - remover biome-ignore desnecessário

### Fase 5: Validação Final
24. Rodar `bun run typecheck` - deve passar sem erros
25. Rodar `bun run lint` - deve passar sem warnings
26. Rodar `bun run test` - todos testes devem passar
27. Rodar `bun run build` - build deve completar

---

## Comandos de Validação

```bash
# Na raiz do monorepo
bun run typecheck   # TypeScript check
bun run lint        # Biome linter
bun run test        # Todos os testes
bun run build       # Build de produção
```
