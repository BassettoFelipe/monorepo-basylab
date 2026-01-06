import { Elysia } from 'elysia'
import { createPropertyController } from './create/create'
import { deletePropertyController } from './delete/delete'
import { getPropertyController } from './get/get'
import { listPropertiesController } from './list/list'
import { propertyPhotosController } from './photos/photos'
import { updatePropertyController } from './update/update'

export const propertiesRoutes = new Elysia({ prefix: '/api' })
	.use(createPropertyController)
	.use(listPropertiesController)
	.use(getPropertyController)
	.use(updatePropertyController)
	.use(deletePropertyController)
	.use(propertyPhotosController)
