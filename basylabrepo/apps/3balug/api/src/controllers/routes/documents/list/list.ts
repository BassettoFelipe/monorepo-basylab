import { Elysia } from 'elysia'
import { documents as documentsContainer } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import type { DOCUMENT_ENTITY_TYPES } from '@/db/schema/documents'
import { getStorageService } from '@/services/storage'
import { USER_ROLES } from '@/types/roles'
import { listDocumentsParamsSchema, listDocumentsResponseSchema } from './schema'

const SIGNED_URL_EXPIRY = 3600

export const listDocumentsController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]))
		.get(
			'/documents/:entityType/:entityId',
			async ({ validatedUser, params }) => {
				const result = await documentsContainer.list.execute({
					entityType: params.entityType as
						| typeof DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER
						| typeof DOCUMENT_ENTITY_TYPES.TENANT
						| typeof DOCUMENT_ENTITY_TYPES.CONTRACT,
					entityId: params.entityId,
					user: validatedUser,
				})

				const storageService = getStorageService()
				const documentsWithSignedUrls = await Promise.all(
					result.documents.map(async (doc: (typeof result.documents)[number]) => {
						const signedUrl = await storageService.getPresignedDownloadUrl(
							doc.filename,
							SIGNED_URL_EXPIRY,
						)
						return {
							...doc,
							url: signedUrl.url,
						}
					}),
				)

				return {
					success: true,
					data: documentsWithSignedUrls,
					total: result.total,
				}
			},
			{
				params: listDocumentsParamsSchema,
				response: {
					200: listDocumentsResponseSchema,
				},
			},
		),
)
