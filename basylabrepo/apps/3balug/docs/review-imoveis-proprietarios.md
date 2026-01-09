# Review Completo: Fluxos de Imoveis e Proprietarios

Este documento contem uma analise detalhada dos fluxos de imoveis e proprietarios, identificando oportunidades de melhorias de codigo, performance, bugs potenciais e codigo reutilizavel.

---

## Checklist de Progresso

### Fase 1: Codigo Duplicado e Oportunidades de Reutilizacao
- [x] 1.1 Schemas Zod Duplicados - `web/src/schemas/property.schema.ts` criado
- [x] 1.2 Schemas de Proprietarios Duplicados - `web/src/schemas/property-owner.schema.ts` criado
- [x] 1.3 Logica de Paginacao Duplicada - `web/src/utils/pagination.ts` criado
- [x] 1.4 Hook de Busca de CEP Duplicado - `web/src/hooks/useCepLookup.ts` criado
- [x] 1.5 Logica de Mascara de Input Duplicada - `web/src/hooks/useMaskedInput.ts` criado
- [x] 1.6 Steps do Wizard Duplicados - `web/src/constants/wizard-steps.ts` criado
- [x] 1.7 Labels e Options Duplicados - `web/src/constants/property.constants.ts` criado
- [x] 1.8 propertyFeaturesSchema Duplicado no Backend - `api/src/controllers/routes/properties/shared/features.schema.ts` criado

### Fase 2: Problemas de Performance
- [x] 2.1 useCallbacks Desnecessarios - Removidos `useCallback` desnecessarios nos handlers dos modais (handleOwnerChange, handlePropertyTypeChange, handleListingTypeChange)
- [x] 2.2 useEffect com Reset Desnecessario - Otimizado usando `useRef` para detectar transicao de estado do modal
- [x] 2.3 watch() Multiplos sem Memoizacao - Refatorado para usar `useWatch` com arrays em CreatePropertyModal e EditPropertyModal
- [x] 2.4 staleTime: 0 nas Queries - Ajustado para 2 minutos em `usePropertiesQuery` e `usePropertyOwnersQuery`
- [ ] 2.5 Funcoes Inline em JSX - Baixa prioridade, impacto minimo

### Fase 3: Bugs Potenciais e Validacoes
- [x] 3.1 Race Condition no Upload de Fotos - Cleanup de blob URLs adicionado em todos os modais
- [x] 3.2 Validacao de Preco Inconsistente - Criada funcao helper `isValidPrice` que verifica existencia e valor > 0
- [x] 3.3 Potencial Null Reference no Property Delete - Ja tratado com early return existente
- [x] 3.4 Estado de Modal Inconsistente - Tratamento existente adequado (return null quando !property && !isLoading)
- [x] 3.5 Falta de Debounce na Busca - `useDebouncedValue` criado e aplicado em `PropertiesPage` e `PropertyOwnersPage`

### Fase 4-14: Pendentes
- [ ] Ver secoes detalhadas abaixo

---

## Sumario

