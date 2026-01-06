import { t } from "elysia";

export const getPropertyParamsSchema = t.Object({
  id: t.String({ format: "uuid" }),
});

export const getPropertyResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Object({
    id: t.String(),
    title: t.String(),
    description: t.Union([t.String(), t.Null()]),
    type: t.String(),
    listingType: t.String(),
    status: t.String(),
    rentalPrice: t.Union([t.Number(), t.Null()]),
    salePrice: t.Union([t.Number(), t.Null()]),
    address: t.Union([t.String(), t.Null()]),
    city: t.Union([t.String(), t.Null()]),
    state: t.Union([t.String(), t.Null()]),
    zipCode: t.Union([t.String(), t.Null()]),
    bedrooms: t.Union([t.Number(), t.Null()]),
    bathrooms: t.Union([t.Number(), t.Null()]),
    parkingSpaces: t.Union([t.Number(), t.Null()]),
    area: t.Union([t.Number(), t.Null()]),
    features: t.Union([t.Object({}), t.Null()]),
    ownerId: t.String(),
    owner: t.Union([
      t.Object({
        id: t.String(),
        name: t.String(),
        document: t.String(),
        email: t.Union([t.String(), t.Null()]),
        phone: t.Union([t.String(), t.Null()]),
      }),
      t.Null(),
    ]),
    broker: t.Union([
      t.Object({
        id: t.String(),
        name: t.String(),
        email: t.String(),
      }),
      t.Null(),
    ]),
    photos: t.Array(
      t.Object({
        id: t.String(),
        url: t.String(),
        isPrimary: t.Boolean(),
      }),
    ),
  }),
});
