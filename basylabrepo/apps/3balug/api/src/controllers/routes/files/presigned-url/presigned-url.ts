import { Elysia } from 'elysia'
import { logger } from '@/config/logger'
import { container } from '@/container'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { getStorageService } from '@/services/storage'
import { GetPresignedUrlUseCase } from '@/use-cases/files/get-presigned-url/get-presigned-url.use-case'
import { presignedUrlBodySchema, presignedUrlResponseSchema } from './schema'

export const presignedUrlController = new Elysia().use(requireAuth).post(
	'/files/presigned-url',
	async ({ userId, body }) => {
		const { fileName, contentType, entityType, entityId, fieldId, allowedTypes } = body

		const parsedAllowedTypes = allowedTypes && allowedTypes.length > 0 ? allowedTypes : undefined

		const useCase = new GetPresignedUrlUseCase({
			storageService: getStorageService(),
			tenantRepository: container.tenantRepository,
			propertyOwnerRepository: container.propertyOwnerRepository,
			propertyRepository: container.propertyRepository,
			userRepository: container.userRepository,
		})

		const result = await useCase.execute({
			fileName,
			contentType,
			userId,
			entityType,
			entityId,
			fieldId: fieldId || undefined,
			allowedTypes: parsedAllowedTypes,
		})

		logger.info(
			{ event: 'PRESIGNED_URL_GENERATED', userId, entityType, entityId, fileName },
			'URL pré-assinada gerada',
		)

		return {
			success: true,
			message: 'URL pré-assinada gerada com sucesso',
			data: result,
		}
	},
	{
		body: presignedUrlBodySchema,
		response: {
			200: presignedUrlResponseSchema,
		},
	},
)
