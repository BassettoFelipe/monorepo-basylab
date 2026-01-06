import { Elysia } from 'elysia'
import { createPropertyOwnerController } from './create/create'
import { deletePropertyOwnerController } from './delete/delete'
import { getPropertyOwnerController } from './get/get'
import { listPropertyOwnersController } from './list/list'
import { updatePropertyOwnerController } from './update/update'

export const propertyOwnersRoutes = new Elysia({ prefix: '/api' })
	.use(createPropertyOwnerController)
	.use(listPropertyOwnersController)
	.use(getPropertyOwnerController)
	.use(updatePropertyOwnerController)
	.use(deletePropertyOwnerController)
