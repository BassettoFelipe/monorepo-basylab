import { Elysia } from 'elysia'
import { logger } from '@/config/logger'
import { container } from '@/container'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { getStorageService } from '@/services/storage'
import { UploadAvatarUseCase } from '@/use-cases/avatar/upload-avatar/upload-avatar.use-case'
import { uploadAvatarBodySchema, uploadAvatarResponseSchema } from './schema'

export const uploadAvatarController = new Elysia().use(requireAuth).post(
	'/',
	async ({ userId, body }) => {
		const { file } = body

		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		const useCase = new UploadAvatarUseCase(container.userRepository, getStorageService())

		const result = await useCase.execute({
			userId,
			file: buffer,
			contentType: file.type,
		})

		logger.info({ event: 'AVATAR_UPLOADED', userId }, 'Avatar enviado com sucesso')

		return {
			success: true,
			message: 'Avatar atualizado com sucesso',
			data: {
				avatarUrl: result.avatarUrl,
			},
		}
	},
	{
		body: uploadAvatarBodySchema,
		response: {
			200: uploadAvatarResponseSchema,
		},
	},
)
