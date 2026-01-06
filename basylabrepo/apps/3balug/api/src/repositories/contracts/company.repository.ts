import type { Company, NewCompany } from '@/db/schema/companies'

export interface ICompanyRepository {
	findById(id: string): Promise<Company | null>
	findByOwnerId(ownerId: string): Promise<Company | null>
	findByCnpj(cnpj: string): Promise<Company | null>
	create(data: NewCompany): Promise<Company>
	update(id: string, data: Partial<NewCompany>): Promise<Company | null>
	delete(id: string): Promise<boolean>
	listByOwner(ownerId: string): Promise<Company[]>
}
