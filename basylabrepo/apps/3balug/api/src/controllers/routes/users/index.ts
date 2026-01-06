import { Elysia } from 'elysia'
import { activateUserController } from './activate-user/activate-user'
import { createUserController } from './create-user/create-user'
import { deactivateUserController } from './deactivate-user/deactivate-user'
import { deleteUserController } from './delete-user/delete-user'
import { listUsersController } from './list-users/list-users'
import { updateUserController } from './update-user/update-user'

export const usersRoutes = new Elysia({ prefix: '/api' })
	.use(activateUserController)
	.use(createUserController)
	.use(deactivateUserController)
	.use(deleteUserController)
	.use(listUsersController)
	.use(updateUserController)
