import { Elysia } from 'elysia'
import { listBillingAdminController } from './list/list'
import { billingStatsAdminController } from './stats/stats'

export const billingAdminRoutes = new Elysia()
	.use(billingStatsAdminController)
	.use(listBillingAdminController)
