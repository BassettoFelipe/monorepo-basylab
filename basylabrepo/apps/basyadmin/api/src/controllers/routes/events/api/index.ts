import { Elysia } from 'elysia'
import { batchEventApiController } from './batch/batch'
import { createEventApiController } from './create/create'

export const eventApiRoutes = new Elysia()
	.use(createEventApiController)
	.use(batchEventApiController)
