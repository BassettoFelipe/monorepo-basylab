import { t } from "elysia";

export const dashboardStatsResponseSchema = t.Object({
  success: t.Boolean(),
  data: t.Object({
    properties: t.Object({
      total: t.Number(),
      available: t.Number(),
      rented: t.Number(),
      sold: t.Number(),
      maintenance: t.Number(),
    }),
    contracts: t.Object({
      total: t.Number(),
      active: t.Number(),
      terminated: t.Number(),
      cancelled: t.Number(),
      expired: t.Number(),
      totalRentalAmount: t.Number(),
    }),
    propertyOwners: t.Object({
      total: t.Number(),
    }),
    tenants: t.Object({
      total: t.Number(),
    }),
    expiringContracts: t.Array(
      t.Object({
        id: t.String(),
        propertyId: t.String(),
        tenantId: t.String(),
        endDate: t.Date(),
        rentalAmount: t.Number(),
      }),
    ),
  }),
});
