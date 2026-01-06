import { PasswordUtils } from '@basylab/core/crypto'
import { EmailAlreadyExistsError, PlanNotFoundError, WeakPasswordError } from '@basylab/core/errors'
import { Validators } from '@basylab/core/validation'
import type { IPendingPaymentRepository } from '@/repositories/contracts/pending-payment.repository'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'

type CreatePendingPaymentInput = {
	email: string
	password: string
	name: string
	planId: string
}

type CreatePendingPaymentOutput = {
	pendingPaymentId: string
	expiresAt: string
}

export class CreatePendingPaymentUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly planRepository: IPlanRepository,
		private readonly pendingPaymentRepository: IPendingPaymentRepository,
	) {}

	async execute(input: CreatePendingPaymentInput): Promise<CreatePendingPaymentOutput> {
		const passwordErrors = Validators.validatePasswordStrength(input.password)
		if (passwordErrors.length > 0) {
			throw new WeakPasswordError(`A senha deve conter: ${passwordErrors.join(', ')}`)
		}

		const existingUser = await this.userRepository.findByEmail(input.email)
		if (existingUser?.isEmailVerified) {
			throw new EmailAlreadyExistsError()
		}

		const existingPendingPayment = await this.pendingPaymentRepository.findByEmail(input.email)
		if (existingPendingPayment && existingPendingPayment.status === 'pending') {
			if (new Date(existingPendingPayment.expiresAt) > new Date()) {
				return {
					pendingPaymentId: existingPendingPayment.id,
					expiresAt: existingPendingPayment.expiresAt.toISOString(),
				}
			}
		}

		const plan = await this.planRepository.findById(input.planId)
		if (!plan) {
			throw new PlanNotFoundError()
		}

		const hashedPassword = await PasswordUtils.hash(input.password)

		const expiresAt = new Date()
		expiresAt.setMinutes(expiresAt.getMinutes() + 30)

		const pendingPayment = await this.pendingPaymentRepository.create({
			email: input.email,
			password: hashedPassword,
			name: input.name,
			planId: input.planId,
			status: 'pending',
			expiresAt,
		})

		return {
			pendingPaymentId: pendingPayment.id,
			expiresAt: pendingPayment.expiresAt.toISOString(),
		}
	}
}
