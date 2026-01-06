import { Elysia } from 'elysia'
import { createFeatureController } from './create/create'
import { deleteFeatureController } from './delete/delete'
import { getFeatureController } from './get/get'
import { listFeaturesController } from './list/list'
import { updateFeatureController } from './update/update'

export const featureRoutes = new Elysia()
	.use(listFeaturesController)
	.use(getFeatureController)
	.use(createFeatureController)
	.use(updateFeatureController)
	.use(deleteFeatureController)
