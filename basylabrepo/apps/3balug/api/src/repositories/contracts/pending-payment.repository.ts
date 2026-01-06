import type { NewPendingPayment, PendingPayment } from '@/db/schema/pending-payments'
import type { NewSubscription } from '@/db/schema/subscriptions'
import type { NewUser } from '@/db/schema/users'

export interface IPendingPaymentRepository {
	findById(id: string): Promise<PendingPayment | null>
	findByEmail(email: string): Promise<PendingPayment | null>
	findByOrderId(orderId: string): Promise<PendingPayment | null>
	create(data: NewPendingPayment): Promise<PendingPayment>
	update(id: string, data: Partial<NewPendingPayment>): Promise<PendingPayment | null>
	delete(id: string): Promise<boolean>
	deleteExpired(beforeDate: Date): Promise<number>
	processPaymentWithTransaction(params: {
		pendingPaymentId: string
		webhookId: string
		userId?: string
		newUser?: NewUser
		subscription: NewSubscription
	}): Promise<{ userId: string; subscription: { id: string } }>
}
