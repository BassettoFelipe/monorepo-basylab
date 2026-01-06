import { Elysia } from 'elysia'
import { assignTenantController } from './assign-tenant/assign-tenant'
import { createManagerController } from './create/create'
import { deleteManagerController } from './delete/delete'
import { getManagerController } from './get/get'
import { listManagersController } from './list/list'
import { removeTenantController } from './remove-tenant/remove-tenant'
import { updateManagerController } from './update/update'

export const managerRoutes = new Elysia()
	.use(listManagersController)
	.use(getManagerController)
	.use(createManagerController)
	.use(updateManagerController)
	.use(deleteManagerController)
	.use(assignTenantController)
	.use(removeTenantController)
