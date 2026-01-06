import { BadRequestError, NotFoundError } from '@basylab/core/errors'
import Elysia, { t } from 'elysia'
import { FeatureRepository, PlanRepository, TenantRepository } from '../../repositories'
import { authMiddleware } from '../middlewares'

export const planRoutes = new Elysia({ prefix: '/tenants/:tenantId/plans' })
	.use(authMiddleware)
	.guard({
		params: t.Object({
			tenantId: t.String(),
		}),
	})
	.resolve(async ({ params, user }) => {
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

		return { tenant }
	})
	.get('/', async ({ params }) => {
		return PlanRepository.findByTenantId(params.tenantId)
	})
	.get(
		'/:planId',
		async ({ params }) => {
			const plan = await PlanRepository.findById(params.planId)

			if (!plan || plan.tenantId !== params.tenantId) {
				throw new NotFoundError('Plano não encontrado')
			}

			return plan
		},
		{
			params: t.Object({
				tenantId: t.String(),
				planId: t.String(),
			}),
		},
	)
	.post(
		'/',
		async ({ params, body }) => {
			const existingPlan = await PlanRepository.findByTenantAndSlug(params.tenantId, body.slug)
			if (existingPlan) {
				throw new BadRequestError('Slug já está em uso neste tenant')
			}

			return PlanRepository.create({
				...body,
				tenantId: params.tenantId,
			})
		},
		{
			body: t.Object({
				name: t.String({ minLength: 1, maxLength: 100 }),
				slug: t.String({ minLength: 1, maxLength: 50 }),
				description: t.Optional(t.String()),
				priceCents: t.Number({ minimum: 0 }),
				currency: t.Optional(t.String({ maxLength: 3 })),
				billingInterval: t.Optional(t.Union([t.Literal('monthly'), t.Literal('yearly')])),
				displayOrder: t.Optional(t.Number()),
			}),
		},
	)
	.put(
		'/:planId',
		async ({ params, body }) => {
			const plan = await PlanRepository.findById(params.planId)

			if (!plan || plan.tenantId !== params.tenantId) {
				throw new NotFoundError('Plano não encontrado')
			}

			if (body.slug && body.slug !== plan.slug) {
				const existingPlan = await PlanRepository.findByTenantAndSlug(params.tenantId, body.slug)
				if (existingPlan) {
					throw new BadRequestError('Slug já está em uso neste tenant')
				}
			}

			return PlanRepository.update(params.planId, body)
		},
		{
			params: t.Object({
				tenantId: t.String(),
				planId: t.String(),
			}),
			body: t.Object({
				name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
				slug: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
				description: t.Optional(t.String()),
				priceCents: t.Optional(t.Number({ minimum: 0 })),
				currency: t.Optional(t.String({ maxLength: 3 })),
				billingInterval: t.Optional(t.Union([t.Literal('monthly'), t.Literal('yearly')])),
				isActive: t.Optional(t.Boolean()),
				displayOrder: t.Optional(t.Number()),
			}),
		},
	)
	.delete(
		'/:planId',
		async ({ params }) => {
			const plan = await PlanRepository.findById(params.planId)

			if (!plan || plan.tenantId !== params.tenantId) {
				throw new NotFoundError('Plano não encontrado')
			}

			await PlanRepository.delete(params.planId)

			return { success: true }
		},
		{
			params: t.Object({
				tenantId: t.String(),
				planId: t.String(),
			}),
		},
	)
	.post(
		'/:planId/features',
		async ({ params, body }) => {
			const plan = await PlanRepository.findById(params.planId)

			if (!plan || plan.tenantId !== params.tenantId) {
				throw new NotFoundError('Plano não encontrado')
			}

			const feature = await FeatureRepository.findById(body.featureId)

			if (!feature) {
				throw new NotFoundError('Feature não encontrada')
			}

			await PlanRepository.assignFeature(params.planId, body.featureId, body.value)

			return { success: true }
		},
		{
			params: t.Object({
				tenantId: t.String(),
				planId: t.String(),
			}),
			body: t.Object({
				featureId: t.String(),
				value: t.Optional(t.Unknown()),
			}),
		},
	)
	.delete(
		'/:planId/features/:featureId',
		async ({ params }) => {
			const plan = await PlanRepository.findById(params.planId)

			if (!plan || plan.tenantId !== params.tenantId) {
				throw new NotFoundError('Plano não encontrado')
			}

			await PlanRepository.removeFeature(params.planId, params.featureId)

			return { success: true }
		},
		{
			params: t.Object({
				tenantId: t.String(),
				planId: t.String(),
				featureId: t.String(),
			}),
		},
	)
