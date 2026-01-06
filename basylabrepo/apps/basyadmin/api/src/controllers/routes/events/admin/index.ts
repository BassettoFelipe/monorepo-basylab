import { Elysia } from 'elysia'
import { aggregateEventsAdminController } from './aggregate/aggregate'
import { listEventsAdminController } from './list/list'

export const eventAdminRoutes = new Elysia()
	.use(aggregateEventsAdminController)
	.use(listEventsAdminController)
