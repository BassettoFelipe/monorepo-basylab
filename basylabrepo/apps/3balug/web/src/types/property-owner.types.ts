export type DocumentType = 'cpf' | 'cnpj'

export type MaritalStatus = 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel'

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
	solteiro: 'Solteiro(a)',
	casado: 'Casado(a)',
	divorciado: 'Divorciado(a)',
	viuvo: 'Viuvo(a)',
	uniao_estavel: 'Uniao Estavel',
}

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

export interface PropertyOwner {
	id: string
	name: string
	documentType: DocumentType
	document: string
	rg: string | null
	nationality: string | null
	maritalStatus: MaritalStatus | null
	profession: string | null
	email: string | null
	phone: string | null
	phoneSecondary: string | null
	address: string | null
	addressNumber: string | null
	addressComplement: string | null
	neighborhood: string | null
	city: string | null
	state: string | null
	zipCode: string | null
	birthDate: string | null
	photoUrl: string | null
	notes: string | null
	createdAt: string
	updatedAt?: string
	propertiesCount?: number
}

export interface CreatePropertyOwnerInput {
	name: string
	documentType: DocumentType
	document: string
	rg?: string
	nationality?: string
	maritalStatus?: MaritalStatus
	profession?: string
	email?: string
	phone?: string
	phoneSecondary?: string
	address?: string
	addressNumber?: string
	addressComplement?: string
	neighborhood?: string
	city?: string
	state?: string
	zipCode?: string
	birthDate?: string
	photoUrl?: string
	notes?: string
}

export interface UpdatePropertyOwnerInput {
	name?: string
	documentType?: DocumentType
	document?: string
	rg?: string | null
	nationality?: string | null
	maritalStatus?: MaritalStatus | null
	profession?: string | null
	email?: string | null
	phone?: string | null
	phoneSecondary?: string | null
	address?: string | null
	addressNumber?: string | null
	addressComplement?: string | null
	neighborhood?: string | null
	city?: string | null
	state?: string | null
	zipCode?: string | null
	birthDate?: string | null
	photoUrl?: string | null
	notes?: string | null
}

export type PropertyOwnerSortBy = 'name' | 'createdAt' | 'propertiesCount' | 'city' | 'state'
export type PropertyOwnerSortOrder = 'asc' | 'desc'

export interface ListPropertyOwnersParams {
	search?: string
	documentType?: DocumentType
	state?: string
	city?: string
	hasProperties?: boolean
	hasEmail?: boolean
	hasPhone?: boolean
	createdAtStart?: string
	createdAtEnd?: string
	sortBy?: PropertyOwnerSortBy
	sortOrder?: PropertyOwnerSortOrder
	page?: number
	limit?: number
}

export interface ListPropertyOwnersApiResponse {
	data: PropertyOwner[]
	total: number
	limit: number
	offset: number
}

export interface ListPropertyOwnersResponse {
	data: PropertyOwner[]
	total: number
	page: number
	limit: number
	totalPages: number
}
