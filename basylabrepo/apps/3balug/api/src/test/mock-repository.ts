import type { Company, NewCompany } from '@/db/schema/companies'
import type { Contract, NewContract } from '@/db/schema/contracts'
import { CONTRACT_STATUS } from '@/db/schema/contracts'
import type {
	CustomFieldResponse,
	NewCustomFieldResponse,
} from '@/db/schema/custom-field-responses'
import type { CustomField, NewCustomField } from '@/db/schema/custom-fields'
import type { Document, DocumentEntityType, NewDocument } from '@/db/schema/documents'
import type { NewPendingPayment, PendingPayment } from '@/db/schema/pending-payments'
import type { NewPlan, Plan } from '@/db/schema/plans'
import type { NewProperty, Property } from '@/db/schema/properties'
import { LISTING_TYPES, PROPERTY_STATUS, PROPERTY_TYPES } from '@/db/schema/properties'
import type { NewPropertyOwner, PropertyOwner } from '@/db/schema/property-owners'
import type { NewPropertyPhoto, PropertyPhoto } from '@/db/schema/property-photos'
import type { NewSubscription, Subscription } from '@/db/schema/subscriptions'
import type { NewTenant, Tenant } from '@/db/schema/tenants'
import type { NewUser, User } from '@/db/schema/users'
import type { ICompanyRepository } from '@/repositories/contracts/company.repository'
import type {
	ContractFilters,
	ContractListResult,
	ContractStats,
	IContractRepository,
} from '@/repositories/contracts/contract.repository'
import type { ICustomFieldRepository } from '@/repositories/contracts/custom-field.repository'
import type { ICustomFieldResponseRepository } from '@/repositories/contracts/custom-field-response.repository'
import type { IDocumentRepository } from '@/repositories/contracts/document.repository'
import type { IPendingPaymentRepository } from '@/repositories/contracts/pending-payment.repository'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { IPlanFeatureRepository } from '@/repositories/contracts/plan-feature.repository'
import type {
	IPropertyRepository,
	PropertyFilters,
	PropertyListResult,
	PropertyStats,
} from '@/repositories/contracts/property.repository'
import type {
	IPropertyOwnerRepository,
	PropertyOwnerFilters,
	PropertyOwnerListResult,
	PropertyOwnerWithPropertiesCount,
} from '@/repositories/contracts/property-owner.repository'
import type { IPropertyPhotoRepository } from '@/repositories/contracts/property-photo.repository'
import type {
	CurrentSubscription,
	ISubscriptionRepository,
	SubscriptionStatus,
} from '@/repositories/contracts/subscription.repository'
import type {
	ITenantRepository,
	TenantFilters,
	TenantListResult,
} from '@/repositories/contracts/tenant.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { CachedUserState, IUserCacheService } from '@/services/cache'
import type { PlanFeatureSlug } from '@/types/features'

// Use crypto.randomUUID directly to avoid mock interference from tests that mock @basylab/core/crypto
const generateUUID = (): string => crypto.randomUUID()

export class InMemoryUserRepository implements IUserRepository {
	private users: Map<string, User> = new Map()
	private companyRepository: InMemoryCompanyRepository | null = null
	private subscriptionRepository: InMemorySubscriptionRepository | null = null

	setCompanyRepository(repo: InMemoryCompanyRepository): void {
		this.companyRepository = repo
	}

	setSubscriptionRepository(repo: InMemorySubscriptionRepository): void {
		this.subscriptionRepository = repo
	}

	async findById(id: string): Promise<User | null> {
		return this.users.get(id) ?? null
	}

	async findByEmail(email: string): Promise<User | null> {
		for (const user of this.users.values()) {
			if (user.email === email) {
				return user
			}
		}
		return null
	}

	async findByCompanyId(companyId: string): Promise<User[]> {
		const result: User[] = []
		for (const user of this.users.values()) {
			if (user.companyId === companyId) {
				result.push(user)
			}
		}
		return result
	}

