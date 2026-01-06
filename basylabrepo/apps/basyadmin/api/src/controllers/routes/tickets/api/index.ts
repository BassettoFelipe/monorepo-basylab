import { Elysia } from 'elysia'
import { addMessageApiController } from './add-message/add-message'
import { createTicketApiController } from './create/create'
import { getTicketApiController } from './get/get'
import { listTicketsApiController } from './list/list'

export const ticketApiRoutes = new Elysia()
	.use(listTicketsApiController)
	.use(getTicketApiController)
	.use(createTicketApiController)
	.use(addMessageApiController)
