import { Elysia } from 'elysia'
import { container } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import type { ListingType, PropertyStatus, PropertyType } from '@/db/schema/properties'
import { USER_ROLES } from '@/types/roles'
import { listPropertiesQuerySchema, listPropertiesResponseSchema } from './schema'

export const listPropertiesController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(
			requireRole([
				USER_ROLES.OWNER,
				USER_ROLES.MANAGER,
				USER_ROLES.BROKER,
				USER_ROLES.INSURANCE_ANALYST,
			]),
		)
		.get(
			'/properties',
			async ({ validatedUser, query }) => {
				const result = await container.properties.list.execute({
					search: query.search,
					ownerId: query.ownerId,
					type: query.type as PropertyType | undefined,
					listingType: query.listingType as ListingType | undefined,
					status: query.status as PropertyStatus | undefined,
					city: query.city,
					minRentalPrice: query.minRentalPrice ? Number(query.minRentalPrice) : undefined,
					maxRentalPrice: query.maxRentalPrice ? Number(query.maxRentalPrice) : undefined,
					minSalePrice: query.minSalePrice ? Number(query.minSalePrice) : undefined,
					maxSalePrice: query.maxSalePrice ? Number(query.maxSalePrice) : undefined,
					minBedrooms: query.minBedrooms ? Number(query.minBedrooms) : undefined,
					maxBedrooms: query.maxBedrooms ? Number(query.maxBedrooms) : undefined,
					limit: query.limit ? Number(query.limit) : undefined,
					offset: query.offset ? Number(query.offset) : undefined,
					requestedBy: validatedUser,
				})

				return {
					success: true,
					data: result.data.map((property) => ({
						...property,
						createdAt: property.createdAt?.toISOString(),
						updatedAt: property.updatedAt?.toISOString(),
						primaryPhoto: property.primaryPhoto
							? {
									...property.primaryPhoto,
									createdAt: property.primaryPhoto.createdAt.toISOString(),
								}
							: null,
					})),
					total: result.total,
					limit: result.limit,
					offset: result.offset,
				}
			},
			{
				query: listPropertiesQuerySchema,
				response: {
					200: listPropertiesResponseSchema,
				},
			},
		),
)
