import { Elysia } from 'elysia'
import { container } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { USER_ROLES } from '@/types/roles'
import {
	updateContractBodySchema,
	updateContractParamsSchema,
	updateContractResponseSchema,
} from './schema'

export const updateContractController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER]))
		.patch(
			'/contracts/:id',
			async ({ validatedUser, params, body }) => {
				const result = await container.contracts.update.execute({
					id: params.id,
					rentalAmount: body.rentalAmount,
					paymentDay: body.paymentDay,
					depositAmount: body.depositAmount,
					notes: body.notes,
					updatedBy: validatedUser,
				})

				return {
					success: true,
					message: 'Contrato atualizado com sucesso',
					data: result,
				}
			},
			{
				params: updateContractParamsSchema,
				body: updateContractBodySchema,
				response: {
					200: updateContractResponseSchema,
				},
				detail: {
					summary: 'Atualizar contrato',
					description: 'Atualiza dados de um contrato de locação',
					tags: ['Contratos'],
				},
			},
		),
)
