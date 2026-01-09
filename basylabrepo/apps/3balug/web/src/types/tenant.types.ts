export type MaritalStatus = 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel'

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
	solteiro: 'Solteiro(a)',
	casado: 'Casado(a)',
	divorciado: 'Divorciado(a)',
	viuvo: 'Viuvo(a)',
	uniao_estavel: 'Uniao Estavel',
}

export const MARITAL_STATUS_OPTIONS: { value: MaritalStatus; label: string }[] = [
	{ value: 'solteiro', label: 'Solteiro(a)' },
	{ value: 'casado', label: 'Casado(a)' },
	{ value: 'divorciado', label: 'Divorciado(a)' },
	{ value: 'viuvo', label: 'Viuvo(a)' },
	{ value: 'uniao_estavel', label: 'Uniao Estavel' },
]

export type BrazilianState =
	| 'AC'
	| 'AL'
	| 'AP'
	| 'AM'
	| 'BA'
	| 'CE'
	| 'DF'
	| 'ES'
	| 'GO'
	| 'MA'
	| 'MT'
	| 'MS'
	| 'MG'
	| 'PA'
	| 'PB'
	| 'PR'
	| 'PE'
	| 'PI'
	| 'RJ'
	| 'RN'
	| 'RS'
	| 'RO'
	| 'RR'
	| 'SC'
	| 'SP'
	| 'SE'
	| 'TO'

export const BRAZILIAN_STATES: { value: BrazilianState; label: string }[] = [
	{ value: 'AC', label: 'AC' },
	{ value: 'AL', label: 'AL' },
	{ value: 'AM', label: 'AM' },
	{ value: 'AP', label: 'AP' },
	{ value: 'BA', label: 'BA' },
	{ value: 'CE', label: 'CE' },
	{ value: 'DF', label: 'DF' },
	{ value: 'ES', label: 'ES' },
	{ value: 'GO', label: 'GO' },
	{ value: 'MA', label: 'MA' },
	{ value: 'MG', label: 'MG' },
	{ value: 'MS', label: 'MS' },
	{ value: 'MT', label: 'MT' },
	{ value: 'PA', label: 'PA' },
	{ value: 'PB', label: 'PB' },
	{ value: 'PE', label: 'PE' },
	{ value: 'PI', label: 'PI' },
	{ value: 'PR', label: 'PR' },
	{ value: 'RJ', label: 'RJ' },
	{ value: 'RN', label: 'RN' },
	{ value: 'RO', label: 'RO' },
	{ value: 'RR', label: 'RR' },
	{ value: 'RS', label: 'RS' },
	{ value: 'SC', label: 'SC' },
	{ value: 'SE', label: 'SE' },
	{ value: 'SP', label: 'SP' },
	{ value: 'TO', label: 'TO' },
]

export interface Tenant {
	id: string
	name: string
	cpf: string
	email: string | null
	phone: string | null
	address: string | null
	city: string | null
	state: string | null
	zipCode: string | null
	birthDate: string | null
	monthlyIncome: number | null
	employer: string | null
	emergencyContact: string | null
	emergencyPhone: string | null
	rg: string | null
	nationality: string | null
	maritalStatus: MaritalStatus | null
	profession: string | null
	photoUrl: string | null
	notes: string | null
	createdAt: string
	updatedAt: string
}

export interface CreateTenantInput {
	name: string
	cpf: string
	email?: string
	phone?: string
	address?: string
	city?: string
	state?: string
	zipCode?: string
	birthDate?: string
	monthlyIncome?: number
	employer?: string
	emergencyContact?: string
	emergencyPhone?: string
	rg?: string
	nationality?: string
	maritalStatus?: MaritalStatus
	profession?: string
	photoUrl?: string
	notes?: string
}

export interface UpdateTenantInput {
	name?: string
	cpf?: string
	email?: string | null
	phone?: string | null
	address?: string | null
	city?: string | null
	state?: string | null
	zipCode?: string | null
	birthDate?: string | null
	monthlyIncome?: number | null
	employer?: string | null
	emergencyContact?: string | null
	emergencyPhone?: string | null
	rg?: string | null
	nationality?: string | null
	maritalStatus?: MaritalStatus | null
	profession?: string | null
	photoUrl?: string | null
	notes?: string | null
}

export type TenantSortBy = 'name' | 'createdAt' | 'monthlyIncome' | 'city' | 'state'
export type TenantSortOrder = 'asc' | 'desc'

export interface ListTenantsParams {
	search?: string
	state?: string
	city?: string
	hasEmail?: boolean
	hasPhone?: boolean
	minIncome?: number
	maxIncome?: number
	maritalStatus?: MaritalStatus
	createdAtStart?: string
	createdAtEnd?: string
	sortBy?: TenantSortBy
	sortOrder?: TenantSortOrder
	page?: number
	limit?: number
}

export interface ListTenantsApiResponse {
	data: Tenant[]
	total: number
	limit: number
	offset: number
}

export interface ListTenantsResponse {
	data: Tenant[]
	total: number
	page: number
	limit: number
	totalPages: number
}
