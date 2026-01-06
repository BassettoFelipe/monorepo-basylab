import type { ICompanyRepository } from '@/repositories/contracts/company.repository'
import type { IContractRepository } from '@/repositories/contracts/contract.repository'
import type { ICustomFieldRepository } from '@/repositories/contracts/custom-field.repository'
import type { ICustomFieldResponseRepository } from '@/repositories/contracts/custom-field-response.repository'
import type { IDocumentRepository } from '@/repositories/contracts/document.repository'
import type { IPendingPaymentRepository } from '@/repositories/contracts/pending-payment.repository'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { IPlanFeatureRepository } from '@/repositories/contracts/plan-feature.repository'
import type { IPropertyRepository } from '@/repositories/contracts/property.repository'
import type { IPropertyOwnerRepository } from '@/repositories/contracts/property-owner.repository'
import type { IPropertyPhotoRepository } from '@/repositories/contracts/property-photo.repository'
import type { ISubscriptionRepository } from '@/repositories/contracts/subscription.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { IUserCacheService } from '@/services/cache'
import { createAuthUseCases } from './modules/auth.module'
import { createCompanyUseCases } from './modules/companies.module'
import { createContractUseCases } from './modules/contracts.module'
import { createCustomFieldUseCases } from './modules/custom-fields.module'
import { createDashboardUseCases } from './modules/dashboard.module'
import { createDocumentUseCases } from './modules/documents.module'
import { createJobs } from './modules/jobs.module'
import { createPaymentUseCases } from './modules/payment.module'
import { createPlanUseCases } from './modules/plans.module'
import { createPropertyUseCases } from './modules/properties.module'
import { createPropertyOwnerUseCases } from './modules/property-owners.module'
import { createPropertyPhotoUseCases } from './modules/property-photos.module'
import { repositories } from './modules/repositories'
import { services } from './modules/services'
import { createSubscriptionUseCases } from './modules/subscriptions.module'
import { createTenantUseCases } from './modules/tenants.module'
import { createUsersUseCases } from './modules/users.module'

export const auth = createAuthUseCases()
export const users = createUsersUseCases()
export const subscriptions = createSubscriptionUseCases()
export const plans = createPlanUseCases()
export const payment = createPaymentUseCases()
export const customFields = createCustomFieldUseCases()
export const propertyOwners = createPropertyOwnerUseCases()
export const tenants = createTenantUseCases()
export const properties = createPropertyUseCases()
export const contracts = createContractUseCases()
export const dashboard = createDashboardUseCases()
export const companies = createCompanyUseCases()
export const propertyPhotos = createPropertyPhotoUseCases()
export const documents = createDocumentUseCases()
export const jobs = createJobs()

export const container = {
	get userRepository() {
		return repositories.userRepository
	},
	get companyRepository() {
		return repositories.companyRepository
	},
	get planRepository() {
		return repositories.planRepository
	},
	get planFeatureRepository() {
		return repositories.planFeatureRepository
	},
	get subscriptionRepository() {
		return repositories.subscriptionRepository
	},
	get pendingPaymentRepository() {
		return repositories.pendingPaymentRepository
	},
	get customFieldRepository() {
		return repositories.customFieldRepository
	},
	get customFieldResponseRepository() {
		return repositories.customFieldResponseRepository
	},
	get userCacheService() {
		return services.userCacheService
	},
	get propertyOwnerRepository() {
		return repositories.propertyOwnerRepository
	},
	get tenantRepository() {
		return repositories.tenantRepository
	},
	get propertyRepository() {
		return repositories.propertyRepository
	},
	get propertyPhotoRepository() {
		return repositories.propertyPhotoRepository
	},
	get contractRepository() {
		return repositories.contractRepository
	},
	get documentRepository() {
		return repositories.documentRepository
	},
	users,
	subscriptions,
	propertyOwners,
	tenants,
	properties,
	propertyPhotos,
	contracts,
	documents,
	dashboard,
	companies,
}

export function injectTestRepositories(repos: {
	userRepository?: IUserRepository
	companyRepository?: ICompanyRepository
	planRepository?: IPlanRepository
	planFeatureRepository?: IPlanFeatureRepository
	subscriptionRepository?: ISubscriptionRepository
	pendingPaymentRepository?: IPendingPaymentRepository
	propertyOwnerRepository?: IPropertyOwnerRepository
	tenantRepository?: ITenantRepository
	propertyRepository?: IPropertyRepository
	propertyPhotoRepository?: IPropertyPhotoRepository
	contractRepository?: IContractRepository
	documentRepository?: IDocumentRepository
	customFieldRepository?: ICustomFieldRepository
	customFieldResponseRepository?: ICustomFieldResponseRepository
	userCacheService?: IUserCacheService
}): void {
	if (repos.userRepository) repositories.userRepository = repos.userRepository
	if (repos.companyRepository) repositories.companyRepository = repos.companyRepository
	if (repos.planRepository) repositories.planRepository = repos.planRepository
	if (repos.planFeatureRepository) repositories.planFeatureRepository = repos.planFeatureRepository
	if (repos.subscriptionRepository)
		repositories.subscriptionRepository = repos.subscriptionRepository
	if (repos.pendingPaymentRepository)
		repositories.pendingPaymentRepository = repos.pendingPaymentRepository
	if (repos.propertyOwnerRepository)
		repositories.propertyOwnerRepository = repos.propertyOwnerRepository
	if (repos.tenantRepository) repositories.tenantRepository = repos.tenantRepository
	if (repos.propertyRepository) repositories.propertyRepository = repos.propertyRepository
	if (repos.propertyPhotoRepository)
		repositories.propertyPhotoRepository = repos.propertyPhotoRepository
	if (repos.contractRepository) repositories.contractRepository = repos.contractRepository
	if (repos.documentRepository) repositories.documentRepository = repos.documentRepository
	if (repos.customFieldRepository) repositories.customFieldRepository = repos.customFieldRepository
	if (repos.customFieldResponseRepository)
		repositories.customFieldResponseRepository = repos.customFieldResponseRepository
	if (repos.userCacheService) services.userCacheService = repos.userCacheService

	Object.assign(auth, createAuthUseCases())
	Object.assign(users, createUsersUseCases())
	Object.assign(subscriptions, createSubscriptionUseCases())
	Object.assign(plans, createPlanUseCases())
	Object.assign(payment, createPaymentUseCases())
	Object.assign(customFields, createCustomFieldUseCases())
	Object.assign(propertyOwners, createPropertyOwnerUseCases())
	Object.assign(tenants, createTenantUseCases())
	Object.assign(properties, createPropertyUseCases())
	Object.assign(contracts, createContractUseCases())
	Object.assign(dashboard, createDashboardUseCases())
	Object.assign(companies, createCompanyUseCases())
	Object.assign(propertyPhotos, createPropertyPhotoUseCases())
	Object.assign(documents, createDocumentUseCases())
}
