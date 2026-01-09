import { PasswordUtils } from '@basylab/core/crypto'
import { AccountDeactivatedError, InvalidCredentialsError } from '@basylab/core/errors'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { JwtUtils } from '@/utils/jwt.utils'

type LoginInput = {
	email: string
	password: string
}

type LoginOutput = {
	user: {
		id: string
		email: string
		name: string
		role: string
	}
	accessToken: string
	refreshToken: string
}

export class LoginUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: LoginInput): Promise<LoginOutput> {
		const normalizedEmail = input.email.toLowerCase().trim()
		const user = await this.userRepository.findByEmailForAuth(normalizedEmail)

		if (!user?.password) {
			throw new InvalidCredentialsError()
		}

		// Verificar isActive ANTES do bcrypt para economizar ~100ms de CPU
		if (!user.isActive) {
			throw new AccountDeactivatedError()
		}

		const isPasswordValid = await PasswordUtils.verify(input.password, user.password)

		if (!isPasswordValid) {
			throw new InvalidCredentialsError()
		}

		const [accessToken, refreshToken] = await Promise.all([
			JwtUtils.generateToken(user.id, 'access', { role: user.role }),
			JwtUtils.generateToken(user.id, 'refresh', { role: user.role }),
		])

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
			accessToken,
			refreshToken,
		}
	}
}
