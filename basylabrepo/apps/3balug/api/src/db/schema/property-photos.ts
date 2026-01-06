import { boolean, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { properties } from './properties'
import { users } from './users'

export const propertyPhotos = pgTable(
	'property_photos',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		propertyId: uuid('property_id')
			.notNull()
			.references(() => properties.id, { onDelete: 'cascade' }),
		filename: text('filename').notNull(), // Nome do arquivo no storage
		originalName: text('original_name').notNull(), // Nome original do arquivo
		mimeType: text('mime_type').notNull(), // Tipo do arquivo (image/jpeg, image/png, etc)
		size: integer('size').notNull(), // Tamanho em bytes
		url: text('url').notNull(), // URL para acessar a imagem
		order: integer('order').default(0), // Ordem de exibição
		isPrimary: boolean('is_primary').default(false), // Foto principal
		uploadedBy: uuid('uploaded_by')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => [
		index('property_photos_property_id_idx').on(table.propertyId),
		index('property_photos_order_idx').on(table.order),
	],
)

export type PropertyPhoto = typeof propertyPhotos.$inferSelect
export type NewPropertyPhoto = typeof propertyPhotos.$inferInsert
