import { PasswordUtils } from '@basylab/core/crypto'
import { BadRequestError, NotFoundError } from '@basylab/core/errors'
import Elysia, { t } from 'elysia'
import { TenantRepository, UserRepository } from '../../repositories'
import { ownerOnlyMiddleware } from '../middlewares'

export const managerRoutes = new Elysia({ prefix: '/managers' })
	.use(ownerOnlyMiddleware)
	.get('/', async () => {
		return UserRepository.findManagers()
	})
	.get(
		'/:id',
		async ({ params }) => {
			const manager = await UserRepository.findById(params.id)

			if (!manager || manager.role !== 'manager') {
				throw new NotFoundError('Manager não encontrado')
			}

			return manager
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.post(
		'/',
		async ({ body }) => {
			const existingUser = await UserRepository.findByEmail(body.email)
			if (existingUser) {
				throw new BadRequestError('Email já está em uso')
			}

			const passwordHash = await PasswordUtils.hash(body.password)

			return UserRepository.create({
				email: body.email,
				name: body.name,
				passwordHash,
				role: 'manager',
				isActive: true,
			})
		},
		{
			body: t.Object({
				email: t.String({ format: 'email' }),
				name: t.String({ minLength: 1, maxLength: 100 }),
				password: t.String({ minLength: 6 }),
			}),
		},
	)
	.put(
		'/:id',
		async ({ params, body }) => {
			const manager = await UserRepository.findById(params.id)

			if (!manager || manager.role !== 'manager') {
				throw new NotFoundError('Manager não encontrado')
			}

			const updateData: Record<string, unknown> = {}

			if (body.name) updateData.name = body.name
			if (body.isActive !== undefined) updateData.isActive = body.isActive

			if (body.email && body.email !== manager.email) {
				const existingUser = await UserRepository.findByEmail(body.email)
				if (existingUser) {
					throw new BadRequestError('Email já está em uso')
				}
				updateData.email = body.email
			}

			if (body.password) {
				updateData.passwordHash = await PasswordUtils.hash(body.password)
			}

			return UserRepository.update(params.id, updateData)
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				email: t.Optional(t.String({ format: 'email' })),
				name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
				password: t.Optional(t.String({ minLength: 6 })),
				isActive: t.Optional(t.Boolean()),
			}),
		},
	)
	.delete(
		'/:id',
		async ({ params }) => {
			const manager = await UserRepository.findById(params.id)

			if (!manager || manager.role !== 'manager') {
				throw new NotFoundError('Manager não encontrado')
			}

			await UserRepository.delete(params.id)

			return { success: true }
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.post(
		'/:id/tenants',
		async ({ params, body }) => {
			const manager = await UserRepository.findById(params.id)

			if (!manager || manager.role !== 'manager') {
				throw new NotFoundError('Manager não encontrado')
			}

			const tenant = await TenantRepository.findById(body.tenantId)

			if (!tenant) {
				throw new NotFoundError('Tenant não encontrado')
			}

			await TenantRepository.assignManager(body.tenantId, params.id)

			return { success: true }
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				tenantId: t.String(),
			}),
		},
	)
	.delete(
		'/:id/tenants/:tenantId',
		async ({ params }) => {
			const manager = await UserRepository.findById(params.id)

			if (!manager || manager.role !== 'manager') {
				throw new NotFoundError('Manager não encontrado')
			}

			await TenantRepository.removeManager(params.tenantId, params.id)

			return { success: true }
		},
		{
			params: t.Object({
				id: t.String(),
				tenantId: t.String(),
			}),
		},
	)
