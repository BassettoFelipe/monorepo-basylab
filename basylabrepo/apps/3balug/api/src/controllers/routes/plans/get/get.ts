import { Elysia } from 'elysia'
import { plans } from '@/container'
import { getPlanParamsSchema, getPlanResponseSchema } from './schema'

export const getPlanController = new Elysia().get(
	'/plans/:id',
	async ({ params }) => {
		return await plans.getPlan.execute({ planId: params.id })
	},
	{
		params: getPlanParamsSchema,
		response: getPlanResponseSchema,
	},
)
