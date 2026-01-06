import { PasswordUtils } from '@basylab/core/crypto'
import { UnauthorizedError } from '@basylab/core/errors'
import Elysia, { t } from 'elysia'
import { UserRepository } from '../../repositories'
import { signAccessToken, signRefreshToken, verifyToken } from '../../utils/jwt'
import { authMiddleware } from '../middlewares'

export const authRoutes = new Elysia({ prefix: '/auth' })
	.post(
		'/login',
		async ({ body }) => {
			const { email, password } = body

			const user = await UserRepository.findByEmail(email)

			if (!user) {
				throw new UnauthorizedError('Credenciais inválidas')
			}

			if (!user.isActive) {
				throw new UnauthorizedError('Usuário desativado')
			}

			const isValid = await PasswordUtils.verify(password, user.passwordHash)

			if (!isValid) {
				throw new UnauthorizedError('Credenciais inválidas')
			}

			const payload = {
				userId: user.id,
				email: user.email,
				role: user.role,
			}

			const accessToken = await signAccessToken(payload)
			const refreshToken = await signRefreshToken(payload)

			return {
				accessToken,
				refreshToken,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
				},
			}
		},
		{
			body: t.Object({
				email: t.String({ format: 'email' }),
				password: t.String({ minLength: 1 }),
			}),
		},
	)
	.post(
		'/refresh',
		async ({ body }) => {
			const { refreshToken } = body

			try {
				const payload = await verifyToken(refreshToken)

				const user = await UserRepository.findById(payload.userId)

				if (!user || !user.isActive) {
					throw new UnauthorizedError('Usuário não encontrado ou desativado')
				}

				const newPayload = {
					userId: user.id,
					email: user.email,
					role: user.role,
				}

				const accessToken = await signAccessToken(newPayload)
				const newRefreshToken = await signRefreshToken(newPayload)

				return {
					accessToken,
					refreshToken: newRefreshToken,
				}
			} catch {
				throw new UnauthorizedError('Refresh token inválido')
			}
		},
		{
			body: t.Object({
				refreshToken: t.String(),
			}),
		},
	)
	.use(authMiddleware)
	.get('/me', async ({ user }) => {
		const fullUser = await UserRepository.findById(user.userId)

		if (!fullUser) {
			throw new UnauthorizedError('Usuário não encontrado')
		}

		return {
			id: fullUser.id,
			email: fullUser.email,
			name: fullUser.name,
			role: fullUser.role,
			isActive: fullUser.isActive,
			createdAt: fullUser.createdAt,
		}
	})
