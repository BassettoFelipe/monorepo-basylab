import { Elysia } from 'elysia'
import { getCompanyController } from './get-company/get-company'
import { updateCompanyController } from './update-company/update-company'

export const companiesRoutes = new Elysia({ prefix: '/api' })
	.use(getCompanyController)
	.use(updateCompanyController)
