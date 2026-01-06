import type {
	CustomFieldResponse,
	NewCustomFieldResponse,
} from '@/db/schema/custom-field-responses'

export interface ICustomFieldResponseRepository {
	findById(id: string): Promise<CustomFieldResponse | null>
	findByUserId(userId: string): Promise<CustomFieldResponse[]>
	findByUserIds(userIds: string[]): Promise<CustomFieldResponse[]>
	findByFieldId(fieldId: string): Promise<CustomFieldResponse[]>
	findByUserAndField(userId: string, fieldId: string): Promise<CustomFieldResponse | null>
	create(data: NewCustomFieldResponse): Promise<CustomFieldResponse>
	createMany(data: NewCustomFieldResponse[]): Promise<CustomFieldResponse[]>
	update(id: string, data: Partial<NewCustomFieldResponse>): Promise<CustomFieldResponse | null>
	upsertByUserAndField(
		userId: string,
		fieldId: string,
		value: string | null,
	): Promise<CustomFieldResponse>
	upsertMany(
		data: Array<{ userId: string; fieldId: string; value: string | null }>,
	): Promise<CustomFieldResponse[]>
	deleteByUserId(userId: string): Promise<boolean>
}
