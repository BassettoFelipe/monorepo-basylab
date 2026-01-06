import { jsonb, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { features } from './features'
import { plans } from './plans'

export const planFeatures = pgTable(
	'plan_features',
	{
		planId: uuid('plan_id')
			.notNull()
			.references(() => plans.id, { onDelete: 'cascade' }),
		featureId: uuid('feature_id')
			.notNull()
			.references(() => features.id, { onDelete: 'cascade' }),
		value: jsonb('value').default(true),
	},
	(table) => [primaryKey({ columns: [table.planId, table.featureId] })],
)

export type PlanFeature = typeof planFeatures.$inferSelect
export type NewPlanFeature = typeof planFeatures.$inferInsert
