import {
	OperationNotAllowedError,
	PlanNotFoundError,
	SubscriptionNotFoundError,
} from '@basylab/core/errors'
import type { User } from '@/db/schema/users'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { ISubscriptionRepository } from '@/repositories/contracts/subscription.repository'

type ChangePlanInput = {
	user: User
	planId: string
}

type ChangePlanOutput = {
	success: true
	message: string
	subscription: {
		id: string
		planId: string
		plan: {
			id: string
			name: string
			price: number
		}
	}
}

export class ChangePlanUseCase {
	constructor(
		private readonly subscriptionRepository: ISubscriptionRepository,
		private readonly planRepository: IPlanRepository,
	) {}

	async execute(input: ChangePlanInput): Promise<ChangePlanOutput> {
		const subscription = await this.subscriptionRepository.findCurrentByUserId(input.user.id)

		if (!subscription) {
			throw new SubscriptionNotFoundError()
		}

		if (subscription.status !== 'pending') {
			throw new OperationNotAllowedError('Apenas assinaturas pendentes podem ter o plano alterado')
		}

		const newPlan = await this.planRepository.findById(input.planId)

		if (!newPlan) {
			throw new PlanNotFoundError()
		}

		if (subscription.planId === input.planId) {
			throw new OperationNotAllowedError('Você já está neste plano')
		}

		const updatedSubscription = await this.subscriptionRepository.update(subscription.id, {
			planId: input.planId,
		})

		if (!updatedSubscription) {
			throw new OperationNotAllowedError('Falha ao atualizar a assinatura')
		}

		return {
			success: true,
			message: 'Plano alterado com sucesso',
			subscription: {
				id: updatedSubscription.id,
				planId: updatedSubscription.planId,
				plan: {
					id: newPlan.id,
					name: newPlan.name,
					price: newPlan.price,
				},
			},
		}
	}
}
