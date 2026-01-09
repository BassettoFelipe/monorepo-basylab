export type MaritalStatus = 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel'

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
	solteiro: 'Solteiro(a)',
	casado: 'Casado(a)',
	divorciado: 'Divorciado(a)',
	viuvo: 'Viuvo(a)',
	uniao_estavel: 'Uniao Estavel',
}

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

export interface ListTenantsParams {
	search?: string
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
