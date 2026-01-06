import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { type NewTenant, type Tenant, tenants, userTenants } from '../db/schema'

export const TenantRepository = {
	async findById(id: string): Promise<Tenant | undefined> {
		return db.query.tenants.findFirst({
			where: eq(tenants.id, id),
		})
	},

	async findBySlug(slug: string): Promise<Tenant | undefined> {
		return db.query.tenants.findFirst({
			where: eq(tenants.slug, slug),
		})
	},

	async findByApiKey(apiKey: string): Promise<Tenant | undefined> {
		return db.query.tenants.findFirst({
			where: eq(tenants.apiKey, apiKey),
		})
	},

	async findAll(): Promise<Tenant[]> {
		return db.query.tenants.findMany({
			orderBy: (tenants, { desc }) => [desc(tenants.createdAt)],
		})
	},

	async findByManagerId(managerId: string): Promise<Tenant[]> {
		const result = await db
			.select({
				tenant: tenants,
			})
			.from(tenants)
			.innerJoin(userTenants, eq(tenants.id, userTenants.tenantId))
			.where(eq(userTenants.userId, managerId))
			.orderBy(tenants.name)

		return result.map((r) => r.tenant)
	},

	async create(data: NewTenant): Promise<Tenant> {
		const [tenant] = await db.insert(tenants).values(data).returning()
		return tenant
	},

	async update(id: string, data: Partial<NewTenant>): Promise<Tenant> {
		const [tenant] = await db
			.update(tenants)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(tenants.id, id))
			.returning()
		return tenant
	},

	async delete(id: string): Promise<void> {
		await db.delete(tenants).where(eq(tenants.id, id))
	},

	async assignManager(tenantId: string, managerId: string): Promise<void> {
		await db
			.insert(userTenants)
			.values({
				tenantId,
				userId: managerId,
			})
			.onConflictDoNothing()
	},

	async removeManager(tenantId: string, managerId: string): Promise<void> {
		await db
			.delete(userTenants)
			.where(and(eq(userTenants.tenantId, tenantId), eq(userTenants.userId, managerId)))
	},

	async isManagerOfTenant(managerId: string, tenantId: string): Promise<boolean> {
		const result = await db.query.userTenants.findFirst({
			where: and(eq(userTenants.userId, managerId), eq(userTenants.tenantId, tenantId)),
		})
		return !!result
	},
}
