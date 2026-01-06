import { Elysia } from 'elysia'
import { container } from '@/container'
import { requireRole } from '@/controllers/middlewares/acl.middleware'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserState } from '@/controllers/middlewares/user-validation.middleware'
import { USER_ROLES } from '@/types/roles'
import { createContractBodySchema, createContractResponseSchema } from './schema'

export const createContractController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserState)
		.use(requireRole([USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER]))
		.post(
			'/contracts',
			async ({ validatedUser, body }) => {
				const result = await container.contracts.create.execute({
					propertyId: body.propertyId,
					tenantId: body.tenantId,
					brokerId: body.brokerId,
					startDate: new Date(body.startDate),
					endDate: new Date(body.endDate),
					rentalAmount: body.rentalAmount,
					paymentDay: body.paymentDay,
					depositAmount: body.depositAmount,
					notes: body.notes,
					createdBy: validatedUser,
				})

				return {
					success: true,
					message: 'Contrato criado com sucesso',
					data: result,
				}
			},
			{
				body: createContractBodySchema,
				response: {
					200: createContractResponseSchema,
				},
				detail: {
					summary: 'Criar contrato de locação',
					description: 'Cria um novo contrato de locação vinculando imóvel e locatário',
					tags: ['Contratos'],
				},
			},
		),
)
