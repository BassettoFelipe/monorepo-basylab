import { t } from "elysia";

export const listPropertiesQuerySchema = t.Object({
  search: t.Optional(t.String()),
  type: t.Optional(
    t.Union([
      t.Literal("house"),
      t.Literal("apartment"),
      t.Literal("land"),
      t.Literal("commercial"),
      t.Literal("rural"),
    ]),
  ),
  listingType: t.Optional(t.Union([t.Literal("rent"), t.Literal("sale"), t.Literal("both")])),
  status: t.Optional(
    t.Union([
      t.Literal("available"),
      t.Literal("rented"),
      t.Literal("sold"),
      t.Literal("maintenance"),
      t.Literal("unavailable"),
    ]),
  ),
  city: t.Optional(t.String()),
  minRentalPrice: t.Optional(t.Numeric()),
  maxRentalPrice: t.Optional(t.Numeric()),
  minSalePrice: t.Optional(t.Numeric()),
  maxSalePrice: t.Optional(t.Numeric()),
  minBedrooms: t.Optional(t.Numeric()),
  maxBedrooms: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  offset: t.Optional(t.Numeric({ minimum: 0 })),
});

export const propertyResponseSchema = t.Object({
  id: t.String(),
  ownerId: t.String(),
  brokerId: t.Union([t.String(), t.Null()]),
  title: t.String(),
  description: t.Union([t.String(), t.Null()]),
  type: t.String(),
  listingType: t.String(),
  status: t.String(),
  address: t.Union([t.String(), t.Null()]),
  neighborhood: t.Union([t.String(), t.Null()]),
  city: t.Union([t.String(), t.Null()]),
  state: t.Union([t.String(), t.Null()]),
  zipCode: t.Union([t.String(), t.Null()]),
  bedrooms: t.Union([t.Number(), t.Null()]),
  bathrooms: t.Union([t.Number(), t.Null()]),
  parkingSpaces: t.Union([t.Number(), t.Null()]),
  area: t.Union([t.Number(), t.Null()]),
  rentalPrice: t.Union([t.Number(), t.Null()]),
  salePrice: t.Union([t.Number(), t.Null()]),
  iptuPrice: t.Union([t.Number(), t.Null()]),
  condoFee: t.Union([t.Number(), t.Null()]),
  features: t.Union([t.Object({}), t.Null()]),
});

export const listPropertiesResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Array(propertyResponseSchema),
  total: t.Number(),
  limit: t.Number(),
  offset: t.Number(),
});
