# Review Completo: Fluxos de Imoveis e Proprietarios

Este documento contem uma analise detalhada dos fluxos de imoveis e proprietarios, identificando oportunidades de melhorias de codigo, performance, bugs potenciais e codigo reutilizavel.

---

## Sumario

- [Fase 1: Codigo Duplicado e Oportunidades de Reutilizacao](#fase-1-codigo-duplicado-e-oportunidades-de-reutilizacao)
- [Fase 2: Problemas de Performance (useCallback, useEffect, useMemo)](#fase-2-problemas-de-performance-usecallback-useeffect-usememo)
- [Fase 3: Bugs Potenciais e Validacoes](#fase-3-bugs-potenciais-e-validacoes)
- [Fase 4: Melhorias de Codigo e Boas Praticas](#fase-4-melhorias-de-codigo-e-boas-praticas)
- [Fase 5: Melhorias de Performance no Backend](#fase-5-melhorias-de-performance-no-backend)
- [Fase 6: Plano de Implementacao](#fase-6-plano-de-implementacao)

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
