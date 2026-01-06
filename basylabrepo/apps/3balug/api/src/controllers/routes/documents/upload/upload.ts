import { Elysia } from 'elysia'
import { logger } from '@/config/logger'
import { documents as documentsContainer } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'

import { getStorageService } from '@/services/storage'
import { USER_ROLES } from '@/types/roles'
import { UploadFileUseCase } from '@/use-cases/files/upload-file/upload-file.use-case'
import { uploadDocumentBodySchema, uploadDocumentResponseSchema } from './schema'

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
				const buffer = Buffer.from(arrayBuffer)

				const storageService = getStorageService()
				const uploadUseCase = new UploadFileUseCase(storageService)
				const uploadResult = await uploadUseCase.execute({
					file: buffer,
					fileName: file.name,
					contentType: file.type,
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
