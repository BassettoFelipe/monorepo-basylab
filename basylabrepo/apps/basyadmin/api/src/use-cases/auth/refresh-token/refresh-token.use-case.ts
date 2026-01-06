import { UnauthorizedError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { signAccessToken, signRefreshToken, verifyToken } from '@/utils/jwt'

const logger = createLogger({ service: 'refresh-token-use-case' })

type RefreshTokenInput = {
	refreshToken: string
}

type RefreshTokenOutput = {
	accessToken: string
	refreshToken: string
}

export class RefreshTokenUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
		const { refreshToken } = input

		try {
			const payload = await verifyToken(refreshToken)

			const user = await this.userRepository.findById(payload.userId)

			if (!user || !user.isActive) {
				throw new UnauthorizedError('Usuário não encontrado ou desativado')
			}

			const newPayload = {
				userId: user.id,
				email: user.email,
				role: user.role,
			}

			const [accessToken, newRefreshToken] = await Promise.all([
				signAccessToken(newPayload),
				signRefreshToken(newPayload),
			])

			logger.debug({ userId: user.id }, 'Token refreshed')

			return {
				accessToken,
				refreshToken: newRefreshToken,
			}
		} catch (error) {
			if (error instanceof UnauthorizedError) {
				throw error
			}
			throw new UnauthorizedError('Refresh token inválido')
		}
	}
}
