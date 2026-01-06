import { AccountDeactivatedError, InvalidTokenError, UserNotFoundError } from '@basylab/core/errors'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { JwtUtils } from '@/utils/jwt.utils'

type RefreshTokensOutput = {
	accessToken: string
	refreshToken: string
}

export class RefreshTokensUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(refreshToken: string): Promise<RefreshTokensOutput> {
		const payload = await JwtUtils.verifyToken(refreshToken, 'refresh')

		if (!payload) {
			throw new InvalidTokenError('Sua sessão expirou. Por favor, faça login novamente.')
		}

		const user = await this.userRepository.findById(payload.sub)
		if (!user) {
			throw new UserNotFoundError()
		}

		if (!user.isActive) {
			throw new AccountDeactivatedError()
		}

		const [accessToken, newRefreshToken] = await Promise.all([
			JwtUtils.generateToken(user.id, 'access', {
				role: user.role,
				companyId: user.companyId,
			}),
			JwtUtils.generateToken(user.id, 'refresh', {
				role: user.role,
				companyId: user.companyId,
			}),
		])

		return {
			accessToken,
			refreshToken: newRefreshToken,
		}
	}
}
