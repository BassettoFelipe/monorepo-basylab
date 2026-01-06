import { PasswordUtils } from '@basylab/core/crypto'
import { BadRequestError, ConflictError, InternalServerError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { User } from '@/db/schema'
import type { IUserRepository } from '@/repositories/contracts/user.repository'

const logger = createLogger({ service: 'create-manager-use-case' })

type CreateManagerInput = {
	email: string
	name: string
	password: string
}

type CreateManagerOutput = Omit<User, 'passwordHash'>

export class CreateManagerUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: CreateManagerInput): Promise<CreateManagerOutput> {
		const { email, name, password } = input

		if (!email || email.trim().length === 0) {
			throw new BadRequestError('Email é obrigatório')
		}

		if (!name || name.trim().length === 0) {
			throw new BadRequestError('Nome é obrigatório')
		}

		if (!password || password.length < 6) {
			throw new BadRequestError('Senha deve ter pelo menos 6 caracteres')
		}

		const normalizedEmail = email.toLowerCase().trim()

		const existingUser = await this.userRepository.findByEmail(normalizedEmail)
		if (existingUser) {
			throw new ConflictError('Email já está em uso')
		}

		try {
			const passwordHash = await PasswordUtils.hash(password)

			const user = await this.userRepository.create({
				email: normalizedEmail,
				name: name.trim(),
				passwordHash,
				role: 'manager',
				isActive: true,
			})

			logger.info({ userId: user.id, email: user.email }, 'Manager criado com sucesso')

			const { passwordHash: _, ...userWithoutPassword } = user
			return userWithoutPassword
		} catch (error) {
			if (error instanceof BadRequestError || error instanceof ConflictError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao criar manager')
			throw new InternalServerError('Erro ao criar manager. Tente novamente.')
		}
	}
}
