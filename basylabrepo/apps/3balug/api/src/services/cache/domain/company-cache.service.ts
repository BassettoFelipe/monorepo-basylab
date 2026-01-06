import { Constants } from '@/config/constants'
import type { Company } from '@/db/schema/companies'
import type { ICacheService } from '../contracts/cache.interface'

export interface ICompanyCacheService {
	get(companyId: string): Promise<Company | null>
	set(companyId: string, company: Company): Promise<void>
	invalidate(companyId: string): Promise<void>
}

export class CompanyCacheService implements ICompanyCacheService {
	private readonly prefix = 'company:'
	private readonly ttl = Constants.CACHE.COMPANY_SETTINGS_TTL_S

	constructor(private readonly cacheService: ICacheService) {}

	private getKey(companyId: string): string {
		return `${this.prefix}${companyId}`
	}

	async get(companyId: string): Promise<Company | null> {
		return this.cacheService.get<Company>(this.getKey(companyId))
	}

	async set(companyId: string, company: Company): Promise<void> {
		await this.cacheService.set(this.getKey(companyId), company, this.ttl)
	}

	async invalidate(companyId: string): Promise<void> {
		await this.cacheService.delete(this.getKey(companyId))
	}
}
