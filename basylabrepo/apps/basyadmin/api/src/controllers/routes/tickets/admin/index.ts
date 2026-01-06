import { Elysia } from 'elysia'
import { addMessageAdminController } from './add-message/add-message'
import { getTicketAdminController } from './get/get'
import { listTicketsAdminController } from './list/list'
import { updateTicketAdminController } from './update/update'

export const ticketAdminRoutes = new Elysia()
	.use(listTicketsAdminController)
	.use(getTicketAdminController)
	.use(updateTicketAdminController)
	.use(addMessageAdminController)
