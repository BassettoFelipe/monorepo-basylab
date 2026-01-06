import type { Feature, NewFeature } from '@/db/schema'

export type FeatureFilters = {
	search?: string
	featureType?: 'boolean' | 'limit' | 'tier'
	limit?: number
	offset?: number
}

export type FeatureListResult = {
	data: Feature[]
	total: number
	limit: number
	offset: number
}

export interface IFeatureRepository {
	findById(id: string): Promise<Feature | null>
	findBySlug(slug: string): Promise<Feature | null>
	findAll(): Promise<Feature[]>
	list(filters: FeatureFilters): Promise<FeatureListResult>
	create(data: NewFeature): Promise<Feature>
	update(id: string, data: Partial<NewFeature>): Promise<Feature | null>
	delete(id: string): Promise<boolean>
}
