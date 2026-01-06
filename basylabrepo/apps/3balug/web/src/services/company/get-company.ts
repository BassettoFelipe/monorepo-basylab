import { api } from '@/lib/api'

export interface Company {
	id: string
	name: string
	email: string | null
	cnpj: string | null
	phone: string | null
	address: string | null
	city: string | null
	state: string | null
	zipCode: string | null
}

interface GetCompanyResponse {
	success: boolean
	data: Company
}

export const getCompany = async (): Promise<Company> => {
	const { data } = await api.get<GetCompanyResponse>('/api/companies/me')
	return data.data
}
