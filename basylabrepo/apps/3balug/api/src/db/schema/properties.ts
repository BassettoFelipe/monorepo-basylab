import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { propertyOwners } from './property-owners'
import { users } from './users'

export const PROPERTY_TYPES = {
	HOUSE: 'house', // Casa
	APARTMENT: 'apartment', // Apartamento
	LAND: 'land', // Terreno
	COMMERCIAL: 'commercial', // Comercial
	RURAL: 'rural', // Rural
} as const

export type PropertyType = (typeof PROPERTY_TYPES)[keyof typeof PROPERTY_TYPES]

export const LISTING_TYPES = {
	RENT: 'rent', // Locação
	SALE: 'sale', // Venda
	BOTH: 'both', // Ambos
} as const

export type ListingType = (typeof LISTING_TYPES)[keyof typeof LISTING_TYPES]

export const PROPERTY_STATUS = {
	AVAILABLE: 'available', // Disponível
	RENTED: 'rented', // Alugado
	SOLD: 'sold', // Vendido
	MAINTENANCE: 'maintenance', // Em manutenção
	UNAVAILABLE: 'unavailable', // Indisponível
} as const

export type PropertyStatus = (typeof PROPERTY_STATUS)[keyof typeof PROPERTY_STATUS]

export type PropertyFeatures = {
	hasPool?: boolean
	hasGarden?: boolean
	hasGarage?: boolean
	hasElevator?: boolean
	hasGym?: boolean
	hasPlayground?: boolean
	hasSecurity?: boolean
	hasAirConditioning?: boolean
	hasFurnished?: boolean
	hasPetFriendly?: boolean
	hasBalcony?: boolean
	hasBarbecue?: boolean
	[key: string]: boolean | undefined
}

export const properties = pgTable(
	'properties',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		companyId: uuid('company_id')
			.notNull()
			.references(() => companies.id, { onDelete: 'cascade' }),
		ownerId: uuid('owner_id')
			.notNull()
			.references(() => propertyOwners.id, { onDelete: 'restrict' }),
		brokerId: uuid('broker_id').references(() => users.id, {
			onDelete: 'set null',
		}), // Corretor responsável
		title: text('title').notNull(),
		description: text('description'),
		type: text('type').notNull().default(PROPERTY_TYPES.HOUSE), // house, apartment, land, commercial, rural
		listingType: text('listing_type').notNull().default(LISTING_TYPES.RENT), // rent, sale, both
		status: text('status').notNull().default(PROPERTY_STATUS.AVAILABLE), // available, rented, sold, maintenance, unavailable
		address: text('address'),
		neighborhood: text('neighborhood'), // Bairro
		city: text('city'),
		state: text('state'),
		zipCode: text('zip_code'),
		bedrooms: integer('bedrooms').default(0),
		bathrooms: integer('bathrooms').default(0),
		parkingSpaces: integer('parking_spaces').default(0),
		area: integer('area'), // Área em metros quadrados
		rentalPrice: integer('rental_price'), // Valor de locação em centavos
		salePrice: integer('sale_price'), // Valor de venda em centavos
		iptuPrice: integer('iptu_price'), // Valor do IPTU em centavos (mensal)
		condoFee: integer('condo_fee'), // Taxa de condomínio em centavos
		features: jsonb('features').$type<PropertyFeatures>().default({}),
		createdBy: uuid('created_by')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [
		index('properties_company_id_idx').on(table.companyId),
		index('properties_owner_id_idx').on(table.ownerId),
		index('properties_broker_id_idx').on(table.brokerId),
		index('properties_status_idx').on(table.status),
		index('properties_type_idx').on(table.type),
		index('properties_listing_type_idx').on(table.listingType),
		index('properties_city_idx').on(table.city),
		index('properties_company_status_idx').on(table.companyId, table.status),
		index('properties_company_broker_idx').on(table.companyId, table.brokerId),
		index('properties_company_status_created_idx').on(
			table.companyId,
			table.status,
			table.createdAt,
		),
	],
)

export type Property = typeof properties.$inferSelect
export type NewProperty = typeof properties.$inferInsert
