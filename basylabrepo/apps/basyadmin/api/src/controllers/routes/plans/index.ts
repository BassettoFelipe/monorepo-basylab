import { Elysia } from 'elysia'
import { assignFeatureController } from './assign-feature/assign-feature'
import { createPlanController } from './create/create'
import { deletePlanController } from './delete/delete'
import { getPlanController } from './get/get'
import { listPlansController } from './list/list'
import { removeFeatureController } from './remove-feature/remove-feature'
import { updatePlanController } from './update/update'

export const planRoutes = new Elysia()
	.use(listPlansController)
	.use(getPlanController)
	.use(createPlanController)
	.use(updatePlanController)
	.use(deletePlanController)
	.use(assignFeatureController)
	.use(removeFeatureController)