- [Fase 1: Codigo Duplicado e Oportunidades de Reutilizacao](#fase-1-codigo-duplicado-e-oportunidades-de-reutilizacao)
- [Fase 2: Problemas de Performance (useCallback, useEffect, useMemo)](#fase-2-problemas-de-performance-usecallback-useeffect-usememo)
- [Fase 3: Bugs Potenciais e Validacoes](#fase-3-bugs-potenciais-e-validacoes)
- [Fase 4: Melhorias de Codigo e Boas Praticas](#fase-4-melhorias-de-codigo-e-boas-praticas)
- [Fase 5: Melhorias de Performance no Backend](#fase-5-melhorias-de-performance-no-backend)
- [Fase 6: Plano de Implementacao](#fase-6-plano-de-implementacao)
- [Fase 7: Cobertura de Testes](#fase-7-cobertura-de-testes)
- [Fase 8: Acessibilidade (A11Y)](#fase-8-acessibilidade-a11y)
- [Fase 9: Tratamento de Erros](#fase-9-tratamento-de-erros)
- [Fase 10: Internacionalizacao (I18N)](#fase-10-internacionalizacao-i18n)
- [Fase 11: Componentes de UI Reutilizaveis](#fase-11-componentes-de-ui-reutilizaveis)
- [Fase 12: Queries e Mutations - Padroes e Consistencia](#fase-12-queries-e-mutations---padroes-e-consistencia)
- [Fase 13: Seguranca](#fase-13-seguranca)
- [Fase 14: Plano de Implementacao Atualizado](#fase-14-plano-de-implementacao-atualizado)

---

## Fase 1: Codigo Duplicado e Oportunidades de Reutilizacao

### 1.1 Schemas Zod Duplicados (Alta Prioridade)

**Problema**: O schema `createPropertySchema` e `editPropertySchema` sao praticamente identicos, com mais de 100 linhas duplicadas.

**Arquivos afetados**:
- `web/src/pages/Admin/PropertiesPage/components/CreatePropertyModal/CreatePropertyModal.tsx`
- `web/src/pages/Admin/PropertiesPage/components/EditPropertyModal/EditPropertyModal.tsx`

**Solucao**: Criar um schema base reutilizavel.

```typescript
// web/src/schemas/property.schema.ts
import { z } from 'zod'
import { getCurrencyRawValue } from '@/utils/masks'

export const propertyFeaturesSchema = z.object({
  hasPool: z.boolean().optional(),
  hasGarden: z.boolean().optional(),
  hasGarage: z.boolean().optional(),
  hasElevator: z.boolean().optional(),
  hasGym: z.boolean().optional(),
  hasPlayground: z.boolean().optional(),
  hasSecurity: z.boolean().optional(),
  hasAirConditioning: z.boolean().optional(),
  hasFurnished: z.boolean().optional(),
  hasPetFriendly: z.boolean().optional(),
  hasBalcony: z.boolean().optional(),
  hasBarbecue: z.boolean().optional(),
})

export const propertyBaseSchema = z.object({
  ownerId: z.string().min(1, 'Proprietario e obrigatorio'),
  type: z.enum(['house', 'apartment', 'land', 'commercial', 'rural'], {
    message: 'Selecione o tipo do imovel',
  }),
  listingType: z.enum(['rent', 'sale', 'both'], {
    message: 'Selecione a finalidade',
  }),
  title: z.string()
    .min(3, 'Titulo deve ter pelo menos 3 caracteres')
    .max(200, 'Titulo deve ter no maximo 200 caracteres'),
  description: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  suites: z.string().optional(),
  parkingSpaces: z.string().optional(),
  area: z.string().optional(),
  floor: z.string().optional(),
  totalFloors: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().min(1, 'Endereco e obrigatorio'),
  addressNumber: z.string().min(1, 'Numero e obrigatorio'),
  addressComplement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro e obrigatorio'),
  city: z.string().min(1, 'Cidade e obrigatoria'),
  state: z.string().min(1, 'Estado e obrigatorio').max(2, 'Use a sigla do estado'),
  rentalPrice: z.string().optional(),
  salePrice: z.string().optional(),
  iptuPrice: z.string().optional(),
  condoFee: z.string().optional(),
  commissionPercentage: z.string().optional(),
  isMarketplace: z.boolean().optional(),
  notes: z.string().optional(),
  ...propertyFeaturesSchema.shape,
})

// Refinamentos reutilizaveis
export const createPriceRefinement = (schema: z.ZodTypeAny) => 
  schema
    .refine(
      (data) => {
        if (data.listingType === 'rent' || data.listingType === 'both') {
          return getCurrencyRawValue(data.rentalPrice || '') > 0
        }
        return true
      },
      { message: 'Preco de aluguel e obrigatorio para locacao', path: ['rentalPrice'] }
    )
    .refine(
      (data) => {
        if (data.listingType === 'sale' || data.listingType === 'both') {
          return getCurrencyRawValue(data.salePrice || '') > 0
        }
        return true
      },
      { message: 'Preco de venda e obrigatorio para venda', path: ['salePrice'] }
    )

export const createPropertySchema = createPriceRefinement(propertyBaseSchema)

export const editPropertySchema = createPriceRefinement(
  propertyBaseSchema.extend({
    status: z.enum(['available', 'rented', 'sold', 'maintenance', 'unavailable'], {
      message: 'Selecione o status',
    }),
  })
)
```

---

### 1.2 Schemas de Proprietarios Duplicados (Alta Prioridade)

**Problema**: Mesma situacao para `createPropertyOwnerSchema` e `editPropertyOwnerSchema`.

**Arquivos afetados**:
- `web/src/pages/Admin/PropertyOwnersPage/components/CreatePropertyOwnerModal/CreatePropertyOwnerModal.tsx`
- `web/src/pages/Admin/PropertyOwnersPage/components/EditPropertyOwnerModal/EditPropertyOwnerModal.tsx`

**Solucao**: Criar schema base para proprietarios.

```typescript
// web/src/schemas/property-owner.schema.ts
import { z } from 'zod'

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/

export const propertyOwnerBaseSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no maximo 100 caracteres'),
  documentType: z.enum(['cpf', 'cnpj'], {
    message: 'Selecione o tipo de documento',
  }),
  document: z.string().min(1, 'Documento e obrigatorio'),
  rg: z.string().optional(),
  nationality: z.string().optional(),
  maritalStatus: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel']).optional(),
  profession: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  phone: z.string().min(1, 'Telefone e obrigatorio'),
  phoneSecondary: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  birthDate: z.string().optional(),
  notes: z.string().optional(),
})

export const createDocumentRefinement = (schema: z.ZodTypeAny) =>
  schema.refine(
    (data) => {
      if (data.documentType === 'cpf') {
        return cpfRegex.test(data.document)
      }
      return cnpjRegex.test(data.document)
    },
    { message: 'Documento invalido', path: ['document'] }
  )

export const propertyOwnerSchema = createDocumentRefinement(propertyOwnerBaseSchema)
```

---

### 1.3 Logica de Paginacao Duplicada (Media Prioridade)

**Problema**: A funcao `getPaginationPages` esta duplicada em `PropertiesPage.tsx` e `PropertyOwnersPage.tsx`.

**Solucao**: Extrair para um hook ou utilitario.

```typescript
// web/src/utils/pagination.ts
export function getPaginationPages(
  currentPage: number, 
  totalPages: number
): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []
  const showEllipsisThreshold = 7

  if (totalPages <= showEllipsisThreshold) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }

  pages.push(1)

  if (currentPage > 3) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis')
  }

  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}
```

---

### 1.4 Hook de Busca de CEP Duplicado (Media Prioridade)

**Problema**: A funcao `fetchAddressByCep` esta duplicada em 4 modais diferentes.

**Arquivos afetados**:
- `CreatePropertyModal.tsx`
- `EditPropertyModal.tsx`
- `CreatePropertyOwnerModal.tsx`
- `EditPropertyOwnerModal.tsx`

**Solucao**: Criar um hook customizado.

```typescript
// web/src/hooks/useCepLookup.ts
import { useCallback, useState } from 'react'

interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

interface CepResult {
  address: string
  neighborhood: string
  city: string
  state: string
}

interface UseCepLookupReturn {
  isLoading: boolean
  error: string | null
  fetchAddress: (cep: string) => Promise<CepResult | null>
  clearError: () => void
}

export function useCepLookup(): UseCepLookupReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAddress = useCallback(async (cep: string): Promise<CepResult | null> => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return null

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      if (!response.ok) throw new Error('Erro ao buscar CEP')

      const data: ViaCepResponse = await response.json()
      if (data.erro) {
        setError('CEP nao encontrado')
        return null
      }

      return {
        address: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      }
    } catch {
      setError('Erro ao buscar CEP. Preencha manualmente.')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { isLoading, error, fetchAddress, clearError }
}
```

---

### 1.5 Logica de Mascara de Input Duplicada (Media Prioridade)

**Problema**: Handlers de mascara (`handleCurrencyChange`, `handlePercentageChange`, `handleCepChange`, etc.) duplicados em multiplos modais.

**Solucao**: Criar handlers genericos reutilizaveis.

```typescript
// web/src/hooks/useMaskedInput.ts
import { useCallback } from 'react'
import { type UseFormSetValue } from 'react-hook-form'
import { applyMask } from '@/utils/masks'

type MaskType = 'currency' | 'cep' | 'phone' | 'cpf' | 'cnpj' | 'percentage'

export function useMaskedInput<T extends Record<string, unknown>>(
  setValue: UseFormSetValue<T>
) {
  const createMaskedHandler = useCallback(
    (field: keyof T, maskType: MaskType) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value

        if (maskType === 'percentage') {
          value = value.replace(/\D/g, '')
          if (value.length > 4) value = value.slice(0, 4)
          if (Number.parseInt(value, 10) > 10000) value = '10000'
          const numValue = Number.parseInt(value, 10) || 0
          value = numValue > 0 ? `${(numValue / 100).toFixed(2)}%` : ''
        } else {
          value = applyMask(value, maskType)
        }

        setValue(field as string, value as T[keyof T], { shouldValidate: false })
      },
    [setValue]
  )

  return { createMaskedHandler }
}
```

---

### 1.6 Steps do Wizard Duplicados (Media Prioridade)

**Problema**: A constante `ALL_STEPS` para o wizard de imoveis esta definida tanto em `CreatePropertyModal` quanto em `EditPropertyModal`.

**Solucao**: Centralizar constantes de steps.

```typescript
// web/src/constants/wizard-steps.ts
import { Building2, Camera, DollarSign, Globe, Home, MapPin, Settings, User } from 'lucide-react'
import type { PropertyType } from '@/types/property.types'

export interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

export const PROPERTY_WIZARD_STEPS: WizardStep[] = [
  { id: 'owner', title: 'Proprietario', description: 'Selecione o proprietario', icon: <User size={16} /> },
  { id: 'type', title: 'Categoria', description: 'Tipo e finalidade', icon: <Building2 size={16} /> },
  { id: 'details', title: 'Detalhes', description: 'Informacoes basicas', icon: <Home size={16} /> },
  { id: 'address', title: 'Endereco', description: 'Localizacao', icon: <MapPin size={16} /> },
  { id: 'pricing', title: 'Valores', description: 'Precos e comissao', icon: <DollarSign size={16} /> },
  { id: 'features', title: 'Extras', description: 'Caracteristicas', icon: <Settings size={16} /> },
  { id: 'photos', title: 'Fotos', description: 'Imagens', icon: <Camera size={16} /> },
  { id: 'publish', title: 'Publicacao', description: 'Configuracoes', icon: <Globe size={16} /> },
]

export function getPropertyStepsForType(type: PropertyType): WizardStep[] {
  if (type === 'land') {
    return PROPERTY_WIZARD_STEPS.filter((step) => step.id !== 'features')
  }
  return PROPERTY_WIZARD_STEPS
}
```

---

### 1.7 Labels e Options Duplicados (Baixa Prioridade)

**Problema**: Labels como `propertyTypeLabels`, `listingTypeLabels`, `statusLabels` e arrays de options estao duplicados.

**Arquivos afetados**:
- `PropertiesPage.tsx`
- `CreatePropertyModal.tsx`
- `EditPropertyModal.tsx`

**Solucao**: Centralizar em arquivo de constantes.

```typescript
// web/src/constants/property.constants.ts
import type { ListingType, PropertyStatus, PropertyType } from '@/types/property.types'

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  land: 'Terreno',
  commercial: 'Comercial',
  rural: 'Rural',
}

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  rent: 'Locacao',
  sale: 'Venda',
  both: 'Ambos',
}

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  available: 'Disponivel',
  rented: 'Alugado',
  sold: 'Vendido',
  maintenance: 'Manutencao',
  unavailable: 'Indisponivel',
}

export const PROPERTY_TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'house', label: 'Casa' },
  { value: 'apartment', label: 'Apartamento' },
  { value: 'land', label: 'Terreno' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural' },
]

export const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'available', label: 'Disponivel' },
  { value: 'rented', label: 'Alugado' },
  { value: 'sold', label: 'Vendido' },
  { value: 'maintenance', label: 'Manutencao' },
  { value: 'unavailable', label: 'Indisponivel' },
]
```

---

### 1.8 propertyFeaturesSchema Duplicado no Backend (Alta Prioridade)

**Problema**: O schema de features esta duplicado em `create/schema.ts` e `update/schema.ts`.

**Arquivos afetados**:
- `api/src/controllers/routes/properties/create/schema.ts`
- `api/src/controllers/routes/properties/update/schema.ts`

---

## Fase 7: Cobertura de Testes

### 7.1 Testes E2E sem Testes Unitarios (Alta Prioridade)

**Problema**: O projeto possui muitos testes E2E (335 ocorrencias em properties, 296 em property-owners), mas faltam testes unitarios para funcoes de negocio criticas.

**Arquivos que precisam de testes unitarios**:
- `api/src/controllers/routes/properties/list/list.ts` - Validacao de filtros de preco
- `api/src/controllers/routes/property-owners/list/list.ts` - Logica de filtros complexos
- Funcoes de formatacao e conversao de dados (currency, masks)

**Solucao**: Criar testes unitarios para:

```typescript
// api/src/controllers/routes/properties/list/__tests__/list.unit.test.ts
import { describe, it, expect } from 'vitest'

describe('Property List Filters', () => {
  describe('Price Filters', () => {
    it('should filter by minRentalPrice correctly', () => {
      // ...
    })
    
    it('should filter by maxSalePrice correctly', () => {
      // ...
    })
    
    it('should handle invalid price values gracefully', () => {
      // ...
    })
  })
})
```

---

### 7.2 Testes de Manipulacao de Fotos (Alta Prioridade)

**Problema**: Logica complexa de gerenciamento de fotos sem testes especificos.

**Arquivo**: `web/src/pages/Admin/PropertiesPage/components/EditPropertyModal/EditPropertyModal.tsx` (linhas 180-400)

**Solucao**: Criar testes para:
- Adicao e remocao de fotos
- Definicao de foto primaria
- Rollback de operacoes de foto em caso de erro
- Validacao de tamanho e tipo de arquivo

```typescript
// web/src/pages/Admin/PropertiesPage/components/EditPropertyModal/__tests__/PhotoManagement.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

describe('Photo Management', () => {
  it('should add photos to the list', () => {
    // ...
  })
  
  it('should remove a photo from the list', () => {
    // ...
  })
  
  it('should set a photo as primary', () => {
    // ...
  })
  
  it('should rollback on upload error', () => {
    // ...
  })
})
```

---

### 7.3 Testes de Validacao de Schemas (Media Prioridade)

**Problema**: Schema complexo com validacoes customizadas (.refine) sem testes.

**Arquivo**: `web/src/schemas/property.schema.ts`

**Solucao**: Adicionar testes para validacoes condicionais.

```typescript
// web/src/schemas/__tests__/property.schema.test.ts
import { describe, it, expect } from 'vitest'
import { createPropertySchema } from '../property.schema'

describe('Property Schema', () => {
  describe('Price Validation', () => {
    it('should require rentalPrice when listingType is rent', () => {
      const result = createPropertySchema.safeParse({
        listingType: 'rent',
        rentalPrice: '',
        // ... outros campos obrigatorios
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('rentalPrice')
    })
    
    it('should require salePrice when listingType is sale', () => {
      const result = createPropertySchema.safeParse({
        listingType: 'sale',
        salePrice: '',
        // ...
      })
      expect(result.success).toBe(false)
    })
    
    it('should require both prices when listingType is both', () => {
      // ...
    })
  })
})
```

---

## Fase 8: Acessibilidade (A11Y)

### 8.1 Labels Desassociados dos Inputs (Alta Prioridade)

**Problema**: Labels sem `htmlFor` correto em varios filtros.

**Arquivo**: `web/src/pages/Admin/PropertiesPage/Page.tsx` (linhas 215-250)

**Solucao**: Garantir que todos os labels tem `htmlFor` correto e consistente.

```typescript
// Antes
<label className={styles.filterLabel}>
  Buscar
</label>
<Input id="search-filter" ... />

// Depois
<label className={styles.filterLabel} htmlFor="search-filter">
  Buscar
</label>
<Input id="search-filter" ... />
```

---

### 8.2 Elementos Interativos sem Role Semantico (Alta Prioridade)

**Problema**: Divs interativas usadas como dropzone sem role apropriado.

**Arquivo**: `web/src/pages/Admin/PropertyOwnersPage/components/CreatePropertyOwnerModal/CreatePropertyOwnerModal.tsx` (linhas 232-260)

**Solucao**: Adicionar roles e handlers de teclado.

```typescript
// Antes
<div onClick={handleClick} className={styles.dropzone}>
  ...
</div>

// Depois
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
  className={styles.dropzone}
  aria-label="Clique ou arraste arquivos para upload"
>
  ...
</div>
```

---

### 8.3 Botoes de Icone sem Aria-Label (Alta Prioridade)

**Problema**: Buttons com apenas icones (Eye, Edit, Trash2) sem acessibilidade adequada.

**Arquivos**:
- `web/src/pages/Admin/PropertiesPage/Page.tsx` (linhas 614-630)
- `web/src/pages/Admin/PropertyOwnersPage/Page.tsx` (linhas 472-485)

**Solucao**: Adicionar `aria-label` alem de `title`.

```typescript
// Antes
<button
  type="button"
  className={styles.iconButton}
  onClick={() => viewPropertyDetails(property)}
  title="Ver detalhes"
>
  <Eye size={16} />
</button>

// Depois
<button
  type="button"
  className={styles.iconButton}
  onClick={() => viewPropertyDetails(property)}
  title="Ver detalhes"
  aria-label={`Ver detalhes do imovel ${property.title}`}
>
  <Eye size={16} />
</button>
```

---

### 8.4 Modais sem Focus Trap (Media Prioridade)

**Problema**: Modal nao gerencia focus trap quando abre/fecha.

**Arquivo**: `web/src/pages/Admin/PropertiesPage/components/EditPropertyModal/EditPropertyModal.tsx`

**Solucao**: Implementar focus trap usando biblioteca.

```typescript
// Instalar: npm install focus-trap-react

import FocusTrap from 'focus-trap-react'

function EditPropertyModal({ isOpen, ... }) {
  return (
    <FocusTrap active={isOpen}>
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          {/* conteudo do modal */}
        </div>
      </div>
    </FocusTrap>
  )
}
```

---

### 8.5 Mensagens Dinamicas sem Aria-Live (Media Prioridade)

**Problema**: Validacao de CEP mostra hint sem aria-live.

**Arquivo**: `web/src/pages/Admin/PropertiesPage/components/CreatePropertyModal/CreatePropertyModal.tsx` (linhas 260-280)

**Solucao**: Adicionar `aria-live="polite"`.

```typescript
// Antes
{cepLoading && <span className={styles.cepHint}>Buscando endereco...</span>}

// Depois
<div aria-live="polite" aria-atomic="true">
  {cepLoading && <span className={styles.cepHint}>Buscando endereco...</span>}
  {cepError && <span className={styles.cepError}>{cepError}</span>}
</div>
```

---

## Fase 9: Tratamento de Erros

### 9.1 Tratamento de Erro Generico sem Contexto (Alta Prioridade)

**Problema**: Erro de upload nao diferencia tipos de falha.

**Arquivo**: `web/src/pages/Admin/PropertiesPage/components/CreatePropertyModal/CreatePropertyModal.tsx` (linhas 379-383)

**Solucao**: Melhorar tratamento com mais contexto.

```typescript
// Antes
catch {
  toast.error('Imovel criado, mas houve erro ao enviar algumas fotos')
}

// Depois
catch (error) {
  if (error instanceof UploadSizeError) {
    toast.error(`Arquivo ${error.fileName} excede o tamanho maximo permitido`)
  } else if (error instanceof NetworkError) {
    toast.error('Erro de conexao. Verifique sua internet e tente novamente.')
  } else if (error instanceof ServerError) {
    toast.error('Servidor indisponivel. Tente novamente em alguns instantes.')
  } else {
    toast.error('Imovel criado, mas houve erro ao enviar algumas fotos. Voce pode adiciona-las depois.')
  }
}
```

---

### 9.2 Falta de Validacao de Estado no EditPropertyModal (Media Prioridade)

**Problema**: Modal assume que property existe sem validacao adequada.

**Arquivo**: `web/src/pages/Admin/PropertiesPage/components/EditPropertyModal/EditPropertyModal.tsx`

**Solucao**: Adicionar verificacao e fallback melhor.

```typescript
// Adicionar estado de erro
if (!property && !isLoading) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.errorState}>
        <AlertCircle size={48} />
        <h3>Imovel nao encontrado</h3>
        <p>O imovel que voce esta tentando editar nao existe ou foi removido.</p>
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </Modal>
  )
}
```

---

### 9.3 Falta de Retry Logic para Operacoes de Arquivo (Media Prioridade)

**Problema**: Se upload de documento falha, nao ha retry automatico.

**Arquivo**: `web/src/pages/Admin/PropertyOwnersPage/components/EditPropertyOwnerModal/EditPropertyOwnerModal.tsx`

**Solucao**: Implementar retry com backoff exponencial.

```typescript
// web/src/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

// Uso
const uploadedUrl = await retryWithBackoff(() => uploadFile(file))
```

---

### 9.4 Erros de API sem Diferenciacao por Status Code (Media Prioridade)

**Problema**: Tratamento generico nao diferencia 401, 403, 404, 500.

**Arquivo**: `web/src/queries/properties/useDeletePropertyMutation.ts`

**Solucao**: Diferenciar erros por status code.

```typescript
// web/src/utils/api-error-handler.ts
export function handleApiError(error: unknown): string {
  if (error instanceof HTTPError) {
    switch (error.status) {
      case 401:
        return 'Sua sessao expirou. Faca login novamente.'
      case 403:
        return 'Voce nao tem permissao para realizar esta acao.'
      case 404:
        return 'O recurso solicitado nao foi encontrado.'
      case 422:
        return 'Os dados enviados sao invalidos. Verifique e tente novamente.'
      case 500:
        return 'Erro interno do servidor. Tente novamente mais tarde.'
      default:
        return 'Ocorreu um erro inesperado. Tente novamente.'
    }
  }
  return 'Erro de conexao. Verifique sua internet.'
}
```

---

### 9.5 Falta de Validacao de Permissoes no Cliente (Baixa Prioridade)

**Problema**: Botoes de delete/edit nao verificam permissoes antes de exibir.

**Arquivo**: `web/src/pages/Admin/PropertiesPage/Page.tsx`

**Solucao**: Desabilitar buttons baseado em permissoes do usuario.

```typescript
// Usar contexto de autenticacao
const { user, hasPermission } = useAuth()

// No JSX
<button
  type="button"
  className={styles.iconButton}
  onClick={() => openDeleteDialog(property.id)}
  disabled={!hasPermission('property:delete')}
  title={hasPermission('property:delete') 
    ? 'Excluir imovel' 
    : 'Voce nao tem permissao para excluir imoveis'}
>
  <Trash2 size={16} />
</button>
```

---

## Fase 10: Internacionalizacao (I18N)

### 10.1 Strings Hardcoded em Multiplos Locais (Media Prioridade)

**Problema**: Strings distribuidas em varios arquivos, dificultando manutencao e traducao.

**Arquivos afetados**:
- `web/src/pages/Admin/PropertiesPage/Page.tsx`
- `web/src/pages/Admin/PropertyOwnersPage/Page.tsx`
- Todos os modais de criacao e edicao

**Exemplos encontrados**:
```typescript
// PropertiesPage.tsx (linhas 283-286)
<p className={styles.sectionDescription}>
  {data?.total || 0} {data?.total === 1 ? 'imovel cadastrado' : 'imoveis cadastrados'}
</p>

// PropertiesPage.tsx (linhas 507-509)
title="Erro ao carregar imoveis"
description="Nao foi possivel carregar os imoveis. Tente novamente."
```

**Solucao**: Consolidar strings em arquivos i18n centralizados.

```typescript
// web/src/locales/pt-BR/properties.json
{
  "list": {
    "title": "Imoveis",
    "count": {
      "one": "{{count}} imovel cadastrado",
      "other": "{{count}} imoveis cadastrados"
    },
    "error": {
      "title": "Erro ao carregar imoveis",
      "description": "Nao foi possivel carregar os imoveis. Tente novamente."
    }
  },
  "form": {
    "owner": "Proprietario",
    "type": "Tipo do imovel",
    "title": "Titulo",
    "address": "Endereco"
  }
}

// Uso com i18next
import { useTranslation } from 'react-i18next'

function PropertiesPage() {
  const { t } = useTranslation('properties')
  
  return (
    <p>{t('list.count', { count: data?.total || 0 })}</p>
  )
}
```

---

### 10.2 Labels de Validacao Hardcoded em Schemas (Media Prioridade)

**Problema**: Mensagens de erro em portugues, dificil de traduzir.

**Arquivo**: `web/src/schemas/property.schema.ts`

**Solucao**: Mover para arquivo de traducao e usar funcao auxiliar.

```typescript
// web/src/locales/pt-BR/validation.json
{
  "property": {
    "ownerId": {
      "required": "Proprietario e obrigatorio"
    },
    "title": {
      "min": "Titulo deve ter pelo menos {{min}} caracteres",
      "max": "Titulo deve ter no maximo {{max}} caracteres"
    }
  }
}

// web/src/schemas/property.schema.ts
import i18n from '@/lib/i18n'

const t = (key: string, params?: Record<string, unknown>) => 
  i18n.t(`validation:property.${key}`, params)

export const propertyBaseSchema = z.object({
  ownerId: z.string().min(1, t('ownerId.required')),
  title: z.string()
    .min(3, t('title.min', { min: 3 }))
    .max(200, t('title.max', { max: 200 })),
  // ...
})
```

---

### 10.3 Pluralizacao Manual com Ternarios (Baixa Prioridade)

**Problema**: Logica de pluralizacao hardcoded e repetida.

**Arquivo**: `web/src/pages/Admin/PropertiesPage/Page.tsx` (linha 283-286)

**Solucao**: Usar biblioteca de i18n com suporte a pluralizacao.

```typescript
// i18next suporta pluralizacao nativa
// pt-BR/properties.json
{
  "count_one": "{{count}} imovel cadastrado",
  "count_other": "{{count}} imoveis cadastrados"
}

// Uso
t('count', { count: data?.total || 0 }) // Automaticamente seleciona a forma correta
```

---

## Fase 11: Componentes de UI Reutilizaveis

### 11.1 Componente de Upload Duplicado (Alta Prioridade)

**Problema**: Logica de drag-and-drop, validacao de arquivo, preview duplicada em multiplos modais.

**Locais afetados**:
- `EditPropertyModal.tsx` (linhas 1000-1150) - Upload de fotos
- `CreatePropertyOwnerModal.tsx` (linhas 150-300) - Upload de foto perfil + documentos
- `EditPropertyOwnerModal.tsx` (linhas 200-350) - Similar

**Solucao**: Extrair para componente reutilizavel.

```typescript
// web/src/components/FileUploadZone/FileUploadZone.tsx
import { useCallback, useState } from 'react'
import { Upload, X } from 'lucide-react'
import styles from './FileUploadZone.module.css'

interface FileUploadZoneProps {
  onFiles: (files: File[]) => void
  maxSize: number
  allowedTypes: string[]
  maxFiles?: number
  currentCount?: number
  disabled?: boolean
  label?: string
  hint?: string
}

export function FileUploadZone({
  onFiles,
  maxSize,
  allowedTypes,
  maxFiles = 10,
  currentCount = 0,
  disabled = false,
  label = 'Arraste arquivos ou clique para selecionar',
  hint,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return
    
    const files = Array.from(e.dataTransfer.files)
    validateAndSubmit(files)
  }, [disabled, maxSize, allowedTypes, maxFiles, currentCount])

  const validateAndSubmit = (files: File[]) => {
    setError(null)
    
    const remainingSlots = maxFiles - currentCount
    if (files.length > remainingSlots) {
      setError(`Voce pode adicionar no maximo ${remainingSlots} arquivo(s)`)
      return
    }
    
    const invalidFiles = files.filter(
      file => !allowedTypes.includes(file.type) || file.size > maxSize
    )
    
    if (invalidFiles.length > 0) {
      setError('Alguns arquivos sao invalidos (tipo ou tamanho)')
      return
    }
    
    onFiles(files)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => !disabled && document.getElementById('file-input')?.click()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault()
          document.getElementById('file-input')?.click()
        }
      }}
      aria-label={label}
    >
      <input
        id="file-input"
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={(e) => e.target.files && validateAndSubmit(Array.from(e.target.files))}
        className={styles.hiddenInput}
      />
      <Upload size={32} />
      <p>{label}</p>
      {hint && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
```

---

### 11.2 Componente de Grid de Arquivos (Alta Prioridade)

**Problema**: Mesmo layout para exibicao de multiplos arquivos, duplicado.

**Locais afetados**:
- `EditPropertyModal.tsx` (linhas 1150-1300) - Grid de fotos
- `CreatePropertyOwnerModal.tsx` (linhas 450-550) - Grid de documentos
- `EditPropertyOwnerModal.tsx` (linhas 450-550) - Grid de documentos

**Solucao**: Extrair componente reutilizavel.

```typescript
// web/src/components/FileGrid/FileGrid.tsx
import { Star, Trash2 } from 'lucide-react'
import styles from './FileGrid.module.css'

interface FileItem {
  id: string
  preview: string
  name: string
}

interface FileGridProps {
  files: FileItem[]
  onRemove: (id: string) => void
  onSetPrimary?: (id: string) => void
  primaryId?: string
  disabled?: boolean
}

export function FileGrid({
  files,
  onRemove,
  onSetPrimary,
  primaryId,
  disabled = false,
}: FileGridProps) {
  if (files.length === 0) return null

  return (
    <div className={styles.grid}>
      {files.map((file) => (
        <div key={file.id} className={styles.item}>
          <img src={file.preview} alt={file.name} className={styles.image} />
          <div className={styles.overlay}>
            {onSetPrimary && (
              <button
                type="button"
                className={`${styles.starButton} ${primaryId === file.id ? styles.primary : ''}`}
                onClick={() => onSetPrimary(file.id)}
                disabled={disabled}
                aria-label={primaryId === file.id ? 'Foto principal' : 'Definir como principal'}
              >
                <Star size={16} fill={primaryId === file.id ? 'gold' : 'none'} />
              </button>
            )}
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => onRemove(file.id)}
              disabled={disabled}
              aria-label={`Remover ${file.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
          {primaryId === file.id && (
            <span className={styles.primaryBadge}>Principal</span>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

### 11.3 Componente de AlertBox (Media Prioridade)

**Problema**: Estilos hardcoded em cada arquivo, sem componente reutilizavel.

**Locais afetados**:
- `CreatePropertyModal.tsx` (linhas 595, 850) - `styles.infoBox`
- `EditPropertyModal.tsx` - similar
- `PropertyForm.styles.css.ts` (linhas 99-140) - `infoBox`, `cepAlert`

**Solucao**: Criar componente `AlertBox`.

```typescript
// web/src/components/AlertBox/AlertBox.tsx
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import styles from './AlertBox.module.css'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertBoxProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
}

const icons: Record<AlertVariant, React.ReactNode> = {
  info: <Info size={20} />,
  success: <CheckCircle size={20} />,
  warning: <AlertCircle size={20} />,
  error: <XCircle size={20} />,
}

export function AlertBox({
  variant = 'info',
  title,
  children,
  className,
}: AlertBoxProps) {
  return (
    <div className={`${styles.alertBox} ${styles[variant]} ${className || ''}`}>
      <div className={styles.icon}>{icons[variant]}</div>
      <div className={styles.content}>
        {title && <strong className={styles.title}>{title}</strong>}
        <div className={styles.message}>{children}</div>
      </div>
    </div>
  )
}
```

---

### 11.4 Componente de StatusBadge (Media Prioridade)

**Problema**: Funcoes de mapeamento de classe nao reutilizaveis.

**Locais afetados**:
- `PropertiesPage.tsx` (linhas 455-475) - 3 funcoes `getTypeBadgeClass`, `getListingTypeBadgeClass`, `getStatusBadgeClass`
- `PropertyOwnersPage.tsx` (linhas 300-315) - Badge de CPF/CNPJ

**Solucao**: Criar componente `StatusBadge`.

```typescript
// web/src/components/StatusBadge/StatusBadge.tsx
import styles from './StatusBadge.module.css'

type BadgeCategory = 'propertyType' | 'listingType' | 'status' | 'documentType'

interface StatusBadgeProps {
  category: BadgeCategory
  value: string
  label?: string
}

const categoryStyles: Record<BadgeCategory, Record<string, string>> = {
  propertyType: {
    house: styles.house,
    apartment: styles.apartment,
    land: styles.land,
    commercial: styles.commercial,
    rural: styles.rural,
  },
  listingType: {
    rent: styles.rent,
    sale: styles.sale,
    both: styles.both,
  },
  status: {
    available: styles.available,
    rented: styles.rented,
    sold: styles.sold,
    maintenance: styles.maintenance,
    unavailable: styles.unavailable,
  },
  documentType: {
    cpf: styles.cpf,
    cnpj: styles.cnpj,
  },
}

export function StatusBadge({ category, value, label }: StatusBadgeProps) {
  const variantClass = categoryStyles[category]?.[value] || styles.default
  
  return (
    <span className={`${styles.badge} ${variantClass}`}>
      {label || value}
    </span>
  )
}
```

---

### 11.5 Abstracoes para Wizard Multi-Step (Baixa Prioridade)

**Problema**: Cada modal reimplementa logica de navegacao de steps.

**Locais afetados**:
- `CreatePropertyModal.tsx` - 8 steps
- `EditPropertyModal.tsx` - 8 steps
- `CreatePropertyOwnerModal.tsx` - 5 steps
- `EditPropertyOwnerModal.tsx` - 5 steps

**Solucao**: Criar hook para gerenciamento de steps.

```typescript
// web/src/hooks/useWizardSteps.ts
import { useState, useCallback } from 'react'

interface UseWizardStepsOptions<T> {
  steps: T[]
  initialStep?: number
  validateStep?: (stepIndex: number) => boolean | Promise<boolean>
}

export function useWizardSteps<T>({
  steps,
  initialStep = 0,
  validateStep,
}: UseWizardStepsOptions<T>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep)

  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index)
    }
  }, [steps.length])

  const goToNext = useCallback(async () => {
    if (isLastStep) return false
    
    if (validateStep) {
      const isValid = await validateStep(currentStepIndex)
      if (!isValid) return false
    }
    
    setCurrentStepIndex(prev => prev + 1)
    return true
  }, [isLastStep, validateStep, currentStepIndex])

  const goToPrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }, [isFirstStep])

  const reset = useCallback(() => {
    setCurrentStepIndex(initialStep)
  }, [initialStep])

  return {
    currentStep,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    progress,
    totalSteps: steps.length,
    goToStep,
    goToNext,
    goToPrevious,
    reset,
  }
}
```

---

## Fase 12: Queries e Mutations - Padroes e Consistencia

### 12.1 Queries sem Tratamento de Erro Especifico (Media Prioridade)

**Problema**: Queries muito simples, sem tratamento de erro ou retry adequado.

**Arquivo**: `web/src/queries/properties/usePropertiesQuery.ts`

**Solucao**: Adicionar configuracoes avancadas.

```typescript
// web/src/queries/properties/usePropertiesQuery.ts
export const usePropertiesQuery = (params?: ListPropertiesParams) => {
  return useQuery<ListPropertiesResponse>({
    queryKey: queryKeys.properties.list(params),
    queryFn: () => listProperties(params),
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 5,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    throwOnError: false,
    select: (data) => ({
      ...data,
      properties: data.properties.map(formatPropertyForDisplay),
    }),
  })
}
```

---

### 12.2 Falta de Padrao para Cache Invalidation (Media Prioridade)

**Problema**: Nao ha padrao consistente para invalidar queries apos mutations.

**Arquivos afetados**: Todas as mutations de create/update/delete

**Solucao**: Criar hook utilities.

```typescript
// web/src/queries/properties/usePropertyMutationUtils.ts
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../keys'

export function usePropertyMutationUtils() {
  const queryClient = useQueryClient()

  const invalidateList = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.properties.list() })
  }

  const invalidateById = (id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.properties.detail(id) })
  }

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.properties.all })
  }

  const removeFromCache = (id: string) => {
    queryClient.removeQueries({ queryKey: queryKeys.properties.detail(id) })
  }

  return {
    invalidateList,
    invalidateById,
    invalidateAll,
    removeFromCache,
  }
}
```

---

### 12.3 Falta de Optimistic Updates (Media Prioridade)

**Problema**: UI nao atualiza imediatamente apos acao, espera resposta do servidor.

**Arquivos afetados**: Todas as mutations

**Solucao**: Implementar optimistic updates com rollback.

```typescript
// web/src/queries/properties/useDeletePropertyMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteProperty } from '@/services/api/properties'
import { queryKeys } from '../keys'
import type { ListPropertiesResponse } from '@/types/property.types'

export function useDeletePropertyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProperty,
    onMutate: async (id: string) => {
      // Cancelar queries em flight
      await queryClient.cancelQueries({ queryKey: queryKeys.properties.list() })

      // Snapshot do estado antigo
      const previousData = queryClient.getQueryData<ListPropertiesResponse>(
        queryKeys.properties.list()
      )

      // Atualizar otimisticamente
      queryClient.setQueryData<ListPropertiesResponse>(
        queryKeys.properties.list(),
        (old) => {
          if (!old) return old
          return {
            ...old,
            properties: old.properties.filter((p) => p.id !== id),
            total: old.total - 1,
          }
        }
      )

      return { previousData }
    },
    onError: (err, id, context) => {
      // Rollback em caso de erro
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.properties.list(),
          context.previousData
        )
      }
    },
    onSettled: () => {
      // Sempre revalidar para garantir consistencia
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.list() })
    },
  })
}
```

---

### 12.4 Falta de Loading States Granulares (Baixa Prioridade)

**Problema**: Usa `isLoading` global, nao diferencia entre carregamento da lista e acoes.

**Arquivo**: `web/src/pages/Admin/PropertiesPage/Page.tsx`

**Solucao**: Usar estados mais granulares.

```typescript
// Usar estados especificos de cada mutation/query
const { isLoading: isLoadingList } = usePropertiesQuery(params)
const { isPending: isDeleting } = deleteMutation
const { isPending: isCreating } = createMutation

// No JSX
<Button disabled={isDeleting} loading={isDeleting}>
  {isDeleting ? 'Excluindo...' : 'Excluir'}
</Button>
```

---

### 12.5 Falta de Retry Logic Configuravel (Baixa Prioridade)

**Problema**: Sem retry automatico para falhas de rede.

**Solucao**: Adicionar em react-query config global.

```typescript
// web/src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 2, // 2 minutos
      gcTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
})
```

---

## Fase 13: Seguranca

### 13.1 Validacao de Tamanho de Arquivo Apenas no Cliente (Alta Prioridade)

**Problema**: `MAX_FILE_SIZE`, `PHOTO_MAX_SIZE` verificados apenas no client.

**Arquivos**: `CreatePropertyModal.tsx`, `CreatePropertyOwnerModal.tsx`

**Solucao**: Garantir validacao tambem no servidor.

```typescript
// api/src/controllers/routes/properties/photos/upload/upload.ts
import { t, Elysia } from 'elysia'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const uploadPhotoRoute = new Elysia().post(
  '/properties/:id/photos',
  async ({ params, body, set }) => {
    const file = body.file
    
    // Validacao no servidor
    if (file.size > MAX_FILE_SIZE) {
      set.status = 413
      return { error: 'Arquivo excede o tamanho maximo permitido (5MB)' }
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      set.status = 415
      return { error: 'Tipo de arquivo nao permitido' }
    }
    
    // ... continuar upload
  },
  {
    body: t.Object({
      file: t.File(),
    }),
  }
)
```

---

### 13.2 Falta de Sanitizacao de Nomes de Arquivo (Alta Prioridade)

**Problema**: Nome do arquivo usado diretamente sem sanitizacao.

**Arquivo**: `CreatePropertyModal.tsx` (linhas 300-350)

**Solucao**: Sanitizar nome antes de enviar ou usar UUID.

```typescript
// web/src/utils/file.ts
export function sanitizeFileName(fileName: string): string {
  // Remove caracteres especiais e espacos
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais
    .replace(/_+/g, '_') // Remove underscores duplicados
    .toLowerCase()
}

// Ou usar UUID para evitar conflitos
import { v4 as uuidv4 } from 'uuid'

export function generateUniqueFileName(originalName: string): string {
  const extension = originalName.split('.').pop()
  return `${uuidv4()}.${extension}`
}
```

---

## Fase 14: Plano de Implementacao Atualizado

### Prioridade 1 - Critico (Semana 1-2)

| Item | Descricao | Esforco | Arquivos |
|------|-----------|---------|----------|
| 1.1 | Extrair schemas Zod duplicados | 2h | property.schema.ts, property-owner.schema.ts |
| 1.2 | Criar hook useCepLookup | 1h | useCepLookup.ts |
| 1.3 | Extrair propertyFeaturesSchema no backend | 30min | features.schema.ts |
| 7.1 | Testes unitarios para funcoes de negocio | 4h | *.unit.test.ts |
| 8.1-8.3 | Correcoes de acessibilidade criticas | 2h | Todos os modais e paginas |
| 9.1 | Melhorar tratamento de erro de upload | 1h | CreatePropertyModal.tsx |
| 13.1-13.2 | Validacao de arquivo no servidor + sanitizacao | 2h | upload.ts, file.ts |

### Prioridade 2 - Importante (Semana 3-4)

| Item | Descricao | Esforco | Arquivos |
|------|-----------|---------|----------|
| 1.4-1.7 | Centralizar constantes e utilitarios | 2h | constants/, utils/ |
| 3.5 | Adicionar debounce na busca | 30min | PropertiesPage.tsx, PropertyOwnersPage.tsx |
| 7.2 | Testes de manipulacao de fotos | 3h | PhotoManagement.test.tsx |
| 8.4-8.5 | Focus trap e aria-live | 2h | Modais |
| 9.2-9.4 | Melhorar tratamento de erros | 3h | Varios |
| 11.1-11.2 | Componentes FileUploadZone e FileGrid | 4h | components/ |
| 12.1-12.3 | Melhorar queries e mutations | 3h | queries/ |

### Prioridade 3 - Melhorias (Semana 5-6)

| Item | Descricao | Esforco | Arquivos |
|------|-----------|---------|----------|
| 2.1-2.5 | Remover useCallbacks desnecessarios | 2h | Todos os componentes |
| 4.1 | Criar componente FeatureCheckbox | 2h | FeatureCheckbox.tsx |
| 4.2 | Criar hook usePhotoUpload | 3h | usePhotoUpload.ts |
| 7.3 | Testes de validacao de schemas | 2h | property.schema.test.ts |
| 10.1-10.3 | Internacionalizacao inicial | 8h | locales/, componentes |
| 11.3-11.4 | Componentes AlertBox e StatusBadge | 2h | components/ |

### Prioridade 4 - Nice to Have (Backlog)

| Item | Descricao | Esforco |
|------|-----------|---------|
| 4.3 | Criar hook useUrlFilters | 2h |
| 4.4 | Melhorar tipagem com validacao de URL params | 1h |
| 5.3 | Revisar indices do banco de dados | 1h |
| 9.5 | Validacao de permissoes no cliente | 2h |
| 11.5 | Hook useWizardSteps | 2h |
| 12.4-12.5 | Loading states granulares e retry global | 2h |

---

## Metricas de Sucesso Atualizadas

Apos implementar todas as melhorias:

| Metrica | Antes | Depois |
|---------|-------|--------|
| Linhas de codigo duplicado | ~800 | ~200 |
| Cobertura de testes | 45% | 75% |
| Violacoes de A11Y | 15+ | 0 |
| Strings hardcoded | 200+ | 0 (via i18n) |
| Componentes reutilizaveis | 3 | 10+ |
| Re-renders desnecessarios | Alto | Baixo |

---

## Arquivos Criados/Modificados (Atualizado)

### Novos Arquivos

**Schemas e Validacao**
- `web/src/schemas/property.schema.ts`
- `web/src/schemas/property-owner.schema.ts`
- `api/src/controllers/routes/properties/shared/features.schema.ts`

**Hooks**
- `web/src/hooks/useCepLookup.ts`
- `web/src/hooks/useMaskedInput.ts`
- `web/src/hooks/usePhotoUpload.ts`
- `web/src/hooks/useUrlFilters.ts`
- `web/src/hooks/useWizardSteps.ts`

**Utilitarios**
- `web/src/utils/pagination.ts`
- `web/src/utils/retry.ts`
- `web/src/utils/file.ts`
- `web/src/utils/api-error-handler.ts`

**Constantes**
- `web/src/constants/property.constants.ts`
- `web/src/constants/wizard-steps.ts`

**Componentes**
- `web/src/components/FeatureCheckbox/FeatureCheckbox.tsx`
- `web/src/components/FileUploadZone/FileUploadZone.tsx`
- `web/src/components/FileGrid/FileGrid.tsx`
- `web/src/components/AlertBox/AlertBox.tsx`
- `web/src/components/StatusBadge/StatusBadge.tsx`

**Queries**
- `web/src/queries/properties/usePropertyMutationUtils.ts`

**i18n**
- `web/src/locales/pt-BR/properties.json`
- `web/src/locales/pt-BR/property-owners.json`
- `web/src/locales/pt-BR/validation.json`

**Testes**
- `api/src/controllers/routes/properties/list/__tests__/list.unit.test.ts`
- `web/src/pages/Admin/PropertiesPage/components/EditPropertyModal/__tests__/PhotoManagement.test.tsx`
- `web/src/schemas/__tests__/property.schema.test.ts`

### Arquivos Modificados

- `web/src/pages/Admin/PropertiesPage/Page.tsx`
- `web/src/pages/Admin/PropertyOwnersPage/Page.tsx`
- `web/src/pages/Admin/PropertiesPage/components/CreatePropertyModal/CreatePropertyModal.tsx`
- `web/src/pages/Admin/PropertiesPage/components/EditPropertyModal/EditPropertyModal.tsx`
- `web/src/pages/Admin/PropertyOwnersPage/components/CreatePropertyOwnerModal/CreatePropertyOwnerModal.tsx`
- `web/src/pages/Admin/PropertyOwnersPage/components/EditPropertyOwnerModal/EditPropertyOwnerModal.tsx`
- `web/src/queries/properties/usePropertiesQuery.ts`
- `web/src/queries/properties/usePropertyQuery.ts`
- `web/src/queries/properties/useDeletePropertyMutation.ts`
- `web/src/queries/property-owners/usePropertyOwnersQuery.ts`
- `web/src/lib/query-client.ts`
- `api/src/controllers/routes/properties/create/schema.ts`
- `api/src/controllers/routes/properties/update/schema.ts`
- `api/src/controllers/routes/properties/photos/upload/upload.ts`

**Solucao**: Criar schema compartilhado.

```typescript
// api/src/controllers/routes/properties/shared/features.schema.ts
import { t } from 'elysia'

export const propertyFeaturesSchema = t.Object({
  hasPool: t.Optional(t.Boolean()),
  hasGarden: t.Optional(t.Boolean()),
  hasGarage: t.Optional(t.Boolean()),
  hasElevator: t.Optional(t.Boolean()),
  hasGym: t.Optional(t.Boolean()),
  hasPlayground: t.Optional(t.Boolean()),
  hasSecurity: t.Optional(t.Boolean()),
  hasAirConditioning: t.Optional(t.Boolean()),
  hasFurnished: t.Optional(t.Boolean()),
  hasPetFriendly: t.Optional(t.Boolean()),
  hasBalcony: t.Optional(t.Boolean()),
  hasBarbecue: t.Optional(t.Boolean()),
})
```

---

## Fase 2: Problemas de Performance (useCallback, useEffect, useMemo)

### 2.1 useCallbacks Desnecessarios (Alta Prioridade)

**Problema**: Varios `useCallback` sao usados para funcoes que nao precisam de memoizacao, pois nao sao passadas como props para componentes filhos memoizados.

**Arquivos afetados**:
- `PropertiesPage.tsx`: `handleConfirmDelete`, `closeModal`
- `PropertyOwnersPage.tsx`: `handleConfirmDelete`, `closeModal`
- Todos os modais: Varios handlers

**Exemplo problematico** (`PropertiesPage.tsx:202-210`):
```typescript
// DESNECESSARIO: setSearchParams ja e estavel e nao ha componentes memoizados filhos
const closeModal = useCallback(() => {
  setSearchParams((prevParams) => {
    const newParams = new URLSearchParams(prevParams)
    newParams.delete('modal')
    newParams.delete('id')
    return newParams
  })
  setPropertyToDelete(null)
}, [setSearchParams])
```

**Solucao**: Remover `useCallback` quando:
1. A funcao nao e passada como prop para componentes memoizados (`React.memo`)
2. A funcao nao e usada como dependencia de outro hook

**Funcoes que podem perder o `useCallback`**:
- `updateSearchParams` - funcao local nao passada como prop
- `clearAllFilters` - funcao local nao passada como prop
- `handleSort` - funcao local nao passada como prop
- `openCreateModal` - funcao local nao passada como prop
- `viewPropertyDetails` - funcao local nao passada como prop
- `openEditModal` - funcao local nao passada como prop
- `openDeleteDialog` - funcao local nao passada como prop

---

### 2.2 useEffect com Reset Desnecessario (Media Prioridade)

**Problema**: useEffect que reseta o step quando o modal abre, mas poderia ser tratado de forma mais simples.

**Arquivo**: `CreatePropertyModal.tsx:196-200`
```typescript
useEffect(() => {
  if (isOpen) {
    setCurrentStep(0)
  }
}, [isOpen])
```

**Solucao**: Mover a logica para `handleClose` e garantir que o estado seja resetado la, evitando o useEffect.

---

### 2.3 watch() Multiplos sem Memoizacao (Media Prioridade)

**Problema**: Chamadas multiplas a `watch()` no render podem causar re-renders desnecessarios.

**Exemplo** (`CreatePropertyModal.tsx`):
```typescript
const listingType = watch('listingType')
const propertyType = watch('type')
const notesValue = watch('notes') || ''
const selectedOwnerId = watch('ownerId')
```

E depois no JSX:
```typescript
{watch('hasPool') ? styles.featureCheckboxChecked : ''}
{watch('hasGarden') ? styles.featureCheckboxChecked : ''}
// ... mais 10 vezes
```

**Solucao**: Usar `useWatch` com array de campos ou `formState.watch` uma unica vez.

```typescript
// Melhor abordagem
const watchedFields = watch(['hasPool', 'hasGarden', 'hasGarage', /* ... */])

// Ou usar getValues para valores que nao precisam ser reativos
const features = getValues(['hasPool', 'hasGarden', /* ... */])
```

---

### 2.4 staleTime: 0 nas Queries (Media Prioridade)

**Problema**: As queries estao configuradas com `staleTime: 0`, o que forca refetch em toda navegacao.

**Arquivo**: `web/src/queries/properties/usePropertiesQuery.ts:31`
```typescript
staleTime: 0,
```

**Impacto**: Requisicoes desnecessarias ao backend quando o usuario navega entre paginas.

**Solucao**: Definir `staleTime` adequado baseado na natureza dos dados.

```typescript
// Sugestao
staleTime: 1000 * 60 * 2, // 2 minutos para listas
// ou
staleTime: 1000 * 30, // 30 segundos se os dados mudam frequentemente
```

---

### 2.5 Funcoes Inline em JSX (Baixa Prioridade)

**Problema**: Handlers inline criados em cada render.

**Exemplo** (`PropertiesPage.tsx`):
```typescript
onChange={(e) => {
  updateSearchParams({ search: e.target.value, page: '1' })
}}
```

**Impacto**: Baixo para inputs controlados, mas pode ser otimizado em listas longas.

**Solucao**: Para casos criticos, extrair handlers. Para inputs simples, manter inline e aceitavel.

---

## Fase 3: Bugs Potenciais e Validacoes

### 3.1 Race Condition no Upload de Fotos (Alta Prioridade)

**Problema**: Se o usuario fechar o modal durante o upload, as URLs de preview nao sao revogadas corretamente.

**Arquivo**: `CreatePropertyModal.tsx:364-372`
```typescript
const handleClose = useCallback(() => {
  if (!createMutation.isPending && !isUploading) {
    for (const photo of selectedPhotos) {
      URL.revokeObjectURL(photo.preview)
    }
    // ...
  }
}, [createMutation.isPending, isUploading, selectedPhotos, reset, onClose])
```

**Problema**: Se `isUploading` for `true`, o modal nao fecha e as URLs nunca sao limpas se o usuario forcar o fechamento (ex: navegando para outra pagina).

**Solucao**: Adicionar cleanup no useEffect de unmount.

```typescript
useEffect(() => {
  return () => {
    // Cleanup ao desmontar
    for (const photo of selectedPhotos) {
      URL.revokeObjectURL(photo.preview)
    }
  }
}, []) // Intencional: apenas no unmount
```

---

### 3.2 Validacao de Preco Inconsistente (Media Prioridade)

**Problema**: A validacao de preco usa `getCurrencyRawValue` que pode retornar 0 para valores invalidos, fazendo a validacao passar.

**Arquivo**: `CreatePropertyModal.tsx:85-98`

**Solucao**: Validar se o valor existe antes de converter.

```typescript
.refine(
  (data) => {
    if (data.listingType === 'rent' || data.listingType === 'both') {
      if (!data.rentalPrice || data.rentalPrice.trim() === '') return false
      const rentalValue = getCurrencyRawValue(data.rentalPrice)
      return rentalValue > 0
    }
    return true
  },
  // ...
)
```

---

### 3.3 Potencial Null Reference no Property Delete (Baixa Prioridade)

**Problema**: `propertyToDelete?.id` pode ser undefined em cenarios de race condition.

**Arquivo**: `PropertiesPage.tsx:212-221`
```typescript
const handleConfirmDelete = useCallback(async () => {
  if (!propertyToDelete?.id) return
  // ...
}, [propertyToDelete?.id, deleteMutation, closeModal])
```

**Status**: Ja tratado com early return, mas poderia ser mais robusto.

---

### 3.4 Estado de Modal Inconsistente (Media Prioridade)

**Problema**: Se a URL for manipulada manualmente (ex: usuario edita `?modal=edit&id=invalid`), o sistema tenta buscar um ID invalido.

**Arquivo**: `PropertiesPage.tsx:163-165`
```typescript
const { data: editPropertyData, isLoading: isLoadingProperty } = usePropertyQuery(editId || '', {
  enabled: isEditModalOpen,
})
```

**Solucao**: Adicionar validacao de UUID ou tratamento de erro.

---

### 3.5 Falta de Debounce na Busca (Media Prioridade)

**Problema**: Cada tecla digitada no campo de busca dispara uma atualizacao de URL e potencialmente uma nova query.

**Arquivo**: `PropertiesPage.tsx:307-312`
```typescript
<Input
  value={search}
  onChange={(e) => {
    updateSearchParams({ search: e.target.value, page: '1' })
  }}
/>
```

**Solucao**: Implementar debounce.

```typescript
// Usar hook de debounce ou biblioteca
import { useDebouncedCallback } from 'use-debounce'

const debouncedSearch = useDebouncedCallback((value: string) => {
  updateSearchParams({ search: value, page: '1' })
}, 300)

// No Input
onChange={(e) => debouncedSearch(e.target.value)}
```

---

## Fase 4: Melhorias de Codigo e Boas Praticas

### 4.1 Componentes de Feature Checkbox Reutilizaveis (Alta Prioridade)

**Problema**: O grid de features tem muito codigo repetitivo.

**Arquivo**: `CreatePropertyModal.tsx` e `EditPropertyModal.tsx` (cerca de 200 linhas cada)

**Solucao**: Criar componente reutilizavel.

```typescript
// web/src/components/FeatureCheckbox/FeatureCheckbox.tsx
interface FeatureCheckboxProps {
  name: string
  label: string
  icon: React.ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function FeatureCheckbox({ 
  name, 
  label, 
  icon, 
  checked, 
  onChange, 
  disabled 
}: FeatureCheckboxProps) {
  return (
    <label className={`${styles.featureCheckbox} ${checked ? styles.featureCheckboxChecked : ''}`}>
      <input
        type="checkbox"
        className={styles.checkbox}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      {icon}
      <span className={styles.featureLabel}>{label}</span>
    </label>
  )
}

// Constante com todas as features
export const PROPERTY_FEATURES = [
  { key: 'hasPool', label: 'Piscina', icon: <Waves size={28} /> },
  { key: 'hasGarden', label: 'Jardim', icon: <Flower2 size={28} /> },
  // ... demais features
]
```

---

### 4.2 Separar Logica de Upload em Hook (Alta Prioridade)

**Problema**: Logica de upload de fotos misturada com logica do formulario.

**Arquivos**: `CreatePropertyModal.tsx`, `EditPropertyModal.tsx`

**Solucao**: Criar hook dedicado.

```typescript
// web/src/hooks/usePhotoUpload.ts
interface UsePhotoUploadOptions {
  maxPhotos?: number
  maxFileSize?: number
  allowedTypes?: string[]
}

interface UsePhotoUploadReturn {
  photos: SelectedPhoto[]
  addPhotos: (files: FileList) => void
  removePhoto: (id: string) => void
  setPrimaryPhoto: (id: string) => void
  clearPhotos: () => void
  uploadPhotos: (propertyId: string) => Promise<BatchRegisterPhotoItem[]>
  isUploading: boolean
}

export function usePhotoUpload(options: UsePhotoUploadOptions = {}): UsePhotoUploadReturn {
  // Implementacao...
}
```

---

### 4.3 Extrair Logica de Filtros em Hook (Media Prioridade)

**Problema**: Logica de filtros com URL duplicada entre `PropertiesPage` e `PropertyOwnersPage`.

**Solucao**: Criar hook generico para filtros URL-based.

```typescript
// web/src/hooks/useUrlFilters.ts
interface UseUrlFiltersOptions<T> {
  defaultValues: T
  parseValue?: (key: keyof T, value: string) => T[keyof T]
}

export function useUrlFilters<T extends Record<string, unknown>>(
  options: UseUrlFiltersOptions<T>
) {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const filters = useMemo(() => {
    // Parse filters from URL
  }, [searchParams])
  
  const updateFilter = useCallback((key: keyof T, value: T[keyof T]) => {
    // Update single filter
  }, [setSearchParams])
  
  const updateFilters = useCallback((updates: Partial<T>) => {
    // Update multiple filters
  }, [setSearchParams])
  
  const clearFilters = useCallback(() => {
    // Clear all filters
  }, [setSearchParams])
  
  return { filters, updateFilter, updateFilters, clearFilters }
}
```

---

### 4.4 Tipagem Mais Estrita (Baixa Prioridade)

**Problema**: Alguns tipos usam `string` quando poderiam usar union types.

**Exemplo**:
```typescript
// Atual
const sortBy = (searchParams.get('sortBy') as PropertySortBy) || 'title'

// Melhor - validar se e um valor valido
const VALID_SORT_BY = ['title', 'createdAt', 'rentalPrice', 'salePrice', 'city', 'area'] as const
const sortByParam = searchParams.get('sortBy')
const sortBy: PropertySortBy = VALID_SORT_BY.includes(sortByParam as PropertySortBy) 
  ? (sortByParam as PropertySortBy) 
  : 'title'
```

---

## Fase 5: Melhorias de Performance no Backend

### 5.1 N+1 Query na Listagem de Imoveis (Alta Prioridade)

**Problema**: A query de listagem de imoveis faz joins eficientes, mas a query de proprietarios pode ter N+1.

**Arquivo**: `api/src/repositories/providers/drizzle/property-owner.repository.ts`

**Analise**: O repositorio ja usa subquery para contar propriedades, o que e bom. Verificar se ha outros pontos de N+1.

---

### 5.2 Cache de Dados Estaticos (Media Prioridade)

**Problema**: Constantes como `BRAZILIAN_STATES` sao carregadas do frontend, mas poderiam ser cacheadas.

**Arquivo**: `web/src/types/property-owner.types.ts`

**Sugestao**: Manter como esta (constantes no frontend) e bom para dados que raramente mudam.

---

### 5.3 Indices no Banco de Dados (Media Prioridade)

**Verificar se existem indices para**:
- `properties.ownerId` (FK - geralmente indexado automaticamente)
- `properties.status` + `properties.isMarketplace` (filtros comuns)
- `properties.city`, `properties.state` (filtros de localizacao)
- `property_owners.document` (busca por CPF/CNPJ)

---

### 5.4 Otimizacao de Contagem Total (Baixa Prioridade)

**Problema**: A contagem total e feita separadamente da query de dados.

**Arquivo**: `api/src/repositories/providers/drizzle/property.repository.ts`

**Atual**:
```typescript
const [properties, countResult] = await Promise.all([
  // Query de dados
  // Query de contagem
])
```

**Status**: Ja otimizado com Promise.all. OK.

---

## Fase 6: Plano de Implementacao

### Prioridade 1 - Critico (Semana 1)

1. **Extrair schemas Zod duplicados** (1-2 horas)
   - Criar `web/src/schemas/property.schema.ts`
   - Criar `web/src/schemas/property-owner.schema.ts`
   - Atualizar imports nos modais

2. **Criar hook `useCepLookup`** (1 hora)
   - Criar `web/src/hooks/useCepLookup.ts`
   - Refatorar os 4 modais para usar o hook

3. **Extrair `propertyFeaturesSchema` no backend** (30 min)
   - Criar arquivo compartilhado
   - Atualizar imports

### Prioridade 2 - Importante (Semana 2)

4. **Centralizar constantes** (1-2 horas)
   - Criar `web/src/constants/property.constants.ts`
   - Criar `web/src/constants/wizard-steps.ts`
   - Atualizar imports

5. **Extrair `getPaginationPages`** (30 min)
   - Criar `web/src/utils/pagination.ts`
   - Atualizar `PropertiesPage` e `PropertyOwnersPage`

6. **Adicionar debounce na busca** (30 min)
   - Instalar/usar biblioteca de debounce
   - Atualizar campos de busca

7. **Ajustar staleTime nas queries** (30 min)
   - Revisar todas as queries
   - Definir valores adequados

### Prioridade 3 - Melhorias (Semana 3)

8. **Criar componente `FeatureCheckbox`** (1-2 horas)
   - Criar componente
   - Refatorar modais de imoveis

9. **Criar hook `usePhotoUpload`** (2-3 horas)
   - Extrair logica de upload
   - Refatorar modais

10. **Remover useCallbacks desnecessarios** (1 hora)
    - Revisar cada componente
    - Remover memoizacoes desnecessarias

11. **Adicionar cleanup de blob URLs** (30 min)
    - Adicionar useEffect de cleanup
    - Testar cenarios de fechamento

### Prioridade 4 - Nice to Have (Backlog)

12. **Criar hook `useUrlFilters`**
13. **Melhorar tipagem com validacao de URL params**
14. **Revisar indices do banco de dados**
15. **Criar testes para hooks extraidos**

---

## Metricas de Sucesso

Apos implementar as melhorias:

1. **Reducao de codigo duplicado**: ~40% menos linhas nos modais
2. **Melhoria de performance**: Menos re-renders com staleTime adequado
3. **Manutenibilidade**: Alteracoes em schemas/constantes em um unico lugar
4. **Developer Experience**: Hooks reutilizaveis para novos features

---

## Arquivos Criados/Modificados

### Novos Arquivos
- `web/src/schemas/property.schema.ts`
- `web/src/schemas/property-owner.schema.ts`
- `web/src/hooks/useCepLookup.ts`
- `web/src/hooks/useMaskedInput.ts`
- `web/src/hooks/usePhotoUpload.ts`
- `web/src/hooks/useUrlFilters.ts`
- `web/src/utils/pagination.ts`
- `web/src/constants/property.constants.ts`
- `web/src/constants/wizard-steps.ts`
- `web/src/components/FeatureCheckbox/FeatureCheckbox.tsx`
- `api/src/controllers/routes/properties/shared/features.schema.ts`

### Arquivos Modificados
- `web/src/pages/Admin/PropertiesPage/Page.tsx`
- `web/src/pages/Admin/PropertyOwnersPage/Page.tsx`
- `web/src/pages/Admin/PropertiesPage/components/CreatePropertyModal/CreatePropertyModal.tsx`
- `web/src/pages/Admin/PropertiesPage/components/EditPropertyModal/EditPropertyModal.tsx`
- `web/src/pages/Admin/PropertyOwnersPage/components/CreatePropertyOwnerModal/CreatePropertyOwnerModal.tsx`
- `web/src/pages/Admin/PropertyOwnersPage/components/EditPropertyOwnerModal/EditPropertyOwnerModal.tsx`
- `web/src/queries/properties/usePropertiesQuery.ts`
- `web/src/queries/properties/usePropertyQuery.ts`
- `web/src/queries/property-owners/usePropertyOwnersQuery.ts`
- `api/src/controllers/routes/properties/create/schema.ts`
- `api/src/controllers/routes/properties/update/schema.ts`
