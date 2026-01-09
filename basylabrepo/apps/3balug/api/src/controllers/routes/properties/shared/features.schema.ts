import { t } from 'elysia'

/**
 * Shared schema for property features (amenities)
 * Used by both create and update property routes
 */
export const propertyFeaturesSchema = t.Object({
	hasPool: t.Optional(t.Boolean()),
	hasGarden: t.Optional(t.Boolean()),
	hasGarage: t.Optional(t.Boolean()),
	hasElevator: t.Optional(t.Boolean()),
	hasGym: t.Optional(t.Boolean()),
	hasPlayground: t.Optional(t.Boolean()),
	hasSecurity: t.Optional(t.Boolean()),
	hasAirConditioning: t.Optional(t.Boolean()),
	hasFurnished: t.Optional(t.Boolean()),
	hasPetFriendly: t.Optional(t.Boolean()),
	hasBalcony: t.Optional(t.Boolean()),
	hasBarbecue: t.Optional(t.Boolean()),
})
