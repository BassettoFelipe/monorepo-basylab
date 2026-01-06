import { RandomUtils } from '@basylab/core/crypto'
import { BadRequestError, NotFoundError } from '@basylab/core/errors'
import Elysia, { t } from 'elysia'
import { TenantRepository } from '../../repositories'
import { authMiddleware, ownerOnlyMiddleware } from '../middlewares'

export const tenantRoutes = new Elysia({ prefix: '/tenants' })
	.use(authMiddleware)
	.get('/', async ({ user }) => {
		if (user.role === 'owner') {
			return TenantRepository.findAll()
		}
		return TenantRepository.findByManagerId(user.userId)
	})
	.get(
		'/:tenantId',
		async ({ params, user }) => {
			const tenant = await TenantRepository.findById(params.tenantId)

			if (!tenant) {
				throw new NotFoundError('Tenant não encontrado')
			}

			if (user.role !== 'owner') {
				const hasAccess = await TenantRepository.isManagerOfTenant(user.userId, params.tenantId)
				if (!hasAccess) {
					throw new NotFoundError('Tenant não encontrado')
				}
			}

			return tenant
		},
		{
			params: t.Object({
				tenantId: t.String(),
			}),
		},
	)
	.use(ownerOnlyMiddleware)
	.post(
		'/',
		async ({ body }) => {
			const existingTenant = await TenantRepository.findBySlug(body.slug)
			if (existingTenant) {
				throw new BadRequestError('Slug já está em uso')
			}

			const apiKey = RandomUtils.generateApiKey()

			return TenantRepository.create({
				...body,
				apiKey,
			})
		},
		{
			body: t.Object({
				name: t.String({ minLength: 1, maxLength: 100 }),
				slug: t.String({ minLength: 1, maxLength: 50 }),
				logoUrl: t.Optional(t.String()),
				domain: t.Optional(t.String()),
				description: t.Optional(t.String()),
				settings: t.Optional(t.Record(t.String(), t.Unknown())),
			}),
		},
	)
	.put(
		'/:tenantId',
		async ({ params, body }) => {
			const tenant = await TenantRepository.findById(params.tenantId)

			if (!tenant) {
				throw new NotFoundError('Tenant não encontrado')
			}

			if (body.slug && body.slug !== tenant.slug) {
				const existingTenant = await TenantRepository.findBySlug(body.slug)
				if (existingTenant) {
					throw new BadRequestError('Slug já está em uso')
				}
			}

			return TenantRepository.update(params.tenantId, body)
		},
		{
			params: t.Object({
				tenantId: t.String(),
			}),
			body: t.Object({
				name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
				slug: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
				logoUrl: t.Optional(t.String()),
				domain: t.Optional(t.String()),
				description: t.Optional(t.String()),
				settings: t.Optional(t.Record(t.String(), t.Unknown())),
				isActive: t.Optional(t.Boolean()),
			}),
		},
	)
	.delete(
		'/:tenantId',
		async ({ params }) => {
			const tenant = await TenantRepository.findById(params.tenantId)

			if (!tenant) {
				throw new NotFoundError('Tenant não encontrado')
			}

			await TenantRepository.delete(params.tenantId)

			return { success: true }
		},
		{
			params: t.Object({
				tenantId: t.String(),
			}),
		},
	)
	.post(
		'/:tenantId/regenerate-key',
		async ({ params }) => {
			const tenant = await TenantRepository.findById(params.tenantId)

			if (!tenant) {
				throw new NotFoundError('Tenant não encontrado')
			}

			const apiKey = RandomUtils.generateApiKey()

			const updated = await TenantRepository.update(params.tenantId, {
				apiKey,
				apiKeyCreatedAt: new Date(),
			})

			return { apiKey: updated.apiKey }
		},
		{
			params: t.Object({
				tenantId: t.String(),
			}),
		},
	)
