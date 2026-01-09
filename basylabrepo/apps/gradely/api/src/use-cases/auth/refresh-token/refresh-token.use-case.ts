import { AccountDeactivatedError, InvalidTokenError, UserNotFoundError } from '@basylab/core/errors'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { JwtUtils } from '@/utils/jwt.utils'

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
		const payload = await JwtUtils.verifyToken(input.refreshToken, 'refresh')

		if (!payload) {
			throw new InvalidTokenError('Token de atualização inválido ou expirado')
		}

		const user = await this.userRepository.findByIdForRefresh(payload.sub)

		if (!user) {
			throw new UserNotFoundError()
		}

		if (!user.isActive) {
			throw new AccountDeactivatedError()
		}

		const [accessToken, refreshToken] = await Promise.all([
			JwtUtils.generateToken(user.id, 'access', { role: user.role }),
			JwtUtils.generateToken(user.id, 'refresh', { role: user.role }),
		])

		return {
			accessToken,
			refreshToken,
		}
	}
}
