import { PasswordUtils } from '@basylab/core/crypto'
import { UnauthorizedError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { signAccessToken, signRefreshToken } from '@/utils/jwt'

const logger = createLogger({ service: 'login-use-case' })

type LoginInput = {
	email: string
	password: string
}

type LoginOutput = {
	accessToken: string
	refreshToken: string
	user: {
		id: string
		email: string
		name: string
		role: 'owner' | 'manager'
	}
}

export class LoginUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: LoginInput): Promise<LoginOutput> {
		const { email, password } = input

		const normalizedEmail = email.toLowerCase().trim()

		const user = await this.userRepository.findByEmail(normalizedEmail)

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

		const [accessToken, refreshToken] = await Promise.all([
			signAccessToken(payload),
			signRefreshToken(payload),
		])

		logger.info({ userId: user.id, email: user.email }, 'Login realizado com sucesso')

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
	}
}
