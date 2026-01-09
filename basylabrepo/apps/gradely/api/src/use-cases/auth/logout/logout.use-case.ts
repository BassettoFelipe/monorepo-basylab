import { InvalidTokenError } from '@basylab/core/errors'
import { JwtUtils } from '@/utils/jwt.utils'
import { TokenBlacklist } from '@/utils/token-blacklist'

type LogoutInput = {
	accessToken: string
	refreshToken: string
}

type LogoutOutput = {
	success: boolean
}

export class LogoutUseCase {
	async execute(input: LogoutInput): Promise<LogoutOutput> {
		const accessPayload = await JwtUtils.verifyToken(input.accessToken, 'access')
		const refreshPayload = await JwtUtils.verifyToken(input.refreshToken, 'refresh')

		if (!accessPayload && !refreshPayload) {
			throw new InvalidTokenError('Tokens inválidos')
		}

		if (accessPayload) {
			const accessExpiresIn = accessPayload.exp - Math.floor(Date.now() / 1000)
			if (accessExpiresIn > 0) {
				TokenBlacklist.add(input.accessToken, accessExpiresIn)
			}
		}

		if (refreshPayload) {
			const refreshExpiresIn = refreshPayload.exp - Math.floor(Date.now() / 1000)
			if (refreshExpiresIn > 0) {
				TokenBlacklist.add(input.refreshToken, refreshExpiresIn)
			}
		}

		return { success: true }
	}
}
