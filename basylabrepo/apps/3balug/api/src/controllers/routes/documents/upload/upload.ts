import { Elysia } from 'elysia'
import { logger } from '@/config/logger'
import { documents as documentsContainer } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { getImageProcessor } from '@/services/image'
import { getStorageService } from '@/services/storage'
import { USER_ROLES } from '@/types/roles'
import { UploadFileUseCase } from '@/use-cases/files/upload-file/upload-file.use-case'
import { uploadDocumentBodySchema, uploadDocumentResponseSchema } from './schema'

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const SIGNED_URL_EXPIRY = 3600

export const uploadDocumentController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]))
		.post(
			'/documents',
			async ({ validatedUser, body }) => {
				const { file, entityType, entityId, documentType, description } = body

				const arrayBuffer = await file.arrayBuffer()
				let buffer: Buffer<ArrayBuffer> = Buffer.from(arrayBuffer)
				let contentType = file.type
				let fileName = file.name

				// Comprimir imagens antes de salvar (PDFs nao sao comprimidos)
				if (IMAGE_MIME_TYPES.includes(file.type)) {
					try {
						const imageProcessor = getImageProcessor()
						const processedImage = await imageProcessor.processDocumentImage(buffer)
						buffer = processedImage.buffer as Buffer<ArrayBuffer>
						contentType = processedImage.contentType
						// Atualizar extensao do arquivo para .webp
						const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
						fileName = `${nameWithoutExt}.webp`

						logger.info(
							{
								originalSize: `${(file.size / 1024).toFixed(2)}KB`,
								compressedSize: `${(processedImage.processedSize / 1024).toFixed(2)}KB`,
								compressionRatio: `${processedImage.compressionRatio}%`,
								documentType,
							},
							'Documento de imagem comprimido antes do upload',
						)
					} catch (compressionError) {
						logger.warn(
							{ err: compressionError, documentType },
							'Falha ao comprimir imagem, usando arquivo original',
						)
						// Em caso de erro na compressao, continuar com o arquivo original
					}
				}

				const storageService = getStorageService()
				const uploadUseCase = new UploadFileUseCase(storageService)
				const uploadResult = await uploadUseCase.execute({
					file: buffer,
					fileName,
					contentType,
					userId: validatedUser.id,
					fieldId: `${entityType}-${entityId}`,
					maxFileSize: 10,
					allowedTypes: ['application/pdf', 'image/*'],
				})

				const result = await documentsContainer.add.execute({
					entityType,
					entityId,
					documentType,
					filename: uploadResult.key,
					originalName: file.name,
					mimeType: uploadResult.contentType,
					size: uploadResult.size,
					url: uploadResult.key,
					description: description || undefined,
					user: validatedUser,
				})

				const signedUrl = await storageService.getPresignedDownloadUrl(
					uploadResult.key,
					SIGNED_URL_EXPIRY,
				)

				logger.info(
					{
						event: 'DOCUMENT_ADDED',
						documentId: result.id,
						entityType,
						entityId,
						documentType,
						uploadedBy: validatedUser.id,
					},
					'Documento adicionado',
				)

				return {
					success: true,
					message: 'Documento adicionado com sucesso',
					data: {
						...result,
						url: signedUrl.url,
					},
				}
			},
			{
				body: uploadDocumentBodySchema,
				response: {
					200: uploadDocumentResponseSchema,
				},
			},
		),
)
