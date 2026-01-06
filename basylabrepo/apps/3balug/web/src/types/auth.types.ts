import type { Subscription, SubscriptionStatus } from './subscription.types'
import type { User, UserRole } from './user.types'

export interface RegisterData {
	name: string
	companyName: string
	email: string
	password: string
	planId: string
}

export interface LoginResponse {
	success: boolean
	message: string
	data: {
		user: User
		subscription: Subscription | null
		accessToken: string
		refreshToken: string
		checkoutToken?: string
		checkoutExpiresAt?: string
	}
}

export interface RegisterResponse {
	success: boolean
	message: string
	data: {
		user: {
			email: string
			name: string
		}
	}
}

export interface ConfirmEmailData {
	email: string
	code: string
}

export interface ConfirmEmailResponse {
	success: boolean
	message: string
	checkoutToken: string
	checkoutExpiresAt: string
}

export interface CheckoutInfo {
	user: {
		name: string
		email: string
	}
	subscription: {
		id: string
		status: string
	}
	plan: {
		id: string
		name: string
		price: number
		features: string[]
	}
}

export interface ActivateSubscriptionData {
	cardToken: string
	payerDocument: string
	installments?: number
}

export interface ActivateSubscriptionResponse {
	success: boolean
	message: string
	subscriptionId: string
	status: string
}

export interface ResendVerificationCodeData {
	email: string
}

export interface ResendVerificationCodeResponse {
	success: boolean
	message: string
	remainingAttempts: number
	canResendAt: string
	isBlocked: boolean
	blockedUntil: string | null
}

export interface ResendStatusResponse {
	remainingAttempts: number
	canResendAt: string | null
	canResend: boolean
	isBlocked: boolean
	blockedUntil: string | null
}

export interface MeResponse {
	user: {
		id: string
		name: string
		email: string
		role: UserRole
		phone: string | null
		avatarUrl: string | null
		companyId: string | null
		createdBy: string | null
		isActive: boolean
		isEmailVerified: boolean
		createdAt: string
		updatedAt: string
		hasPendingCustomFields: boolean
		subscription: {
			id: string
			userId: string
			status: SubscriptionStatus
			daysRemaining: number | null
			startDate: string | null
			endDate: string | null
			planId: string
			plan: {
				id: string
				name: string
				price: number
			}
		} | null
	}
}
