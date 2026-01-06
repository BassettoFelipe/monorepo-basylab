import { Elysia } from 'elysia'
import { logger } from '@/config/logger'
import { documents as documentsContainer } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { USER_ROLES } from '@/types/roles'
import { deleteDocumentParamsSchema, deleteDocumentResponseSchema } from './schema'

export const deleteDocumentController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]))
		.delete(
			'/documents/:id',
			async ({ validatedUser, params }) => {
				const result = await documentsContainer.remove.execute({
					documentId: params.id,
					user: validatedUser,
				})

				logger.info(
					{
						event: 'DOCUMENT_REMOVED',
						documentId: params.id,
						removedBy: validatedUser.id,
					},
					'Documento removido',
				)

				return result
			},
			{
				params: deleteDocumentParamsSchema,
				response: {
					200: deleteDocumentResponseSchema,
				},
			},
		),
)
