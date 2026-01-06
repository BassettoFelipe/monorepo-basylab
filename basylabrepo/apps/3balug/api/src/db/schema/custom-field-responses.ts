import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { customFields } from './custom-fields'
import { users } from './users'

export const customFieldResponses = pgTable(
	'custom_field_responses',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		fieldId: uuid('field_id')
			.notNull()
			.references(() => customFields.id, { onDelete: 'cascade' }),
		value: text('value'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('custom_field_responses_user_id_idx').on(table.userId),
		fieldUserIdx: uniqueIndex('custom_field_responses_field_user_idx').on(
			table.fieldId,
			table.userId,
		),
	}),
)

export type CustomFieldResponse = typeof customFieldResponses.$inferSelect
export type NewCustomFieldResponse = typeof customFieldResponses.$inferInsert
