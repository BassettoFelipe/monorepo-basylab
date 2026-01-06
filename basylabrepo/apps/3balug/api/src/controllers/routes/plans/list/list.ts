import { Elysia } from 'elysia'
import { plans } from '@/container'
import { listPlansResponseSchema } from './schema'

export const listPlansController = new Elysia().get(
	'/plans',
	async () => {
		return await plans.listPlans.execute()
	},
	{
		response: listPlansResponseSchema,
	},
)
