import { Elysia } from 'elysia'
import { logger } from '@/config/logger'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { getStorageService } from '@/services/storage'
import { UploadFileUseCase } from '@/use-cases/files/upload-file/upload-file.use-case'
import { uploadFileBodySchema, uploadFileResponseSchema } from './schema'

export const uploadFileController = new Elysia().use(requireAuth).post(
	'/upload',
	async ({ userId, body }) => {
		const { file, fieldId, maxFileSize, allowedTypes } = body

		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		const parsedAllowedTypes = allowedTypes
			? allowedTypes.split(',').map((t) => t.trim())
			: undefined

		const parsedMaxFileSize = typeof maxFileSize === 'string' ? Number(maxFileSize) : maxFileSize

		const useCase = new UploadFileUseCase(getStorageService())

		const result = await useCase.execute({
			file: buffer,
			fileName: file.name,
			contentType: file.type,
			userId,
			fieldId: fieldId || undefined,
			maxFileSize: parsedMaxFileSize || 5,
			allowedTypes: parsedAllowedTypes,
		})

		logger.info(
			{ event: 'FILE_UPLOADED', userId, fileName: result.fileName },
			'Arquivo enviado com sucesso',
		)

		return {
			success: true,
			message: 'Arquivo enviado com sucesso',
			data: result,
		}
	},
	{
		body: uploadFileBodySchema,
		response: {
			200: uploadFileResponseSchema,
		},
	},
)
