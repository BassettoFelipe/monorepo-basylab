import { Constants } from '@/config/constants'
import type { CustomField } from '@/db/schema/custom-fields'
import type { ICacheService } from '../contracts/cache.interface'

export interface ICustomFieldCacheService {
	getActiveFields(companyId: string): Promise<CustomField[] | null>
	getAllFields(companyId: string): Promise<CustomField[] | null>
	setActiveFields(companyId: string, fields: CustomField[]): Promise<void>
	setAllFields(companyId: string, fields: CustomField[]): Promise<void>
	invalidate(companyId: string): Promise<void>
}

export class CustomFieldCacheService implements ICustomFieldCacheService {
	private readonly activePrefix = 'custom-fields:active:'
	private readonly allPrefix = 'custom-fields:all:'
	private readonly ttl = Constants.CACHE.CUSTOM_FIELDS_TTL_S

	constructor(private readonly cacheService: ICacheService) {}

	private getActiveFieldsKey(companyId: string): string {
		return `${this.activePrefix}${companyId}`
	}

	private getAllFieldsKey(companyId: string): string {
		return `${this.allPrefix}${companyId}`
	}

	async getActiveFields(companyId: string): Promise<CustomField[] | null> {
		return this.cacheService.get<CustomField[]>(this.getActiveFieldsKey(companyId))
	}

	async getAllFields(companyId: string): Promise<CustomField[] | null> {
		return this.cacheService.get<CustomField[]>(this.getAllFieldsKey(companyId))
	}

	async setActiveFields(companyId: string, fields: CustomField[]): Promise<void> {
		await this.cacheService.set(this.getActiveFieldsKey(companyId), fields, this.ttl)
	}

	async setAllFields(companyId: string, fields: CustomField[]): Promise<void> {
		await this.cacheService.set(this.getAllFieldsKey(companyId), fields, this.ttl)
	}

	async invalidate(companyId: string): Promise<void> {
		await this.cacheService.deleteMany([
			this.getActiveFieldsKey(companyId),
			this.getAllFieldsKey(companyId),
		])
	}
}
