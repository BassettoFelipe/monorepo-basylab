import { Elysia } from 'elysia'
import { deleteAvatarController } from './delete/delete'
import { uploadAvatarController } from './upload/upload'

export const avatarController = new Elysia({ prefix: '/avatar' })
	.use(uploadAvatarController)
	.use(deleteAvatarController)
