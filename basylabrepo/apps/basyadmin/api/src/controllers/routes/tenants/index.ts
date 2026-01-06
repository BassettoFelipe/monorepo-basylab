import { Elysia } from 'elysia'
import { createTenantController } from './create/create'
import { deleteTenantController } from './delete/delete'
import { getTenantController } from './get/get'
import { listTenantsController } from './list/list'
import { regenerateKeyController } from './regenerate-key/regenerate-key'
import { updateTenantController } from './update/update'

export const tenantRoutes = new Elysia()
	.use(listTenantsController)
	.use(getTenantController)
	.use(createTenantController)
	.use(updateTenantController)
	.use(deleteTenantController)
	.use(regenerateKeyController)
