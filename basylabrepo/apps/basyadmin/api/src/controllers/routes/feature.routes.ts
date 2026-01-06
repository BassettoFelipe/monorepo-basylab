import { BadRequestError, NotFoundError } from '@basylab/core/errors'
import Elysia, { t } from 'elysia'
import { FeatureRepository } from '../../repositories'
import { authMiddleware, ownerOnlyMiddleware } from '../middlewares'

export const featureRoutes = new Elysia({ prefix: '/features' })
	.use(authMiddleware)
	.get('/', async () => {
		return FeatureRepository.findAll()
	})
	.get(
		'/:id',
		async ({ params }) => {
			const feature = await FeatureRepository.findById(params.id)

			if (!feature) {
				throw new NotFoundError('Feature não encontrada')
			}

			return feature
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.use(ownerOnlyMiddleware)
	.post(
		'/',
		async ({ body }) => {
			const existingFeature = await FeatureRepository.findBySlug(body.slug)
			if (existingFeature) {
				throw new BadRequestError('Slug já está em uso')
			}

			return FeatureRepository.create(body)
		},
		{
			body: t.Object({
				name: t.String({ minLength: 1, maxLength: 100 }),
				slug: t.String({ minLength: 1, maxLength: 50 }),
				description: t.Optional(t.String()),
				featureType: t.Optional(
					t.Union([t.Literal('boolean'), t.Literal('limit'), t.Literal('tier')]),
				),
			}),
		},
	)
	.put(
		'/:id',
		async ({ params, body }) => {
			const feature = await FeatureRepository.findById(params.id)

			if (!feature) {
				throw new NotFoundError('Feature não encontrada')
			}

			if (body.slug && body.slug !== feature.slug) {
				const existingFeature = await FeatureRepository.findBySlug(body.slug)
				if (existingFeature) {
					throw new BadRequestError('Slug já está em uso')
				}
			}

			return FeatureRepository.update(params.id, body)
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
				slug: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
				description: t.Optional(t.String()),
				featureType: t.Optional(
					t.Union([t.Literal('boolean'), t.Literal('limit'), t.Literal('tier')]),
				),
			}),
		},
	)
	.delete(
		'/:id',
		async ({ params }) => {
			const feature = await FeatureRepository.findById(params.id)

			if (!feature) {
				throw new NotFoundError('Feature não encontrada')
			}

			await FeatureRepository.delete(params.id)

			return { success: true }
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
