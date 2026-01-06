import { UnauthorizedError } from '@basylab/core/errors'
import { eq } from 'drizzle-orm'
import Elysia from 'elysia'
import { db } from '../../db'
import { tenants } from '../../db/schema'
import { type TokenPayload, verifyToken } from '../../utils/jwt'

export type AuthContext = {
	user: TokenPayload
}

export type ApiKeyContext = {
	tenant: {
		id: string
		slug: string
		name: string
	}
}

export const authMiddleware = new Elysia({ name: 'auth-middleware' }).derive(
	{ as: 'scoped' },
	async ({ headers }): Promise<AuthContext> => {
		const authorization = headers.authorization

		if (!authorization?.startsWith('Bearer ')) {
			throw new UnauthorizedError('Token não fornecido')
		}

		const token = authorization.slice(7)

		try {
			const payload = await verifyToken(token)
			return { user: payload }
		} catch {
			throw new UnauthorizedError('Token inválido ou expirado')
		}
	},
)

export const ownerOnlyMiddleware = new Elysia({ name: 'owner-only-middleware' })
	.use(authMiddleware)
	.derive({ as: 'scoped' }, async ({ user }) => {
		if (!user || user.role !== 'owner') {
			throw new UnauthorizedError('Acesso restrito ao owner')
		}
		return {}
	})

export const apiKeyMiddleware = new Elysia({ name: 'api-key-middleware' }).derive(
	{ as: 'scoped' },
	async ({ headers }): Promise<ApiKeyContext> => {
		const apiKey = headers['x-api-key']

		if (!apiKey) {
			throw new UnauthorizedError('API Key não fornecida')
		}

		const tenant = await db.query.tenants.findFirst({
			where: eq(tenants.apiKey, apiKey),
			columns: {
				id: true,
				slug: true,
				name: true,
				isActive: true,
			},
		})

		if (!tenant) {
			throw new UnauthorizedError('API Key inválida')
		}

		if (!tenant.isActive) {
			throw new UnauthorizedError('Tenant desativado')
		}

		return {
			tenant: {
				id: tenant.id,
				slug: tenant.slug,
				name: tenant.name,
			},
		}
	},
)
