export const PLAN_FEATURES = {
	CUSTOM_FIELDS: 'custom_fields',
} as const

export type PlanFeatureSlug = (typeof PLAN_FEATURES)[keyof typeof PLAN_FEATURES]
