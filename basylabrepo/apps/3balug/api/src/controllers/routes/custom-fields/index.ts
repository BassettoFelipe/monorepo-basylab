import { Elysia } from 'elysia'
import { createCustomFieldController } from './create/create'
import { deleteCustomFieldController } from './delete/delete'
import { listCustomFieldsController } from './list/list'
import { myFieldsController } from './my-fields/my-fields'
import { reorderCustomFieldsController } from './reorder/reorder'
import { updateCustomFieldController } from './update/update'
import { userFieldsController } from './user-fields/user-fields'

export const customFieldsController = new Elysia()
	.use(listCustomFieldsController)
	.use(createCustomFieldController)
	.use(updateCustomFieldController)
	.use(deleteCustomFieldController)
	.use(reorderCustomFieldsController)
	.use(myFieldsController)
	.use(userFieldsController)
