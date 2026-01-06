import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

export const FIELD_TYPES = {
	TEXT: 'text',
	TEXTAREA: 'textarea',
	NUMBER: 'number',
	EMAIL: 'email',
	PHONE: 'phone',
	SELECT: 'select',
	CHECKBOX: 'checkbox',
	DATE: 'date',
	FILE: 'file',
} as const

export type FieldType = (typeof FIELD_TYPES)[keyof typeof FIELD_TYPES]

export const customFields = pgTable(
	'custom_fields',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		companyId: uuid('company_id')
			.notNull()
			.references(() => companies.id, { onDelete: 'cascade' }),
		label: text('label').notNull(),
		type: text('type').notNull(),
		placeholder: text('placeholder'),
		helpText: text('help_text'),
		isRequired: boolean('is_required').default(false).notNull(),
		options: jsonb('options').$type<string[]>(),
		allowMultiple: boolean('allow_multiple').default(false),
		validation: jsonb('validation').$type<{
			minLength?: number
			maxLength?: number
			min?: number
			max?: number
			pattern?: string
		}>(),
		fileConfig: jsonb('file_config').$type<{
			maxFileSize?: number
			maxFiles?: number
			allowedTypes?: string[]
		}>(),
		order: integer('order').default(0).notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		companyIdIdx: index('custom_fields_company_id_idx').on(table.companyId),
		companyActiveOrderIdx: index('custom_fields_company_active_order_idx').on(
			table.companyId,
			table.isActive,
			table.order,
		),
	}),
)

export type CustomField = typeof customFields.$inferSelect
export type NewCustomField = typeof customFields.$inferInsert
