import { Elysia } from 'elysia'
import { logger } from '@/config/logger'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { getStorageService } from '@/services/storage'
import { DeleteFileUseCase } from '@/use-cases/files/delete-file/delete-file.use-case'
import { deleteFileParamsSchema, deleteFileResponseSchema } from './schema'

export const deleteFileController = new Elysia().use(requireAuth).delete(
	'/files/:key',
	async ({ userId, params }) => {
		const key = decodeURIComponent(params.key)

		const useCase = new DeleteFileUseCase(getStorageService())

		await useCase.execute({ key, userId })

		logger.info({ event: 'FILE_DELETED', userId, key }, 'Arquivo removido com sucesso')

		return {
			success: true,
			message: 'Arquivo removido com sucesso',
		}
	},
	{
		params: deleteFileParamsSchema,
		response: {
			200: deleteFileResponseSchema,
		},
	},
)
