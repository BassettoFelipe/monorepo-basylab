import { and, count, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import type { Database } from '@/db'
import type { NewProperty, Property } from '@/db/schema/properties'
import { PROPERTY_STATUS, properties } from '@/db/schema/properties'
import { propertyPhotos } from '@/db/schema/property-photos'
import type {
	IPropertyRepository,
	PropertyFilters,
	PropertyListResult,
	PropertyStats,
	PropertyWithPrimaryPhoto,
} from '@/repositories/contracts/property.repository'

export class PropertyDrizzleRepository implements IPropertyRepository {
	constructor(private readonly db: Database) {}

	async findById(id: string): Promise<Property | null> {
		const result = await this.db
			.select()
			.from(properties)
			.where(and(eq(properties.id, id), isNull(properties.deletedAt)))
			.limit(1)
		return result[0] || null
	}

	async findByIds(ids: string[]): Promise<Property[]> {
		if (ids.length === 0) return []
		return await this.db
			.select()
			.from(properties)
			.where(and(inArray(properties.id, ids), isNull(properties.deletedAt)))
	}

	async findByCompanyId(companyId: string): Promise<Property[]> {
		return await this.db
			.select()
			.from(properties)
			.where(and(eq(properties.companyId, companyId), isNull(properties.deletedAt)))
	}

	async findByOwnerId(ownerId: string): Promise<Property[]> {
		return await this.db
			.select()
			.from(properties)
			.where(and(eq(properties.ownerId, ownerId), isNull(properties.deletedAt)))
	}

	async findByBrokerId(brokerId: string): Promise<Property[]> {
		return await this.db
			.select()
			.from(properties)
			.where(and(eq(properties.brokerId, brokerId), isNull(properties.deletedAt)))
	}

	async findByCode(companyId: string, code: string): Promise<Property | null> {
		const result = await this.db
			.select()
			.from(properties)
			.where(
				and(
					eq(properties.companyId, companyId),
					eq(properties.code, code),
					isNull(properties.deletedAt),
				),
			)
			.limit(1)
		return result[0] || null
	}

	async list(filters: PropertyFilters): Promise<PropertyListResult> {
		const {
			search,
			companyId,
			ownerId,
			brokerId,
			type,
			listingType,
			status,
			city,
			minRentalPrice,
			maxRentalPrice,
			minSalePrice,
			maxSalePrice,
			minBedrooms,
			maxBedrooms,
			limit = 20,
			offset = 0,
		} = filters

		const conditions = [eq(properties.companyId, companyId), isNull(properties.deletedAt)]

		if (ownerId) {
			conditions.push(eq(properties.ownerId, ownerId))
		}

		if (brokerId) {
			conditions.push(eq(properties.brokerId, brokerId))
		}

		if (type) {
			conditions.push(eq(properties.type, type))
		}

		if (listingType) {
			conditions.push(eq(properties.listingType, listingType))
		}

		if (status) {
			conditions.push(eq(properties.status, status))
		}

		if (city) {
			conditions.push(ilike(properties.city, `%${city}%`))
		}

		if (minRentalPrice !== undefined) {
			conditions.push(gte(properties.rentalPrice, minRentalPrice))
		}

		if (maxRentalPrice !== undefined) {
			conditions.push(lte(properties.rentalPrice, maxRentalPrice))
		}

		if (minSalePrice !== undefined) {
			conditions.push(gte(properties.salePrice, minSalePrice))
		}

		if (maxSalePrice !== undefined) {
			conditions.push(lte(properties.salePrice, maxSalePrice))
		}

		if (minBedrooms !== undefined) {
			conditions.push(gte(properties.bedrooms, minBedrooms))
		}

		if (maxBedrooms !== undefined) {
			conditions.push(lte(properties.bedrooms, maxBedrooms))
		}

		if (search) {
			const searchPattern = `%${search}%`
			conditions.push(
				or(
					ilike(properties.title, searchPattern),
					ilike(properties.address, searchPattern),
					ilike(properties.city, searchPattern),
					ilike(properties.neighborhood, searchPattern),
				) ?? sql`true`,
			)
		}

		const whereClause = and(...conditions)

		const [data, totalResult] = await Promise.all([
			this.db
				.select()
				.from(properties)
				.where(whereClause)
				.limit(limit)
				.offset(offset)
				.orderBy(properties.createdAt),
			this.db.select({ count: count() }).from(properties).where(whereClause),
		])

		// Buscar fotos primárias dos imóveis retornados
		const propertyIds = data.map((p) => p.id)
		const photosMap = new Map<string, typeof propertyPhotos.$inferSelect>()

		if (propertyIds.length > 0) {
			const photos = await this.db
				.select()
				.from(propertyPhotos)
				.where(
					and(inArray(propertyPhotos.propertyId, propertyIds), eq(propertyPhotos.isPrimary, true)),
				)

			for (const photo of photos) {
				photosMap.set(photo.propertyId, photo)
			}

			// Se não houver foto primária, pegar a primeira foto por ordem
			const propertiesWithoutPrimary = propertyIds.filter((id) => !photosMap.has(id))
			if (propertiesWithoutPrimary.length > 0) {
				const fallbackPhotos = await this.db
					.select()
					.from(propertyPhotos)
					.where(inArray(propertyPhotos.propertyId, propertiesWithoutPrimary))
					.orderBy(propertyPhotos.order)

				for (const photo of fallbackPhotos) {
					if (!photosMap.has(photo.propertyId)) {
						photosMap.set(photo.propertyId, photo)
					}
				}
			}
		}

		const dataWithPhotos: PropertyWithPrimaryPhoto[] = data.map((property) => ({
			...property,
			primaryPhoto: photosMap.get(property.id) || null,
		}))

		return {
			data: dataWithPhotos,
			total: totalResult[0]?.count ?? 0,
			limit,
			offset,
		}
	}

	async create(data: NewProperty): Promise<Property> {
		const result = await this.db.insert(properties).values(data).returning()
		return result[0]
	}

	async update(id: string, data: Partial<NewProperty>): Promise<Property | null> {
		const result = await this.db
			.update(properties)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(properties.id, id))
			.returning()
		return result[0] || null
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.db.delete(properties).where(eq(properties.id, id)).returning()
		return result.length > 0
	}

	async deleteWithPhotos(id: string): Promise<boolean> {
		return await this.db.transaction(async (tx) => {
			await tx.delete(propertyPhotos).where(eq(propertyPhotos.propertyId, id))
			const result = await tx.delete(properties).where(eq(properties.id, id)).returning()
			return result.length > 0
		})
	}

	async softDelete(id: string, deletedBy: string): Promise<boolean> {
		const result = await this.db
			.update(properties)
			.set({
				deletedAt: new Date(),
				deletedBy,
				updatedAt: new Date(),
			})
			.where(and(eq(properties.id, id), isNull(properties.deletedAt)))
			.returning()
		return result.length > 0
	}

	async restore(id: string): Promise<boolean> {
		const result = await this.db
			.update(properties)
			.set({
				deletedAt: null,
				deletedBy: null,
				updatedAt: new Date(),
			})
			.where(eq(properties.id, id))
			.returning()
		return result.length > 0
	}

	async countByCompanyId(companyId: string): Promise<number> {
		const result = await this.db
			.select({ count: count() })
			.from(properties)
			.where(and(eq(properties.companyId, companyId), isNull(properties.deletedAt)))
		return result[0]?.count ?? 0
	}

	async countByOwnerId(ownerId: string): Promise<number> {
		const result = await this.db
			.select({ count: count() })
			.from(properties)
			.where(and(eq(properties.ownerId, ownerId), isNull(properties.deletedAt)))
		return result[0]?.count ?? 0
	}

	async getStatsByCompanyId(companyId: string): Promise<PropertyStats> {
		const result = await this.db
			.select({
				status: properties.status,
				count: count(),
			})
			.from(properties)
			.where(and(eq(properties.companyId, companyId), isNull(properties.deletedAt)))
			.groupBy(properties.status)

		const stats: PropertyStats = {
			total: 0,
			available: 0,
			rented: 0,
			sold: 0,
			maintenance: 0,
		}

		for (const row of result) {
			stats.total += row.count
			switch (row.status) {
				case PROPERTY_STATUS.AVAILABLE:
					stats.available = row.count
					break
				case PROPERTY_STATUS.RENTED:
					stats.rented = row.count
					break
				case PROPERTY_STATUS.SOLD:
					stats.sold = row.count
					break
				case PROPERTY_STATUS.MAINTENANCE:
					stats.maintenance = row.count
					break
			}
		}

		return stats
	}

	async getStatsByBrokerId(brokerId: string, companyId: string): Promise<PropertyStats> {
		const result = await this.db
			.select({
				status: properties.status,
				count: count(),
			})
			.from(properties)
			.where(
				and(
					eq(properties.brokerId, brokerId),
					eq(properties.companyId, companyId),
					isNull(properties.deletedAt),
				),
			)
			.groupBy(properties.status)

		const stats: PropertyStats = {
			total: 0,
			available: 0,
			rented: 0,
			sold: 0,
			maintenance: 0,
		}

		for (const row of result) {
			stats.total += row.count
			switch (row.status) {
				case PROPERTY_STATUS.AVAILABLE:
					stats.available = row.count
					break
				case PROPERTY_STATUS.RENTED:
					stats.rented = row.count
					break
				case PROPERTY_STATUS.SOLD:
					stats.sold = row.count
					break
				case PROPERTY_STATUS.MAINTENANCE:
					stats.maintenance = row.count
					break
			}
		}

		return stats
	}

	async generateNextCode(companyId: string): Promise<string> {
		const result = await this.db
			.select({ code: properties.code })
			.from(properties)
			.where(eq(properties.companyId, companyId))
			.orderBy(desc(properties.createdAt))
			.limit(1)

		if (result.length === 0 || !result[0].code) {
			return 'IMO-00001'
		}

		const lastCode = result[0].code
		const match = lastCode.match(/IMO-(\d+)/)

		if (!match) {
			return 'IMO-00001'
		}

		const lastNumber = Number.parseInt(match[1], 10)
		const nextNumber = lastNumber + 1
		return `IMO-${nextNumber.toString().padStart(5, '0')}`
	}
}
