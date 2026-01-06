import { Elysia } from 'elysia'
import { logger } from '@/config/logger'
import { propertyPhotos } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { getStorageService } from '@/services/storage'
import { USER_ROLES } from '@/types/roles'
import { UploadFileUseCase } from '@/use-cases/files/upload-file/upload-file.use-case'
import {
	deletePhotoParamsSchema,
	deletePhotoResponseSchema,
	setPrimaryPhotoParamsSchema,
	setPrimaryPhotoResponseSchema,
	uploadPhotoBodySchema,
	uploadPhotoParamsSchema,
	uploadPhotoResponseSchema,
} from './schema'

export const propertyPhotosController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]))
		.post(
			'/properties/:id/photos',
			async ({ validatedUser, params, body }) => {
				const { file, isPrimary } = body

				const arrayBuffer = await file.arrayBuffer()
				const buffer = Buffer.from(arrayBuffer)

				const uploadUseCase = new UploadFileUseCase(getStorageService())
				const uploadResult = await uploadUseCase.execute({
					file: buffer,
					fileName: file.name,
					contentType: file.type,
					userId: validatedUser.id,
					fieldId: `property-${params.id}`,
					maxFileSize: 10,
					allowedTypes: ['image/*'],
				})

				const result = await propertyPhotos.add.execute({
					propertyId: params.id,
					filename: uploadResult.key,
					originalName: uploadResult.fileName,
					mimeType: uploadResult.contentType,
					size: uploadResult.size,
					url: uploadResult.url,
					isPrimary: isPrimary === 'true' || isPrimary === true,
					user: validatedUser,
				})

				logger.info(
					{
						event: 'PROPERTY_PHOTO_ADDED',
						photoId: result.id,
						propertyId: params.id,
						uploadedBy: validatedUser.id,
					},
					'Foto adicionada ao imovel',
				)

				return {
					success: true,
					message: 'Foto adicionada com sucesso',
					data: result,
				}
			},
			{
				params: uploadPhotoParamsSchema,
				body: uploadPhotoBodySchema,
				response: {
					200: uploadPhotoResponseSchema,
				},
			},
		)
		.delete(
			'/properties/:id/photos/:photoId',
			async ({ validatedUser, params }) => {
				const result = await propertyPhotos.remove.execute({
					photoId: params.photoId,
					user: validatedUser,
				})

				logger.info(
					{
						event: 'PROPERTY_PHOTO_REMOVED',
						photoId: params.photoId,
						propertyId: params.id,
						removedBy: validatedUser.id,
					},
					'Foto removida do imovel',
				)

				return result
			},
			{
				params: deletePhotoParamsSchema,
				response: {
					200: deletePhotoResponseSchema,
				},
			},
		)
		.patch(
			'/properties/:id/photos/:photoId/primary',
			async ({ validatedUser, params }) => {
				const result = await propertyPhotos.setPrimary.execute({
					photoId: params.photoId,
					user: validatedUser,
				})

				logger.info(
					{
						event: 'PROPERTY_PHOTO_SET_PRIMARY',
						photoId: params.photoId,
						propertyId: params.id,
						changedBy: validatedUser.id,
					},
					'Foto definida como principal',
				)

				return result
			},
			{
				params: setPrimaryPhotoParamsSchema,
				response: {
					200: setPrimaryPhotoResponseSchema,
				},
			},
		),
)