	async create(data: NewUser): Promise<User> {
		const user: User = {
			id: generateUUID(),
			email: data.email,
			password: data.password ?? null,
			name: data.name,
			role: data.role ?? 'owner',
			phone: data.phone ?? null,
			avatarUrl: data.avatarUrl ?? null,
			companyId: data.companyId ?? null,
			createdBy: data.createdBy ?? null,
			isActive: data.isActive ?? true,
			isEmailVerified: data.isEmailVerified ?? false,
			verificationSecret: data.verificationSecret ?? null,
			verificationExpiresAt: data.verificationExpiresAt ?? null,
			verificationAttempts: data.verificationAttempts ?? 0,
			verificationLastAttemptAt: data.verificationLastAttemptAt ?? null,
			verificationResendCount: data.verificationResendCount ?? 0,
			verificationLastResendAt: data.verificationLastResendAt ?? null,
			passwordResetSecret: data.passwordResetSecret ?? null,
			passwordResetExpiresAt: data.passwordResetExpiresAt ?? null,
			passwordResetResendCount: data.passwordResetResendCount ?? 0,
			passwordResetCooldownEndsAt: data.passwordResetCooldownEndsAt ?? null,
			passwordResetAttempts: data.passwordResetAttempts ?? 0,
			passwordResetLastAttemptAt: data.passwordResetLastAttemptAt ?? null,
			passwordResetResendBlocked: data.passwordResetResendBlocked ?? false,
			passwordResetResendBlockedUntil: data.passwordResetResendBlockedUntil ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.users.set(user.id, user)
		return user
	}

	async update(id: string, data: Partial<NewUser>): Promise<User | null> {
		const existing = this.users.get(id)
		if (!existing) return null

		const updated: User = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.users.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.users.delete(id)
	}

	async deleteByEmail(email: string): Promise<boolean> {
		for (const [id, user] of this.users.entries()) {
			if (user.email === email) {
				this.users.delete(id)
				return true
			}
		}
		return false
	}

	async registerWithTransaction(params: {
		user: NewUser
		company: NewCompany
		subscription: Omit<NewSubscription, 'userId'>
	}): Promise<{
		user: User
		companyId: string
		subscriptionId: string
	}> {
		const userId = generateUUID()
		const companyId = generateUUID()
		const subscriptionId = generateUUID()

		const newUser: User = {
			id: userId,
			email: params.user.email,
			password: params.user.password ?? null,
			name: params.user.name,
			role: params.user.role ?? 'owner',
			phone: params.user.phone ?? null,
			avatarUrl: params.user.avatarUrl ?? null,
			companyId,
			createdBy: params.user.createdBy ?? null,
			isActive: params.user.isActive ?? true,
			isEmailVerified: params.user.isEmailVerified ?? false,
			verificationSecret: params.user.verificationSecret ?? null,
			verificationExpiresAt: params.user.verificationExpiresAt ?? null,
			verificationAttempts: params.user.verificationAttempts ?? 0,
			verificationLastAttemptAt: params.user.verificationLastAttemptAt ?? null,
			verificationResendCount: params.user.verificationResendCount ?? 0,
			verificationLastResendAt: params.user.verificationLastResendAt ?? null,
			passwordResetSecret: params.user.passwordResetSecret ?? null,
			passwordResetExpiresAt: params.user.passwordResetExpiresAt ?? null,
			passwordResetResendCount: params.user.passwordResetResendCount ?? 0,
			passwordResetCooldownEndsAt: params.user.passwordResetCooldownEndsAt ?? null,
			passwordResetAttempts: params.user.passwordResetAttempts ?? 0,
			passwordResetLastAttemptAt: params.user.passwordResetLastAttemptAt ?? null,
			passwordResetResendBlocked: params.user.passwordResetResendBlocked ?? false,
			passwordResetResendBlockedUntil: params.user.passwordResetResendBlockedUntil ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		this.users.set(userId, newUser)

		// Create company if repository is set
		if (this.companyRepository) {
			const newCompany: Company = {
				id: companyId,
				name: params.company.name,
				email: params.company.email ?? null,
				phone: params.company.phone ?? null,
				cnpj: params.company.cnpj ?? null,
				address: params.company.address ?? null,
				city: params.company.city ?? null,
				state: params.company.state ?? null,
				zipCode: params.company.zipCode ?? null,
				ownerId: userId,
				settings: params.company.settings ?? {},
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			await this.companyRepository.create(newCompany)
		}

		// Create subscription if repository is set
		if (this.subscriptionRepository) {
			const newSubscription: Subscription = {
				id: subscriptionId,
				userId,
				planId: params.subscription.planId,
				status: params.subscription.status ?? 'active',
				startDate: params.subscription.startDate ?? new Date(),
				endDate: params.subscription.endDate ?? null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			await this.subscriptionRepository.create(newSubscription)
		}

		return {
			user: newUser,
			companyId,
			subscriptionId,
		}
	}

	clear(): void {
		this.users.clear()
	}
}

export class InMemoryPlanRepository implements IPlanRepository {
	private plans: Map<string, Plan> = new Map()

	async findById(id: string): Promise<Plan | null> {
		return this.plans.get(id) ?? null
	}

	async findBySlug(slug: string): Promise<Plan | null> {
		for (const plan of this.plans.values()) {
			if (plan.slug === slug) {
				return plan
			}
		}
		return null
	}

	async findAll(): Promise<Plan[]> {
		return Array.from(this.plans.values())
	}

	async create(data: NewPlan): Promise<Plan> {
		const plan: Plan = {
			id: generateUUID(),
			name: data.name,
			slug: data.slug,
			description: data.description ?? null,
			price: data.price,
			durationDays: data.durationDays ?? 30,
			maxUsers: data.maxUsers !== undefined ? data.maxUsers : 1,
			maxManagers: data.maxManagers ?? 0,
			maxSerasaQueries: data.maxSerasaQueries ?? 0,
			allowsLateCharges: data.allowsLateCharges ?? 0,
			features: data.features ?? [],
			pagarmePlanId: data.pagarmePlanId ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.plans.set(plan.id, plan)
		return plan
	}

	async update(id: string, data: Partial<NewPlan>): Promise<Plan | null> {
		const existing = this.plans.get(id)
		if (!existing) return null

		const updated: Plan = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.plans.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.plans.delete(id)
	}

	seedTestPlans(): void {
		const basicPlan: Plan = {
			id: generateUUID(),
			name: 'Plano Básico',
			slug: 'basico',
			description: 'Plano básico para imobiliárias pequenas',
			price: 9990,
			durationDays: 30,
			maxUsers: 1,
			maxManagers: 0,
			maxSerasaQueries: 100,
			allowsLateCharges: 0,
			features: ['serasaQueries'],
			pagarmePlanId: 'plan_test_basico',
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		const imobiliariaPlan: Plan = {
			id: generateUUID(),
			name: 'Plano Imobiliária',
			slug: 'imobiliaria',
			description: 'Plano completo para imobiliárias',
			price: 29990,
			durationDays: 30,
			maxUsers: 5,
			maxManagers: 0,
			maxSerasaQueries: 500,
			allowsLateCharges: 1,
			features: ['lateCharges', 'multipleUsers'],
			pagarmePlanId: 'plan_test_imobiliaria',
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		const housePlan: Plan = {
			id: generateUUID(),
			name: 'Plano House',
			slug: 'house',
			description: 'Plano enterprise para grandes imobiliárias',
			price: 99990,
			durationDays: 30,
			maxUsers: 20,
			maxManagers: 5,
			maxSerasaQueries: 2000,
			allowsLateCharges: 1,
			features: ['lateCharges', 'multipleUsers', 'managers', 'custom_fields'],
			pagarmePlanId: 'plan_test_house',
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		this.plans.set(basicPlan.id, basicPlan)
		this.plans.set(imobiliariaPlan.id, imobiliariaPlan)
		this.plans.set(housePlan.id, housePlan)
	}

	clear(): void {
		this.plans.clear()
	}
}

export class InMemoryPlanFeatureRepository implements IPlanFeatureRepository {
	private planRepository: InMemoryPlanRepository | null = null

	setPlanRepository(repo: InMemoryPlanRepository): void {
		this.planRepository = repo
	}

	async planHasFeature(planSlug: string, feature: PlanFeatureSlug): Promise<boolean> {
		if (!this.planRepository) {
			throw new Error('Plan repository not set')
		}
		const plan = await this.planRepository.findBySlug(planSlug)
		if (!plan) return false
		return plan.features.includes(feature)
	}

	async getPlanFeatures(planSlug: string): Promise<PlanFeatureSlug[]> {
		if (!this.planRepository) {
			throw new Error('Plan repository not set')
		}
		const plan = await this.planRepository.findBySlug(planSlug)
		return (plan?.features ?? []) as PlanFeatureSlug[]
	}

	async getPlansWithFeature(feature: PlanFeatureSlug): Promise<string[]> {
		if (!this.planRepository) {
			throw new Error('Plan repository not set')
		}
		const plans = await this.planRepository.findAll()
		return plans.filter((plan) => plan.features.includes(feature)).map((plan) => plan.slug)
	}
}

export class InMemorySubscriptionRepository implements ISubscriptionRepository {
	private subscriptions: Map<string, Subscription> = new Map()
	private planRepository: IPlanRepository | null = null

	setPlanRepository(repo: IPlanRepository): void {
		this.planRepository = repo
	}

	async findById(id: string): Promise<Subscription | null> {
		return this.subscriptions.get(id) ?? null
	}

	async findByUserId(userId: string): Promise<Subscription | null> {
		for (const subscription of this.subscriptions.values()) {
			if (subscription.userId === userId) {
				return subscription
			}
		}
		return null
	}

	async findActiveByUserId(userId: string): Promise<Subscription | null> {
		for (const subscription of this.subscriptions.values()) {
			if (subscription.userId === userId && subscription.status === 'active') {
				return subscription
			}
		}
		return null
	}

	async findCurrentByUserId(userId: string): Promise<any> {
		for (const subscription of this.subscriptions.values()) {
			if (subscription.userId === userId) {
				const plan = this.planRepository
					? await this.planRepository.findById(subscription.planId)
					: null

				if (!plan) return null

				const now = new Date()
				let computedStatus: SubscriptionStatus = subscription.status as SubscriptionStatus

				if (
					subscription.status === 'active' &&
					subscription.endDate &&
					subscription.endDate < now
				) {
					computedStatus = 'expired'
				}

				let daysRemaining: number | null = null
				if (subscription.endDate) {
					const diffTime = subscription.endDate.getTime() - now.getTime()
					daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
					if (daysRemaining < 0) daysRemaining = 0
				}

				return {
					id: subscription.id,
					userId: subscription.userId,
					planId: subscription.planId,
					status: subscription.status,
					computedStatus,
					startDate: subscription.startDate,
					endDate: subscription.endDate,
					createdAt: subscription.createdAt,
					updatedAt: subscription.updatedAt,
					plan: {
						id: plan.id,
						name: plan.name,
						slug: plan.slug,
						price: plan.price,
						durationDays: plan.durationDays,
						features: plan.features,
					},
					daysRemaining,
				}
			}
		}
		return null
	}

	async create(data: NewSubscription): Promise<Subscription> {
		const subscription: Subscription = {
			id: generateUUID(),
			userId: data.userId,
			planId: data.planId,
			status: data.status ?? 'pending',
			startDate: data.startDate ?? new Date(),
			endDate: data.endDate ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.subscriptions.set(subscription.id, subscription)
		return subscription
	}

	async update(id: string, data: Partial<NewSubscription>): Promise<Subscription | null> {
		const existing = this.subscriptions.get(id)
		if (!existing) return null

		const updated: Subscription = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.subscriptions.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.subscriptions.delete(id)
	}

	clear(): void {
		this.subscriptions.clear()
	}
}

export class InMemoryPendingPaymentRepository implements IPendingPaymentRepository {
	private payments: Map<string, PendingPayment> = new Map()

	async findById(id: string): Promise<PendingPayment | null> {
		return this.payments.get(id) ?? null
	}

	async findByEmail(email: string): Promise<PendingPayment | null> {
		for (const payment of this.payments.values()) {
			if (payment.email === email) {
				return payment
			}
		}
		return null
	}

	async findByOrderId(orderId: string): Promise<PendingPayment | null> {
		for (const payment of this.payments.values()) {
			if (payment.pagarmeOrderId === orderId) {
				return payment
			}
		}
		return null
	}

	async create(data: NewPendingPayment): Promise<PendingPayment> {
		const payment: PendingPayment = {
			id: generateUUID(),
			email: data.email,
			name: data.name,
			password: data.password,
			planId: data.planId,
			pagarmeOrderId: data.pagarmeOrderId ?? null,
			pagarmeChargeId: data.pagarmeChargeId ?? null,
			processedWebhookId: data.processedWebhookId ?? null,
			status: data.status ?? 'pending',
			expiresAt: data.expiresAt,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.payments.set(payment.id, payment)
		return payment
	}

	async update(id: string, data: Partial<NewPendingPayment>): Promise<PendingPayment | null> {
		const existing = this.payments.get(id)
		if (!existing) return null

		const updated: PendingPayment = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.payments.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.payments.delete(id)
	}

	async deleteExpired(): Promise<number> {
		const now = new Date()
		let deletedCount = 0

		for (const [id, payment] of this.payments.entries()) {
			if (payment.expiresAt < now) {
				this.payments.delete(id)
				deletedCount++
			}
		}

		return deletedCount
	}

	async processPaymentWithTransaction(params: {
		pendingPaymentId: string
		webhookId: string
		userId?: string
		newUser?: NewUser
		subscription: NewSubscription
	}): Promise<{ userId: string; subscription: { id: string } }> {
		const payment = this.payments.get(params.pendingPaymentId)

		if (!payment) {
			throw new Error('Pending payment not found')
		}

		if (payment.processedWebhookId === params.webhookId) {
			throw new Error('Payment already processed')
		}

		if (payment.status !== 'pending') {
			throw new Error('Payment already processed')
		}

		const userId = params.userId || generateUUID()
		const subscriptionId = generateUUID()

		const updated: PendingPayment = {
			...payment,
			status: 'paid',
			processedWebhookId: params.webhookId,
			updatedAt: new Date(),
		}

		this.payments.set(params.pendingPaymentId, updated)

		return {
			userId,
			subscription: { id: subscriptionId },
		}
	}

	clear(): void {
		this.payments.clear()
	}
}

export class InMemoryCompanyRepository implements ICompanyRepository {
	private companies: Map<string, Company> = new Map()

	async findById(id: string): Promise<Company | null> {
		return this.companies.get(id) ?? null
	}

	async findByOwnerId(ownerId: string): Promise<Company | null> {
		for (const company of this.companies.values()) {
			if (company.ownerId === ownerId) {
				return company
			}
		}
		return null
	}

	async findByCnpj(cnpj: string): Promise<Company | null> {
		for (const company of this.companies.values()) {
			if (company.cnpj === cnpj) {
				return company
			}
		}
		return null
	}

	async create(data: NewCompany): Promise<Company> {
		const company: Company = {
			id: generateUUID(),
			name: data.name,
			cnpj: data.cnpj ?? null,
			ownerId: data.ownerId ?? null,
			email: data.email ?? null,
			phone: data.phone ?? null,
			address: data.address ?? null,
			city: data.city ?? null,
			state: data.state ?? null,
			zipCode: data.zipCode ?? null,
			settings: data.settings ?? {},
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.companies.set(company.id, company)
		return company
	}

	async update(id: string, data: Partial<NewCompany>): Promise<Company | null> {
		const existing = this.companies.get(id)
		if (!existing) return null

		const updated: Company = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.companies.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.companies.delete(id)
	}

	async listByOwner(ownerId: string): Promise<Company[]> {
		const result: Company[] = []
		for (const company of this.companies.values()) {
			if (company.ownerId === ownerId) {
				result.push(company)
			}
		}
		return result
	}

	clear(): void {
		this.companies.clear()
	}
}

export class InMemoryCustomFieldRepository implements ICustomFieldRepository {
	private fields: Map<string, CustomField> = new Map()
	private responseRepository?: InMemoryCustomFieldResponseRepository

	setResponseRepository(repo: InMemoryCustomFieldResponseRepository): void {
		this.responseRepository = repo
	}

	async findById(id: string): Promise<CustomField | null> {
		return this.fields.get(id) ?? null
	}

	async findByCompanyId(companyId: string, activeOnly = false): Promise<CustomField[]> {
		const result: CustomField[] = []
		for (const field of this.fields.values()) {
			if (field.companyId === companyId) {
				if (!activeOnly || field.isActive) {
					result.push(field)
				}
			}
		}
		return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
	}

	async findActiveByCompanyId(companyId: string): Promise<CustomField[]> {
		return this.findByCompanyId(companyId, true)
	}

	async hasUserPendingRequiredFields(userId: string, companyId: string): Promise<boolean> {
		const requiredFields = await this.findByCompanyId(companyId, true)
		const activeRequiredFields = requiredFields.filter(
			(field) => field.isRequired && field.isActive,
		)

		if (activeRequiredFields.length === 0) return false

		if (!this.responseRepository) return false

		const userResponses = await this.responseRepository.findByUserId(userId)
		const responseMap = new Map(userResponses.map((r) => [r.fieldId, r.value]))

		for (const field of activeRequiredFields) {
			const value = responseMap.get(field.id)
			if (!value || value.trim() === '') {
				return true
			}
		}

		return false
	}

	async create(data: NewCustomField): Promise<CustomField> {
		const field: CustomField = {
			id: generateUUID(),
			companyId: data.companyId,
			label: data.label,
			type: data.type,
			placeholder: data.placeholder ?? null,
			helpText: data.helpText ?? null,
			isRequired: data.isRequired ?? false,
			options: data.options ?? null,
			allowMultiple: data.allowMultiple ?? null,
			validation: data.validation ?? null,
			fileConfig: data.fileConfig ?? null,
			order: data.order ?? 0,
			isActive: data.isActive ?? true,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.fields.set(field.id, field)
		return field
	}

	async update(id: string, data: Partial<NewCustomField>): Promise<CustomField | null> {
		const existing = this.fields.get(id)
		if (!existing) return null

		const updated: CustomField = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.fields.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.fields.delete(id)
	}

	async reorder(companyId: string, fieldIds: string[]): Promise<void> {
		for (let i = 0; i < fieldIds.length; i++) {
			const field = this.fields.get(fieldIds[i])
			if (field && field.companyId === companyId) {
				field.order = i
				field.updatedAt = new Date()
				this.fields.set(field.id, field)
			}
		}
	}

	clear(): void {
		this.fields.clear()
	}
}

export class InMemoryCustomFieldResponseRepository implements ICustomFieldResponseRepository {
	private responses: Map<string, CustomFieldResponse> = new Map()

	async findById(id: string): Promise<CustomFieldResponse | null> {
		return this.responses.get(id) ?? null
	}

	async findByUserId(userId: string): Promise<CustomFieldResponse[]> {
		const result: CustomFieldResponse[] = []
		for (const response of this.responses.values()) {
			if (response.userId === userId) {
				result.push(response)
			}
		}
		return result
	}

	async findByUserIds(userIds: string[]): Promise<CustomFieldResponse[]> {
		const result: CustomFieldResponse[] = []
		for (const response of this.responses.values()) {
			if (userIds.includes(response.userId)) {
				result.push(response)
			}
		}
		return result
	}

	async findByFieldId(fieldId: string): Promise<CustomFieldResponse[]> {
		const result: CustomFieldResponse[] = []
		for (const response of this.responses.values()) {
			if (response.fieldId === fieldId) {
				result.push(response)
			}
		}
		return result
	}

	async findByUserAndField(userId: string, fieldId: string): Promise<CustomFieldResponse | null> {
		for (const response of this.responses.values()) {
			if (response.userId === userId && response.fieldId === fieldId) {
				return response
			}
		}
		return null
	}

	async create(data: NewCustomFieldResponse): Promise<CustomFieldResponse> {
		const response: CustomFieldResponse = {
			id: generateUUID(),
			userId: data.userId,
			fieldId: data.fieldId,
			value: data.value ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.responses.set(response.id, response)
		return response
	}

	async createMany(data: NewCustomFieldResponse[]): Promise<CustomFieldResponse[]> {
		const results: CustomFieldResponse[] = []
		for (const item of data) {
			const response = await this.create(item)
			results.push(response)
		}
		return results
	}

	async update(
		id: string,
		data: Partial<NewCustomFieldResponse>,
	): Promise<CustomFieldResponse | null> {
		const existing = this.responses.get(id)
		if (!existing) return null

		const updated: CustomFieldResponse = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.responses.set(id, updated)
		return updated
	}

	async upsertByUserAndField(
		userId: string,
		fieldId: string,
		value: string | null,
	): Promise<CustomFieldResponse> {
		const existing = await this.findByUserAndField(userId, fieldId)
		if (existing) {
			const updated = await this.update(existing.id, { value })
			return updated!
		}
		return this.create({ userId, fieldId, value })
	}

	async upsertMany(
		data: Array<{ userId: string; fieldId: string; value: string | null }>,
	): Promise<CustomFieldResponse[]> {
		const results: CustomFieldResponse[] = []
		for (const item of data) {
			const result = await this.upsertByUserAndField(item.userId, item.fieldId, item.value)
			results.push(result)
		}
		return results
	}

	async deleteByUserId(userId: string): Promise<boolean> {
		let deleted = false
		for (const [id, response] of this.responses.entries()) {
			if (response.userId === userId) {
				this.responses.delete(id)
				deleted = true
			}
		}
		return deleted
	}

	clear(): void {
		this.responses.clear()
	}
}

export class InMemoryPropertyOwnerRepository implements IPropertyOwnerRepository {
	owners: Map<string, PropertyOwner> = new Map()

	async findById(id: string): Promise<PropertyOwner | null> {
		return this.owners.get(id) ?? null
	}

	async findByIdWithDetails(id: string): Promise<PropertyOwnerWithPropertiesCount | null> {
		const owner = this.owners.get(id)
		if (!owner) return null
		return { ...owner, propertiesCount: 0 }
	}

	async findByDocument(document: string, companyId: string): Promise<PropertyOwner | null> {
		for (const owner of this.owners.values()) {
			if (owner.document === document && owner.companyId === companyId) {
				return owner
			}
		}
		return null
	}

	async findByEmail(email: string, companyId: string): Promise<PropertyOwner | null> {
		const normalizedEmail = email.toLowerCase().trim()
		for (const owner of this.owners.values()) {
			if (owner.email?.toLowerCase().trim() === normalizedEmail && owner.companyId === companyId) {
				return owner
			}
		}
		return null
	}

	async findByCompanyId(companyId: string): Promise<PropertyOwner[]> {
		const result: PropertyOwner[] = []
		for (const owner of this.owners.values()) {
			if (owner.companyId === companyId) {
				result.push(owner)
			}
		}
		return result
	}

	async list(filters: PropertyOwnerFilters): Promise<PropertyOwnerListResult> {
		const result: PropertyOwner[] = []
		for (const owner of this.owners.values()) {
			if (owner.companyId === filters.companyId) {
				if (filters.createdBy && owner.createdBy !== filters.createdBy) continue
				if (filters.documentType && owner.documentType !== filters.documentType) continue
				if (filters.state && owner.state !== filters.state) continue
				if (filters.city && owner.city?.toLowerCase() !== filters.city.toLowerCase()) continue
				if (filters.hasEmail !== undefined) {
					const hasEmail = !!owner.email && owner.email.trim() !== ''
					if (filters.hasEmail !== hasEmail) continue
				}
				if (filters.hasPhone !== undefined) {
					const hasPhone = !!owner.phone && owner.phone.trim() !== ''
					if (filters.hasPhone !== hasPhone) continue
				}
				if (filters.createdAtStart && owner.createdAt < filters.createdAtStart) continue
				if (filters.createdAtEnd && owner.createdAt > filters.createdAtEnd) continue
				if (filters.search) {
					const search = filters.search.toLowerCase()
					if (
						!owner.name.toLowerCase().includes(search) &&
						!owner.email?.toLowerCase().includes(search) &&
						!owner.document.toLowerCase().includes(search) &&
						!owner.phone?.toLowerCase().includes(search) &&
						!owner.city?.toLowerCase().includes(search)
					) {
						continue
					}
				}
				result.push(owner)
			}
		}

		// Ordenação
		const sortBy = filters.sortBy ?? 'name'
		const sortOrder = filters.sortOrder ?? 'asc'
		result.sort((a, b) => {
			let comparison = 0
			switch (sortBy) {
				case 'createdAt':
					comparison = a.createdAt.getTime() - b.createdAt.getTime()
					break
				case 'city':
					comparison = (a.city ?? '').localeCompare(b.city ?? '')
					break
				case 'state':
					comparison = (a.state ?? '').localeCompare(b.state ?? '')
					break
				case 'propertiesCount':
					// Para testes mock, sempre 0
					comparison = 0
					break
				default:
					comparison = a.name.localeCompare(b.name)
					break
			}
			return sortOrder === 'desc' ? -comparison : comparison
		})

		const limit = filters.limit ?? 10
		const offset = filters.offset ?? 0
		const paginatedData = result.slice(offset, offset + limit)
		return {
			data: paginatedData.map((owner) => ({ ...owner, propertiesCount: 0 })),
			total: result.length,
			limit,
			offset,
		}
	}

	async create(data: NewPropertyOwner): Promise<PropertyOwner> {
		const owner: PropertyOwner = {
			id: generateUUID(),
			companyId: data.companyId,
			name: data.name,
			document: data.document,
			documentType: data.documentType ?? 'cpf',
			rg: data.rg ?? null,
			nationality: data.nationality ?? null,
			maritalStatus: data.maritalStatus ?? null,
			profession: data.profession ?? null,
			email: data.email ?? null,
			phone: data.phone ?? null,
			phoneSecondary: data.phoneSecondary ?? null,
			address: data.address ?? null,
			addressNumber: data.addressNumber ?? null,
			addressComplement: data.addressComplement ?? null,
			neighborhood: data.neighborhood ?? null,
			city: data.city ?? null,
			state: data.state ?? null,
			zipCode: data.zipCode ?? null,
			birthDate: data.birthDate ?? null,
			photoUrl: data.photoUrl ?? null,
			notes: data.notes ?? null,
			createdBy: data.createdBy ?? '',
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.owners.set(owner.id, owner)
		return owner
	}

	async update(id: string, data: Partial<NewPropertyOwner>): Promise<PropertyOwner | null> {
		const existing = this.owners.get(id)
		if (!existing) return null

		const updated: PropertyOwner = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.owners.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.owners.delete(id)
	}

	async countByCompanyId(companyId: string): Promise<number> {
		let count = 0
		for (const owner of this.owners.values()) {
			if (owner.companyId === companyId) count++
		}
		return count
	}

	clear(): void {
		this.owners.clear()
	}
}

export class InMemoryTenantRepository implements ITenantRepository {
	private tenants: Map<string, Tenant> = new Map()

	async findById(id: string): Promise<Tenant | null> {
		return this.tenants.get(id) ?? null
	}

	async findByCpf(cpf: string, companyId: string): Promise<Tenant | null> {
		for (const tenant of this.tenants.values()) {
			if (tenant.cpf === cpf && tenant.companyId === companyId) {
				return tenant
			}
		}
		return null
	}

	async findByDocument(document: string, companyId: string): Promise<{ id: string } | null> {
		for (const tenant of this.tenants.values()) {
			if (tenant.cpf === document && tenant.companyId === companyId) {
				return { id: tenant.id }
			}
		}
		return null
	}

	async findByEmail(email: string, companyId: string): Promise<Tenant | null> {
		const normalizedEmail = email.toLowerCase().trim()
		for (const tenant of this.tenants.values()) {
			if (
				tenant.email?.toLowerCase().trim() === normalizedEmail &&
				tenant.companyId === companyId
			) {
				return tenant
			}
		}
		return null
	}

	async findByCompanyId(companyId: string): Promise<Tenant[]> {
		const result: Tenant[] = []
		for (const tenant of this.tenants.values()) {
			if (tenant.companyId === companyId) {
				result.push(tenant)
			}
		}
		return result
	}

	async list(filters: TenantFilters): Promise<TenantListResult> {
		const result: Tenant[] = []
		for (const tenant of this.tenants.values()) {
			if (tenant.companyId === filters.companyId) {
				if (filters.createdBy && tenant.createdBy !== filters.createdBy) continue
				if (filters.search) {
					const search = filters.search.toLowerCase()
					if (
						!tenant.name.toLowerCase().includes(search) &&
						!tenant.email?.toLowerCase().includes(search) &&
						!tenant.cpf.toLowerCase().includes(search)
					) {
						continue
					}
				}
				result.push(tenant)
			}
		}
		const limit = filters.limit ?? 10
		const offset = filters.offset ?? 0
		return {
			data: result.slice(offset, offset + limit),
			total: result.length,
			limit,
			offset,
		}
	}

	async create(data: NewTenant): Promise<Tenant> {
		const tenant: Tenant = {
			id: generateUUID(),
			companyId: data.companyId,
			name: data.name,
			cpf: data.cpf,
			email: data.email ?? null,
			phone: data.phone ?? null,
			address: data.address ?? null,
			city: data.city ?? null,
			state: data.state ?? null,
			zipCode: data.zipCode ?? null,
			birthDate: data.birthDate ?? null,
			monthlyIncome: data.monthlyIncome ?? null,
			employer: data.employer ?? null,
			emergencyContact: data.emergencyContact ?? null,
			emergencyPhone: data.emergencyPhone ?? null,
			notes: data.notes ?? null,
			createdBy: data.createdBy,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.tenants.set(tenant.id, tenant)
		return tenant
	}

	async update(id: string, data: Partial<NewTenant>): Promise<Tenant | null> {
		const existing = this.tenants.get(id)
		if (!existing) return null

		const updated: Tenant = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.tenants.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.tenants.delete(id)
	}

	async countByCompanyId(companyId: string): Promise<number> {
		let count = 0
		for (const tenant of this.tenants.values()) {
			if (tenant.companyId === companyId) count++
		}
		return count
	}

	clear(): void {
		this.tenants.clear()
	}
}

export class InMemoryPropertyRepository implements IPropertyRepository {
	private properties: Map<string, Property> = new Map()
	private photoRepository?: InMemoryPropertyPhotoRepository

	setPhotoRepository(repo: InMemoryPropertyPhotoRepository): void {
		this.photoRepository = repo
	}

	async findById(id: string): Promise<Property | null> {
		return this.properties.get(id) ?? null
	}

	async findByCompanyId(companyId: string): Promise<Property[]> {
		const result: Property[] = []
		for (const property of this.properties.values()) {
			if (property.companyId === companyId) {
				result.push(property)
			}
		}
		return result
	}

	async findByOwnerId(ownerId: string): Promise<Property[]> {
		const result: Property[] = []
		for (const property of this.properties.values()) {
			if (property.ownerId === ownerId) {
				result.push(property)
			}
		}
		return result
	}

	async findByBrokerId(brokerId: string): Promise<Property[]> {
		const result: Property[] = []
		for (const property of this.properties.values()) {
			if (property.brokerId === brokerId) {
				result.push(property)
			}
		}
		return result
	}

	async list(filters: PropertyFilters): Promise<PropertyListResult> {
		const result: Property[] = []
		for (const property of this.properties.values()) {
			if (property.companyId !== filters.companyId) continue
			if (filters.ownerId && property.ownerId !== filters.ownerId) continue
			if (filters.brokerId && property.brokerId !== filters.brokerId) continue
			if (filters.type && property.type !== filters.type) continue
			if (filters.listingType && property.listingType !== filters.listingType) continue
			if (filters.status && property.status !== filters.status) continue
			if (filters.city && property.city !== filters.city) continue
			if (filters.search) {
				const search = filters.search.toLowerCase()
				if (
					!property.title.toLowerCase().includes(search) &&
					!property.address?.toLowerCase().includes(search) &&
					!property.city?.toLowerCase().includes(search)
				) {
					continue
				}
			}
			// Price filters
			if (
				filters.minRentalPrice !== undefined &&
				(property.rentalPrice === null || property.rentalPrice < filters.minRentalPrice)
			)
				continue
			if (
				filters.maxRentalPrice !== undefined &&
				(property.rentalPrice === null || property.rentalPrice > filters.maxRentalPrice)
			)
				continue
			if (
				filters.minSalePrice !== undefined &&
				(property.salePrice === null || property.salePrice < filters.minSalePrice)
			)
				continue
			if (
				filters.maxSalePrice !== undefined &&
				(property.salePrice === null || property.salePrice > filters.maxSalePrice)
			)
				continue
			// Bedrooms filters
			if (
				filters.minBedrooms !== undefined &&
				(property.bedrooms === null || property.bedrooms < filters.minBedrooms)
			)
				continue
			if (
				filters.maxBedrooms !== undefined &&
				(property.bedrooms === null || property.bedrooms > filters.maxBedrooms)
			)
				continue
			result.push(property)
		}
		const limit = filters.limit ?? 10
		const offset = filters.offset ?? 0
		return {
			data: result.slice(offset, offset + limit).map((p) => ({ ...p, primaryPhoto: null })),
			total: result.length,
			limit,
			offset,
		}
	}

	async create(data: NewProperty): Promise<Property> {
		const property: Property = {
			id: generateUUID(),
			code: data.code ?? null,
			companyId: data.companyId,
			ownerId: data.ownerId,
			brokerId: data.brokerId ?? null,
			title: data.title,
			description: data.description ?? null,
			type: data.type ?? PROPERTY_TYPES.HOUSE,
			listingType: data.listingType ?? LISTING_TYPES.RENT,
			status: data.status ?? PROPERTY_STATUS.AVAILABLE,
			address: data.address ?? null,
			addressNumber: data.addressNumber ?? null,
			addressComplement: data.addressComplement ?? null,
			neighborhood: data.neighborhood ?? null,
			city: data.city ?? null,
			state: data.state ?? null,
			zipCode: data.zipCode ?? null,
			bedrooms: data.bedrooms ?? 0,
			bathrooms: data.bathrooms ?? 0,
			suites: data.suites ?? 0,
			parkingSpaces: data.parkingSpaces ?? 0,
			area: data.area ?? null,
			totalArea: data.totalArea ?? null,
			builtArea: data.builtArea ?? null,
			floor: data.floor ?? null,
			totalFloors: data.totalFloors ?? null,
			yearBuilt: data.yearBuilt ?? null,
			rentalPrice: data.rentalPrice ?? null,
			salePrice: data.salePrice ?? null,
			iptuPrice: data.iptuPrice ?? null,
			condoFee: data.condoFee ?? null,
			commissionPercentage: data.commissionPercentage ?? null,
			commissionValue: data.commissionValue ?? null,
			isMarketplace: data.isMarketplace ?? false,
			features: data.features ?? {},
			notes: data.notes ?? null,
			createdBy: data.createdBy ?? '',
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null,
			deletedBy: null,
		}
		this.properties.set(property.id, property)
		return property
	}

	async update(id: string, data: Partial<NewProperty>): Promise<Property | null> {
		const existing = this.properties.get(id)
		if (!existing) return null

		const updated: Property = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.properties.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.properties.delete(id)
	}

	async countByCompanyId(companyId: string): Promise<number> {
		let count = 0
		for (const property of this.properties.values()) {
			if (property.companyId === companyId) count++
		}
		return count
	}

	async countByOwnerId(ownerId: string): Promise<number> {
		let count = 0
		for (const property of this.properties.values()) {
			if (property.ownerId === ownerId) count++
		}
		return count
	}

	async getStatsByCompanyId(companyId: string): Promise<PropertyStats> {
		let total = 0
		let available = 0
		let rented = 0
		let sold = 0
		let maintenance = 0
		for (const property of this.properties.values()) {
			if (property.companyId === companyId) {
				total++
				if (property.status === PROPERTY_STATUS.AVAILABLE) available++
				if (property.status === PROPERTY_STATUS.RENTED) rented++
				if (property.status === PROPERTY_STATUS.SOLD) sold++
				if (property.status === PROPERTY_STATUS.MAINTENANCE) maintenance++
			}
		}
		return { total, available, rented, sold, maintenance }
	}

	async getStatsByBrokerId(brokerId: string, _companyId: string): Promise<PropertyStats> {
		let total = 0
		let available = 0
		let rented = 0
		let sold = 0
		let maintenance = 0
		for (const property of this.properties.values()) {
			if (property.brokerId === brokerId) {
				total++
				if (property.status === PROPERTY_STATUS.AVAILABLE) available++
				if (property.status === PROPERTY_STATUS.RENTED) rented++
				if (property.status === PROPERTY_STATUS.SOLD) sold++
				if (property.status === PROPERTY_STATUS.MAINTENANCE) maintenance++
			}
		}
		return { total, available, rented, sold, maintenance }
	}

	async deleteWithPhotos(id: string): Promise<boolean> {
		if (this.photoRepository) {
			await this.photoRepository.deleteByPropertyId(id)
		}
		return this.properties.delete(id)
	}

	async generateNextCode(companyId: string): Promise<string> {
		let maxCode = 0
		for (const property of this.properties.values()) {
			if (property.companyId === companyId && property.code) {
				const match = property.code.match(/IMO-(\d+)/)
				if (match) {
					const num = Number.parseInt(match[1], 10)
					if (num > maxCode) maxCode = num
				}
			}
		}
		const nextNumber = maxCode + 1
		return `IMO-${nextNumber.toString().padStart(5, '0')}`
	}

	clear(): void {
		this.properties.clear()
	}
}

export class InMemoryPropertyPhotoRepository implements IPropertyPhotoRepository {
	private photos: Map<string, PropertyPhoto> = new Map()

	async findById(id: string): Promise<PropertyPhoto | null> {
		return this.photos.get(id) ?? null
	}

	async findByPropertyId(propertyId: string): Promise<PropertyPhoto[]> {
		const result: PropertyPhoto[] = []
		for (const photo of this.photos.values()) {
			if (photo.propertyId === propertyId) {
				result.push(photo)
			}
		}
		return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
	}

	async findPrimaryByPropertyId(propertyId: string): Promise<PropertyPhoto | null> {
		for (const photo of this.photos.values()) {
			if (photo.propertyId === propertyId && photo.isPrimary) {
				return photo
			}
		}
		return null
	}

	async create(data: NewPropertyPhoto): Promise<PropertyPhoto> {
		const photo: PropertyPhoto = {
			id: generateUUID(),
			propertyId: data.propertyId,
			filename: data.filename,
			originalName: data.originalName,
			mimeType: data.mimeType,
			size: data.size,
			url: data.url,
			order: data.order ?? 0,
			isPrimary: data.isPrimary ?? false,
			uploadedBy: data.uploadedBy,
			createdAt: new Date(),
		}
		this.photos.set(photo.id, photo)
		return photo
	}

	async createAsPrimary(data: NewPropertyPhoto, propertyId: string): Promise<PropertyPhoto> {
		// Remove isPrimary de todas as fotos do imóvel
		for (const [photoId, photo] of this.photos.entries()) {
			if (photo.propertyId === propertyId) {
				this.photos.set(photoId, { ...photo, isPrimary: false })
			}
		}

		// Cria a nova foto como principal
		const photo: PropertyPhoto = {
			id: generateUUID(),
			propertyId: data.propertyId,
			filename: data.filename,
			originalName: data.originalName,
			mimeType: data.mimeType,
			size: data.size,
			url: data.url,
			order: data.order ?? 0,
			isPrimary: true,
			uploadedBy: data.uploadedBy,
			createdAt: new Date(),
		}
		this.photos.set(photo.id, photo)
		return photo
	}

	async createMany(data: NewPropertyPhoto[]): Promise<PropertyPhoto[]> {
		const results: PropertyPhoto[] = []
		for (const item of data) {
			const photo = await this.create(item)
			results.push(photo)
		}
		return results
	}

	async update(id: string, data: Partial<NewPropertyPhoto>): Promise<PropertyPhoto | null> {
		const existing = this.photos.get(id)
		if (!existing) return null

		const updated: PropertyPhoto = {
			...existing,
			...data,
		}
		this.photos.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.photos.delete(id)
	}

	async deleteByPropertyId(propertyId: string): Promise<boolean> {
		let deleted = false
		for (const [id, photo] of this.photos.entries()) {
			if (photo.propertyId === propertyId) {
				this.photos.delete(id)
				deleted = true
			}
		}
		return deleted
	}

	async setPrimary(id: string, propertyId: string): Promise<boolean> {
		// Primeiro, remove isPrimary de todas as fotos do imóvel
		for (const [photoId, photo] of this.photos.entries()) {
			if (photo.propertyId === propertyId) {
				this.photos.set(photoId, { ...photo, isPrimary: false })
			}
		}
		// Depois, define a foto como principal
		const photo = this.photos.get(id)
		if (photo && photo.propertyId === propertyId) {
			this.photos.set(id, { ...photo, isPrimary: true })
			return true
		}
		return false
	}

	async updateOrder(id: string, order: number): Promise<PropertyPhoto | null> {
		return this.update(id, { order })
	}

	async countByPropertyId(propertyId: string): Promise<number> {
		let count = 0
		for (const photo of this.photos.values()) {
			if (photo.propertyId === propertyId) count++
		}
		return count
	}

	clear(): void {
		this.photos.clear()
	}
}

export class InMemoryContractRepository implements IContractRepository {
	private contracts: Map<string, Contract> = new Map()
	private propertyRepository?: InMemoryPropertyRepository

	setPropertyRepository(repo: InMemoryPropertyRepository): void {
		this.propertyRepository = repo
	}

	async findById(id: string): Promise<Contract | null> {
		return this.contracts.get(id) ?? null
	}

	async findByPropertyId(propertyId: string): Promise<Contract[]> {
		const result: Contract[] = []
		for (const contract of this.contracts.values()) {
			if (contract.propertyId === propertyId) {
				result.push(contract)
			}
		}
		return result
	}

	async findActiveByPropertyId(propertyId: string): Promise<Contract | null> {
		for (const contract of this.contracts.values()) {
			if (contract.propertyId === propertyId && contract.status === CONTRACT_STATUS.ACTIVE) {
				return contract
			}
		}
		return null
	}

	async findByTenantId(tenantId: string): Promise<Contract[]> {
		const result: Contract[] = []
		for (const contract of this.contracts.values()) {
			if (contract.tenantId === tenantId) {
				result.push(contract)
			}
		}
		return result
	}

	async findActiveByTenantId(tenantId: string): Promise<Contract[]> {
		const result: Contract[] = []
		for (const contract of this.contracts.values()) {
			if (contract.tenantId === tenantId && contract.status === CONTRACT_STATUS.ACTIVE) {
				result.push(contract)
			}
		}
		return result
	}

	async findByCompanyId(companyId: string): Promise<Contract[]> {
		const result: Contract[] = []
		for (const contract of this.contracts.values()) {
			if (contract.companyId === companyId) {
				result.push(contract)
			}
		}
		return result
	}

	async findByBrokerId(brokerId: string): Promise<Contract[]> {
		const result: Contract[] = []
		for (const contract of this.contracts.values()) {
			if (contract.brokerId === brokerId) {
				result.push(contract)
			}
		}
		return result
	}

	async list(filters: ContractFilters): Promise<ContractListResult> {
		const result: Contract[] = []
		for (const contract of this.contracts.values()) {
			if (contract.companyId !== filters.companyId) continue
			if (filters.propertyId && contract.propertyId !== filters.propertyId) continue
			if (filters.ownerId && contract.ownerId !== filters.ownerId) continue
			if (filters.tenantId && contract.tenantId !== filters.tenantId) continue
			if (filters.brokerId && contract.brokerId !== filters.brokerId) continue
			if (filters.status && contract.status !== filters.status) continue
			result.push(contract)
		}
		const limit = filters.limit ?? 10
		const offset = filters.offset ?? 0
		return {
			data: result.slice(offset, offset + limit),
			total: result.length,
			limit,
			offset,
		}
	}

	async create(data: NewContract): Promise<Contract> {
		const contract: Contract = {
			id: generateUUID(),
			companyId: data.companyId,
			propertyId: data.propertyId,
			ownerId: data.ownerId,
			tenantId: data.tenantId,
			brokerId: data.brokerId ?? null,
			startDate: data.startDate,
			endDate: data.endDate,
			rentalAmount: data.rentalAmount,
			paymentDay: data.paymentDay ?? 5,
			depositAmount: data.depositAmount ?? null,
			status: data.status ?? CONTRACT_STATUS.ACTIVE,
			terminatedAt: data.terminatedAt ?? null,
			terminationReason: data.terminationReason ?? null,
			notes: data.notes ?? null,
			createdBy: data.createdBy,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.contracts.set(contract.id, contract)
		return contract
	}

	async createWithPropertyUpdate(
		contractData: NewContract,
		propertyId: string,
		propertyStatus: string,
	): Promise<Contract> {
		const contract = await this.create(contractData)
		if (this.propertyRepository) {
			await this.propertyRepository.update(propertyId, {
				status: propertyStatus as any,
			})
		}
		return contract
	}

	async terminateWithPropertyUpdate(
		contractId: string,
		propertyId: string,
		terminationData: {
			terminatedAt: Date
			terminationReason?: string | null
		},
	): Promise<Contract> {
		const contract = await this.update(contractId, {
			status: CONTRACT_STATUS.TERMINATED,
			terminatedAt: terminationData.terminatedAt,
			terminationReason: terminationData.terminationReason || null,
		})
		if (!contract) {
			throw new Error('Contract not found')
		}
		if (this.propertyRepository) {
			await this.propertyRepository.update(propertyId, {
				status: PROPERTY_STATUS.AVAILABLE,
			})
		}
		return contract
	}

	async update(id: string, data: Partial<NewContract>): Promise<Contract | null> {
		const existing = this.contracts.get(id)
		if (!existing) return null

		const updated: Contract = {
			...existing,
			...data,
			updatedAt: new Date(),
		}
		this.contracts.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.contracts.delete(id)
	}

	async countByCompanyId(companyId: string): Promise<number> {
		let count = 0
		for (const contract of this.contracts.values()) {
			if (contract.companyId === companyId) count++
		}
		return count
	}

	async countActiveByCompanyId(companyId: string): Promise<number> {
		let count = 0
		for (const contract of this.contracts.values()) {
			if (contract.companyId === companyId && contract.status === CONTRACT_STATUS.ACTIVE) count++
		}
		return count
	}

	async countByTenantId(tenantId: string): Promise<number> {
		let count = 0
		for (const contract of this.contracts.values()) {
			if (contract.tenantId === tenantId) count++
		}
		return count
	}

	async countActiveByTenantId(tenantId: string): Promise<number> {
		let count = 0
		for (const contract of this.contracts.values()) {
			if (contract.tenantId === tenantId && contract.status === CONTRACT_STATUS.ACTIVE) count++
		}
		return count
	}

	async getStatsByCompanyId(companyId: string): Promise<ContractStats> {
		let total = 0
		let active = 0
		let terminated = 0
		let cancelled = 0
		let expired = 0
		let monthlyRevenue = 0
		for (const contract of this.contracts.values()) {
			if (contract.companyId === companyId) {
				total++
				if (contract.status === CONTRACT_STATUS.ACTIVE) {
					active++
					monthlyRevenue += contract.rentalAmount
				}
				if (contract.status === CONTRACT_STATUS.TERMINATED) terminated++
				if (contract.status === CONTRACT_STATUS.CANCELLED) cancelled++
				if (contract.status === CONTRACT_STATUS.EXPIRED) expired++
			}
		}
		return { total, active, terminated, cancelled, expired, monthlyRevenue }
	}

	async getStatsByBrokerId(brokerId: string, _companyId: string): Promise<ContractStats> {
		let total = 0
		let active = 0
		let terminated = 0
		let cancelled = 0
		let expired = 0
		let monthlyRevenue = 0
		for (const contract of this.contracts.values()) {
			if (contract.brokerId === brokerId) {
				total++
				if (contract.status === CONTRACT_STATUS.ACTIVE) {
					active++
					monthlyRevenue += contract.rentalAmount
				}
				if (contract.status === CONTRACT_STATUS.TERMINATED) terminated++
				if (contract.status === CONTRACT_STATUS.CANCELLED) cancelled++
				if (contract.status === CONTRACT_STATUS.EXPIRED) expired++
			}
		}
		return { total, active, terminated, cancelled, expired, monthlyRevenue }
	}

	async findExpiringContracts(companyId: string, daysAhead: number): Promise<Contract[]> {
		const result: Contract[] = []
		const now = new Date()
		const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

		for (const contract of this.contracts.values()) {
			if (contract.companyId !== companyId) continue
			if (contract.status !== CONTRACT_STATUS.ACTIVE) continue
			if (contract.endDate <= futureDate && contract.endDate >= now) {
				result.push(contract)
			}
		}
		return result.sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
	}

	async findExpiringContractsByBroker(
		companyId: string,
		brokerId: string,
		daysAhead: number,
	): Promise<Contract[]> {
		const result: Contract[] = []
		const now = new Date()
		const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

		for (const contract of this.contracts.values()) {
			if (contract.companyId !== companyId) continue
			if (contract.brokerId !== brokerId) continue
			if (contract.status !== CONTRACT_STATUS.ACTIVE) continue
			if (contract.endDate <= futureDate && contract.endDate >= now) {
				result.push(contract)
			}
		}
		return result.sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
	}

	clear(): void {
		this.contracts.clear()
	}
}

export class InMemoryDocumentRepository implements IDocumentRepository {
	documents: Map<string, Document> = new Map()

	async findById(id: string): Promise<Document | null> {
		return this.documents.get(id) ?? null
	}

	async findByIds(ids: string[]): Promise<Document[]> {
		const result: Document[] = []
		for (const id of ids) {
			const doc = this.documents.get(id)
			if (doc && doc.deletedAt === null) result.push(doc)
		}
		return result
	}

	async findByEntity(
		entityType: DocumentEntityType,
		entityId: string,
		options?: { limit?: number; offset?: number },
	): Promise<Document[]> {
		const result: Document[] = []
		for (const doc of this.documents.values()) {
			if (doc.entityType === entityType && doc.entityId === entityId && doc.deletedAt === null) {
				result.push(doc)
			}
		}
		const sorted = result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

		if (options) {
			const offset = options.offset ?? 0
			const limit = options.limit
			return limit ? sorted.slice(offset, offset + limit) : sorted.slice(offset)
		}

		return sorted
	}

	async findByEntityAndType(
		entityType: DocumentEntityType,
		entityId: string,
		documentType: string,
	): Promise<Document[]> {
		const result: Document[] = []
		for (const doc of this.documents.values()) {
			if (
				doc.entityType === entityType &&
				doc.entityId === entityId &&
				doc.documentType === documentType &&
				doc.deletedAt === null
			) {
				result.push(doc)
			}
		}
		return result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
	}

	async findByEntityTypeAndIds(
		entityType: DocumentEntityType,
		entityIds: string[],
		documentType: string,
	): Promise<Map<string, Document[]>> {
		const result = new Map<string, Document[]>()
		for (const doc of this.documents.values()) {
			if (
				doc.entityType === entityType &&
				entityIds.includes(doc.entityId) &&
				doc.documentType === documentType &&
				doc.deletedAt === null
			) {
				if (!result.has(doc.entityId)) {
					result.set(doc.entityId, [])
				}
				result.get(doc.entityId)!.push(doc)
			}
		}
		return result
	}

	async findDeletedByEntity(
		entityType: DocumentEntityType,
		entityId: string,
		options?: { limit?: number; offset?: number },
	): Promise<Document[]> {
		const result: Document[] = []
		for (const doc of this.documents.values()) {
			if (doc.entityType === entityType && doc.entityId === entityId && doc.deletedAt !== null) {
				result.push(doc)
			}
		}
		const sorted = result.sort((a, b) => {
			if (!a.deletedAt || !b.deletedAt) return 0
			return b.deletedAt.getTime() - a.deletedAt.getTime()
		})

		if (options) {
			const offset = options.offset ?? 0
			const limit = options.limit
			return limit ? sorted.slice(offset, offset + limit) : sorted.slice(offset)
		}

		return sorted
	}

	async countDeletedByEntity(entityType: DocumentEntityType, entityId: string): Promise<number> {
		let count = 0
		for (const doc of this.documents.values()) {
			if (doc.entityType === entityType && doc.entityId === entityId && doc.deletedAt !== null) {
				count++
			}
		}
		return count
	}

	async create(data: NewDocument): Promise<Document> {
		const doc: Document = {
			id: generateUUID(),
			companyId: data.companyId,
			entityType: data.entityType,
			entityId: data.entityId,
			documentType: data.documentType,
			filename: data.filename,
			originalName: data.originalName,
			mimeType: data.mimeType,
			size: data.size,
			url: data.url,
			description: data.description ?? null,
			uploadedBy: data.uploadedBy,
			createdAt: new Date(),
			deletedAt: null,
			deletedBy: null,
		}
		this.documents.set(doc.id, doc)
		return doc
	}

	async createMany(data: NewDocument[]): Promise<Document[]> {
		const docs: Document[] = []
		for (const d of data) {
			const doc = await this.create(d)
			docs.push(doc)
		}
		return docs
	}

	async update(id: string, data: Partial<NewDocument>): Promise<Document | null> {
		const existing = this.documents.get(id)
		if (!existing) return null

		const updated: Document = {
			...existing,
			...data,
		}
		this.documents.set(id, updated)
		return updated
	}

	async delete(id: string): Promise<boolean> {
		return this.documents.delete(id)
	}

	async softDelete(id: string, input: { deletedBy: string }): Promise<Document | null> {
		const existing = this.documents.get(id)
		if (!existing) return null

		const updated: Document = {
			...existing,
			deletedAt: new Date(),
			deletedBy: input.deletedBy,
		}
		this.documents.set(id, updated)
		return updated
	}

	async deleteMany(ids: string[]): Promise<string[]> {
		const deleted: string[] = []
		for (const id of ids) {
			if (this.documents.delete(id)) {
				deleted.push(id)
			}
		}
		return deleted
	}

	async deleteByEntity(entityType: DocumentEntityType, entityId: string): Promise<boolean> {
		let deleted = false
		for (const [id, doc] of this.documents.entries()) {
			if (doc.entityType === entityType && doc.entityId === entityId) {
				this.documents.delete(id)
				deleted = true
			}
		}
		return deleted
	}

	async countByEntity(entityType: DocumentEntityType, entityId: string): Promise<number> {
		let count = 0
		for (const doc of this.documents.values()) {
			if (doc.entityType === entityType && doc.entityId === entityId && doc.deletedAt === null) {
				count++
			}
		}
		return count
	}

	async countByEntityAndType(
		entityType: DocumentEntityType,
		entityId: string,
		documentType: string,
	): Promise<number> {
		let count = 0
		for (const doc of this.documents.values()) {
			if (
				doc.entityType === entityType &&
				doc.entityId === entityId &&
				doc.documentType === documentType &&
				doc.deletedAt === null
			) {
				count++
			}
		}
		return count
	}

	async batchOperations(input: {
		toDelete: string[]
		toAdd: NewDocument[]
	}): Promise<{ deleted: string[]; added: Document[] }> {
		const deleted = await this.deleteMany(input.toDelete)
		const added = await this.createMany(input.toAdd)
		return { deleted, added }
	}

	clear(): void {
		this.documents.clear()
	}
}

/**
 * In-memory mock implementation of UserCacheService for testing
 */
export class InMemoryUserCacheService implements IUserCacheService {
	private cache: Map<string, CachedUserState> = new Map()

	async get(userId: string): Promise<CachedUserState | null> {
		return this.cache.get(userId) ?? null
	}

	async set(userId: string, user: User, subscription: CurrentSubscription | null): Promise<void> {
		this.cache.set(userId, {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
				companyId: user.companyId,
				createdBy: user.createdBy,
				isActive: user.isActive,
				isEmailVerified: user.isEmailVerified,
			},
			subscription: subscription
				? {
						id: subscription.id,
						userId: subscription.userId,
						status: subscription.status,
						computedStatus: String(subscription.computedStatus),
						planId: subscription.planId,
						startDate: subscription.startDate
							? typeof subscription.startDate === 'string'
								? subscription.startDate
								: subscription.startDate.toISOString()
							: null,
						endDate: subscription.endDate
							? typeof subscription.endDate === 'string'
								? subscription.endDate
								: subscription.endDate.toISOString()
							: null,
						daysRemaining: subscription.daysRemaining,
						plan: subscription.plan,
					}
				: null,
			cachedAt: Date.now(),
		})
	}

	async invalidate(userId: string): Promise<void> {
		this.cache.delete(userId)
	}

	async invalidateMany(userIds: string[]): Promise<void> {
		for (const id of userIds) {
			this.cache.delete(id)
		}
	}

	async invalidateAll(): Promise<void> {
		this.cache.clear()
	}

	async getStats(): Promise<{ totalKeys: number; memoryUsage: string }> {
		return { totalKeys: this.cache.size, memoryUsage: '0B' }
	}

	clear(): void {
		this.cache.clear()
	}
}
