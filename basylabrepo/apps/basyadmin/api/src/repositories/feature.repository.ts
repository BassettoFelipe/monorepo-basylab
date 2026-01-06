import { eq } from 'drizzle-orm'
import { db } from '../db'
import { type Feature, features, type NewFeature } from '../db/schema'

export const FeatureRepository = {
	async findById(id: string): Promise<Feature | undefined> {
		return db.query.features.findFirst({
			where: eq(features.id, id),
		})
	},

	async findBySlug(slug: string): Promise<Feature | undefined> {
		return db.query.features.findFirst({
			where: eq(features.slug, slug),
		})
	},

	async findAll(): Promise<Feature[]> {
		return db.query.features.findMany({
			orderBy: (features, { asc }) => [asc(features.name)],
		})
	},

	async create(data: NewFeature): Promise<Feature> {
		const [feature] = await db.insert(features).values(data).returning()
		return feature
	},

	async update(id: string, data: Partial<NewFeature>): Promise<Feature> {
		const [feature] = await db
			.update(features)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(features.id, id))
			.returning()
		return feature
	},

	async delete(id: string): Promise<void> {
		await db.delete(features).where(eq(features.id, id))
	},
}
