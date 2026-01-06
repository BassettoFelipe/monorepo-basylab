import { getRedis } from "@/config/redis";
import { db } from "@/db";
import { CleanupExpiredPaymentsJob } from "@/jobs/cleanup-expired-payments.job";
import type { ICompanyRepository } from "@/repositories/contracts/company.repository";
import type { IContractRepository } from "@/repositories/contracts/contract.repository";
import type { ICustomFieldRepository } from "@/repositories/contracts/custom-field.repository";
import type { ICustomFieldResponseRepository } from "@/repositories/contracts/custom-field-response.repository";
import type { IDocumentRepository } from "@/repositories/contracts/document.repository";
import type { IPendingPaymentRepository } from "@/repositories/contracts/pending-payment.repository";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";
import type { IPlanFeatureRepository } from "@/repositories/contracts/plan-feature.repository";
import type { IPropertyRepository } from "@/repositories/contracts/property.repository";
import type { IPropertyOwnerRepository } from "@/repositories/contracts/property-owner.repository";
import type { IPropertyPhotoRepository } from "@/repositories/contracts/property-photo.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { ITenantRepository } from "@/repositories/contracts/tenant.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { CompanyDrizzleRepository } from "@/repositories/providers/drizzle/company.repository";
import { ContractDrizzleRepository } from "@/repositories/providers/drizzle/contract.repository";
import { CustomFieldDrizzleRepository } from "@/repositories/providers/drizzle/custom-field.repository";
import { CustomFieldResponseDrizzleRepository } from "@/repositories/providers/drizzle/custom-field-response.repository";
import { DocumentDrizzleRepository } from "@/repositories/providers/drizzle/document.repository";
import { PendingPaymentDrizzleRepository } from "@/repositories/providers/drizzle/pending-payment.repository";
import { PlanDrizzleRepository } from "@/repositories/providers/drizzle/plan.repository";
import { PlanFeatureDrizzleRepository } from "@/repositories/providers/drizzle/plan-feature.repository";
import { PropertyDrizzleRepository } from "@/repositories/providers/drizzle/property.repository";
import { PropertyOwnerDrizzleRepository } from "@/repositories/providers/drizzle/property-owner.repository";
import { PropertyPhotoDrizzleRepository } from "@/repositories/providers/drizzle/property-photo.repository";
import { SubscriptionDrizzleRepository } from "@/repositories/providers/drizzle/subscription.repository";
import { TenantDrizzleRepository } from "@/repositories/providers/drizzle/tenant.repository";
import { UserDrizzleRepository } from "@/repositories/providers/drizzle/user.repository";
import { CustomFieldCacheService } from "@/services/cache/custom-field-cache.service";
import {
  getContactValidationService,
  getDocumentValidationService,
  getFeatureService,
} from "@/services/container";
import type { IUserCacheService } from "@/services/contracts/user-cache-service.interface";
import { paymentGateway } from "@/services/payment";
import { getStorageService } from "@/services/storage";
import { UserCacheService } from "@/services/user-cache.service";
import { ConfirmEmailUseCase } from "@/use-cases/auth/confirm-email/confirm-email.use-case";
import { ConfirmPasswordResetUseCase } from "@/use-cases/auth/confirm-password-reset/confirm-password-reset.use-case";
import { GetMeUseCase } from "@/use-cases/auth/get-me/get-me.use-case";
import { GetPasswordResetStatusUseCase } from "@/use-cases/auth/get-password-reset-status/get-password-reset-status.use-case";
import { GetResendStatusUseCase } from "@/use-cases/auth/get-resend-status/get-resend-status.use-case";
import { LoginUseCase } from "@/use-cases/auth/login/login.use-case";
import { RefreshTokensUseCase } from "@/use-cases/auth/refresh-tokens/refresh-tokens.use-case";
import { RegisterUseCase } from "@/use-cases/auth/register/register.use-case";
import { ResendPasswordResetCodeUseCase } from "@/use-cases/auth/resend-password-reset-code/resend-password-reset-code.use-case";
import { ResendVerificationCodeUseCase } from "@/use-cases/auth/resend-verification-code/resend-verification-code.use-case";
import { ValidateEmailForResetUseCase } from "@/use-cases/auth/validate-email-for-reset/validate-email-for-reset.use-case";
import { GetCompanyUseCase } from "@/use-cases/companies/get-company/get-company.use-case";
import { UpdateCompanyUseCase } from "@/use-cases/companies/update-company/update-company.use-case";
import { CreateContractUseCase } from "@/use-cases/contracts/create-contract/create-contract.use-case";
import { GetContractUseCase } from "@/use-cases/contracts/get-contract/get-contract.use-case";
import { ListContractsUseCase } from "@/use-cases/contracts/list-contracts/list-contracts.use-case";
import { TerminateContractUseCase } from "@/use-cases/contracts/terminate-contract/terminate-contract.use-case";
import { UpdateContractUseCase } from "@/use-cases/contracts/update-contract/update-contract.use-case";
import { CreateCustomFieldUseCase } from "@/use-cases/custom-fields/create-custom-field/create-custom-field.use-case";
import { DeleteCustomFieldUseCase } from "@/use-cases/custom-fields/delete-custom-field/delete-custom-field.use-case";
import { GetMyFieldsUseCase } from "@/use-cases/custom-fields/get-my-fields/get-my-fields.use-case";
import { GetUserFieldsUseCase } from "@/use-cases/custom-fields/get-user-fields/get-user-fields.use-case";
import { ListCustomFieldsUseCase } from "@/use-cases/custom-fields/list-custom-fields/list-custom-fields.use-case";
import { ReorderCustomFieldsUseCase } from "@/use-cases/custom-fields/reorder-custom-fields/reorder-custom-fields.use-case";
import { SaveMyFieldsUseCase } from "@/use-cases/custom-fields/save-my-fields/save-my-fields.use-case";
import { UpdateCustomFieldUseCase } from "@/use-cases/custom-fields/update-custom-field/update-custom-field.use-case";
import { GetDashboardStatsUseCase } from "@/use-cases/dashboard/get-dashboard-stats/get-dashboard-stats.use-case";
import { AddDocumentUseCase } from "@/use-cases/documents/add-document/add-document.use-case";
import { ListDocumentsUseCase } from "@/use-cases/documents/list-documents/list-documents.use-case";
import { RemoveDocumentUseCase } from "@/use-cases/documents/remove-document/remove-document.use-case";
import { CreatePendingPaymentUseCase } from "@/use-cases/payment/create-pending-payment/create-pending-payment.use-case";
import { GetPendingPaymentUseCase } from "@/use-cases/payment/get-pending-payment/get-pending-payment.use-case";
import { ProcessCreditCardPaymentUseCase } from "@/use-cases/payment/process-credit-card-payment/process-credit-card-payment.use-case";
import { ProcessPaymentWebhookUseCase } from "@/use-cases/payment/process-payment-webhook/process-payment-webhook.use-case";
import { GetPlanUseCase } from "@/use-cases/plans/get-plan/get-plan.use-case";
import { ListPlansUseCase } from "@/use-cases/plans/list-plans/list-plans.use-case";
import { CreatePropertyUseCase } from "@/use-cases/properties/create-property/create-property.use-case";
import { DeletePropertyUseCase } from "@/use-cases/properties/delete-property/delete-property.use-case";
import { GetPropertyUseCase } from "@/use-cases/properties/get-property/get-property.use-case";
import { ListPropertiesUseCase } from "@/use-cases/properties/list-properties/list-properties.use-case";
import { UpdatePropertyUseCase } from "@/use-cases/properties/update-property/update-property.use-case";
import { CreatePropertyOwnerUseCase } from "@/use-cases/property-owners/create-property-owner/create-property-owner.use-case";
import { DeletePropertyOwnerUseCase } from "@/use-cases/property-owners/delete-property-owner/delete-property-owner.use-case";
import { GetPropertyOwnerUseCase } from "@/use-cases/property-owners/get-property-owner/get-property-owner.use-case";
import { ListPropertyOwnersUseCase } from "@/use-cases/property-owners/list-property-owners/list-property-owners.use-case";
import { UpdatePropertyOwnerUseCase } from "@/use-cases/property-owners/update-property-owner/update-property-owner.use-case";
import { AddPropertyPhotoUseCase } from "@/use-cases/property-photos/add-property-photo/add-property-photo.use-case";
import { RemovePropertyPhotoUseCase } from "@/use-cases/property-photos/remove-property-photo/remove-property-photo.use-case";
import { SetPrimaryPhotoUseCase } from "@/use-cases/property-photos/set-primary-photo/set-primary-photo.use-case";
import { ActivateSubscriptionUseCase } from "@/use-cases/subscription/activate-subscription/activate-subscription.use-case";
import { ChangePlanUseCase } from "@/use-cases/subscription/change-plan/change-plan.use-case";
import { GetCheckoutInfoUseCase } from "@/use-cases/subscription/get-checkout-info/get-checkout-info.use-case";
import { CreateTenantUseCase } from "@/use-cases/tenants/create-tenant/create-tenant.use-case";
import { DeleteTenantUseCase } from "@/use-cases/tenants/delete-tenant/delete-tenant.use-case";
import { GetTenantUseCase } from "@/use-cases/tenants/get-tenant/get-tenant.use-case";
import { ListTenantsUseCase } from "@/use-cases/tenants/list-tenants/list-tenants.use-case";
import { UpdateTenantUseCase } from "@/use-cases/tenants/update-tenant/update-tenant.use-case";
import { ActivateUserUseCase } from "@/use-cases/users/activate-user/activate-user.use-case";
import { CreateUserUseCase } from "@/use-cases/users/create-user/create-user.use-case";
import { DeactivateUserUseCase } from "@/use-cases/users/deactivate-user/deactivate-user.use-case";
import { DeleteUserUseCase } from "@/use-cases/users/delete-user/delete-user.use-case";
import { GetUserUseCase } from "@/use-cases/users/get-user/get-user.use-case";
import { ListUsersUseCase } from "@/use-cases/users/list-users/list-users.use-case";
import { UpdateUserUseCase } from "@/use-cases/users/update-user/update-user.use-case";

// Repositories (mutable for test injection)
let userRepository: IUserRepository = new UserDrizzleRepository(db);
let companyRepository: ICompanyRepository = new CompanyDrizzleRepository(db);
let planRepository: IPlanRepository = new PlanDrizzleRepository(db);
const planFeatureRepository: IPlanFeatureRepository = new PlanFeatureDrizzleRepository(db);
let subscriptionRepository: ISubscriptionRepository = new SubscriptionDrizzleRepository(db);
let pendingPaymentRepository: IPendingPaymentRepository = new PendingPaymentDrizzleRepository(db);
let customFieldRepository: ICustomFieldRepository = new CustomFieldDrizzleRepository(db);
let customFieldResponseRepository: ICustomFieldResponseRepository =
  new CustomFieldResponseDrizzleRepository(db);
let propertyOwnerRepository: IPropertyOwnerRepository = new PropertyOwnerDrizzleRepository(db);
let tenantRepository: ITenantRepository = new TenantDrizzleRepository(db);
let propertyRepository: IPropertyRepository = new PropertyDrizzleRepository(db);
let propertyPhotoRepository: IPropertyPhotoRepository = new PropertyPhotoDrizzleRepository(db);
let contractRepository: IContractRepository = new ContractDrizzleRepository(db);
let documentRepository: IDocumentRepository = new DocumentDrizzleRepository(db);

// Services
const redisClient = getRedis();
let userCacheService: IUserCacheService = new UserCacheService(redisClient);
const customFieldCacheService = new CustomFieldCacheService();

// Auth
export const auth = {
  register: new RegisterUseCase(userRepository, planRepository),
  login: new LoginUseCase(
    userRepository,
    subscriptionRepository,
    customFieldRepository,
    planFeatureRepository,
  ),
  refreshTokens: new RefreshTokensUseCase(userRepository),
  confirmEmail: new ConfirmEmailUseCase(userRepository, subscriptionRepository, planRepository),
  resendVerificationCode: new ResendVerificationCodeUseCase(userRepository),
  getResendStatus: new GetResendStatusUseCase(userRepository),
  confirmPasswordReset: new ConfirmPasswordResetUseCase(userRepository),
  getPasswordResetStatus: new GetPasswordResetStatusUseCase(userRepository),
  validateEmailForReset: new ValidateEmailForResetUseCase(userRepository),
  resendPasswordResetCode: new ResendPasswordResetCodeUseCase(userRepository),
  getMe: new GetMeUseCase(
    userRepository,
    subscriptionRepository,
    customFieldRepository,
    customFieldResponseRepository,
    getFeatureService(),
  ),
};

// Users
export const users = {
  getUser: new GetUserUseCase(),
  createUser: new CreateUserUseCase(
    userRepository,
    companyRepository,
    subscriptionRepository,
    planRepository,
    customFieldRepository,
    customFieldResponseRepository,
    getFeatureService(),
  ),
  listUsers: new ListUsersUseCase(
    userRepository,
    customFieldRepository,
    customFieldResponseRepository,
  ),
  updateUser: new UpdateUserUseCase(
    userRepository,
    subscriptionRepository,
    planRepository,
    userCacheService,
  ),
  deactivateUser: new DeactivateUserUseCase(userRepository, userCacheService),
  deleteUser: new DeleteUserUseCase(userRepository),
  activateUser: new ActivateUserUseCase(userRepository, userCacheService),
};

// Subscriptions
export const subscriptions = {
  getCheckoutInfo: new GetCheckoutInfoUseCase(userRepository, subscriptionRepository),
  changePlan: new ChangePlanUseCase(subscriptionRepository, planRepository),
  activate: new ActivateSubscriptionUseCase(
    subscriptionRepository,
    planRepository,
    userRepository,
    userCacheService,
  ),
};

// Plans
export const plans = {
  listPlans: new ListPlansUseCase(planRepository),
  getPlan: new GetPlanUseCase(planRepository),
};

// Payment
export const payment = {
  createPendingPayment: new CreatePendingPaymentUseCase(
    userRepository,
    planRepository,
    pendingPaymentRepository,
  ),
  getPendingPayment: new GetPendingPaymentUseCase(pendingPaymentRepository, planRepository),
  processCardPayment: new ProcessCreditCardPaymentUseCase(
    pendingPaymentRepository,
    planRepository,
    userRepository,
    subscriptionRepository,
    paymentGateway,
  ),
  processWebhook: new ProcessPaymentWebhookUseCase(
    pendingPaymentRepository,
    userRepository,
    subscriptionRepository,
    planRepository,
    userCacheService,
    paymentGateway,
  ),
};

// Custom Fields
export const customFields = {
  create: new CreateCustomFieldUseCase(
    customFieldRepository,
    subscriptionRepository,
    getFeatureService(),
    customFieldCacheService,
  ),
  list: new ListCustomFieldsUseCase(
    customFieldRepository,
    subscriptionRepository,
    getFeatureService(),
    customFieldCacheService,
  ),
  update: new UpdateCustomFieldUseCase(customFieldRepository, customFieldCacheService),
  delete: new DeleteCustomFieldUseCase(customFieldRepository, customFieldCacheService),
  reorder: new ReorderCustomFieldsUseCase(customFieldRepository, customFieldCacheService),
  getMyFields: new GetMyFieldsUseCase(
    userRepository,
    subscriptionRepository,
    customFieldRepository,
    customFieldResponseRepository,
    getFeatureService(),
  ),
  saveMyFields: new SaveMyFieldsUseCase(
    userRepository,
    subscriptionRepository,
    customFieldRepository,
    customFieldResponseRepository,
    getFeatureService(),
  ),
  getUserFields: new GetUserFieldsUseCase(
    userRepository,
    subscriptionRepository,
    customFieldRepository,
    customFieldResponseRepository,
    getFeatureService(),
  ),
};

// Property Owners
export const propertyOwners = {
  create: new CreatePropertyOwnerUseCase(
    propertyOwnerRepository,
    getDocumentValidationService(),
    getContactValidationService(),
  ),
  list: new ListPropertyOwnersUseCase(propertyOwnerRepository),
  get: new GetPropertyOwnerUseCase(propertyOwnerRepository),
  update: new UpdatePropertyOwnerUseCase(
    propertyOwnerRepository,
    getDocumentValidationService(),
    getContactValidationService(),
  ),
  delete: new DeletePropertyOwnerUseCase(propertyOwnerRepository, propertyRepository),
};

// Tenants
export const tenants = {
  create: new CreateTenantUseCase(
    tenantRepository,
    getDocumentValidationService(),
    getContactValidationService(),
  ),
  list: new ListTenantsUseCase(tenantRepository),
  get: new GetTenantUseCase(tenantRepository),
  update: new UpdateTenantUseCase(
    tenantRepository,
    getDocumentValidationService(),
    getContactValidationService(),
  ),
  delete: new DeleteTenantUseCase(tenantRepository, contractRepository),
};

// Properties
export const properties = {
  create: new CreatePropertyUseCase(propertyRepository, propertyOwnerRepository),
  list: new ListPropertiesUseCase(propertyRepository),
  get: new GetPropertyUseCase(
    propertyRepository,
    propertyOwnerRepository,
    propertyPhotoRepository,
    userRepository,
  ),
  update: new UpdatePropertyUseCase(propertyRepository, propertyOwnerRepository),
  delete: new DeletePropertyUseCase(
    propertyRepository,
    contractRepository,
    propertyPhotoRepository,
  ),
};

// Contracts
export const contracts = {
  create: new CreateContractUseCase(
    contractRepository,
    propertyRepository,
    propertyOwnerRepository,
    tenantRepository,
  ),
  list: new ListContractsUseCase(contractRepository),
  get: new GetContractUseCase(
    contractRepository,
    propertyRepository,
    propertyOwnerRepository,
    tenantRepository,
    userRepository,
  ),
  update: new UpdateContractUseCase(contractRepository, tenantRepository),
  terminate: new TerminateContractUseCase(contractRepository, propertyRepository),
};

// Dashboard
export const dashboard = {
  getStats: new GetDashboardStatsUseCase(
    propertyRepository,
    contractRepository,
    propertyOwnerRepository,
    tenantRepository,
  ),
};

// Companies
export const companies = {
  get: new GetCompanyUseCase(companyRepository),
  update: new UpdateCompanyUseCase(companyRepository),
};

// Property Photos
export const propertyPhotos = {
  add: new AddPropertyPhotoUseCase(propertyPhotoRepository, propertyRepository),
  remove: new RemovePropertyPhotoUseCase(
    propertyPhotoRepository,
    propertyRepository,
    getStorageService(),
  ),
  setPrimary: new SetPrimaryPhotoUseCase(propertyPhotoRepository, propertyRepository),
};

// Documents
export const documents = {
  add: new AddDocumentUseCase(documentRepository, propertyOwnerRepository, tenantRepository),
  remove: new RemoveDocumentUseCase(
    documentRepository,
    propertyOwnerRepository,
    tenantRepository,
    getStorageService(),
  ),
  list: new ListDocumentsUseCase(documentRepository, propertyOwnerRepository, tenantRepository),
};

// Jobs
export const jobs = {
  cleanupExpiredPayments: new CleanupExpiredPaymentsJob(pendingPaymentRepository),
};

// Container exports - using getters to ensure we always get the current reference
export const container = {
  get userRepository() {
    return userRepository;
  },
  get companyRepository() {
    return companyRepository;
  },
  get planRepository() {
    return planRepository;
  },
  get subscriptionRepository() {
    return subscriptionRepository;
  },
  get pendingPaymentRepository() {
    return pendingPaymentRepository;
  },
  get customFieldRepository() {
    return customFieldRepository;
  },
  get customFieldResponseRepository() {
    return customFieldResponseRepository;
  },
  get userCacheService() {
    return userCacheService;
  },
  get propertyOwnerRepository() {
    return propertyOwnerRepository;
  },
  get tenantRepository() {
    return tenantRepository;
  },
  get propertyRepository() {
    return propertyRepository;
  },
  get propertyPhotoRepository() {
    return propertyPhotoRepository;
  },
  get contractRepository() {
    return contractRepository;
  },
  get documentRepository() {
    return documentRepository;
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
};

/**
 * Inject test repositories (for testing only)
 */
export function injectTestRepositories(repositories: {
  userRepository?: IUserRepository;
  companyRepository?: ICompanyRepository;
  planRepository?: IPlanRepository;
  subscriptionRepository?: ISubscriptionRepository;
  pendingPaymentRepository?: IPendingPaymentRepository;
  propertyOwnerRepository?: IPropertyOwnerRepository;
  tenantRepository?: ITenantRepository;
  propertyRepository?: IPropertyRepository;
  propertyPhotoRepository?: IPropertyPhotoRepository;
  contractRepository?: IContractRepository;
  documentRepository?: IDocumentRepository;
  customFieldRepository?: ICustomFieldRepository;
  customFieldResponseRepository?: ICustomFieldResponseRepository;
  userCacheService?: IUserCacheService;
}): void {
  if (repositories.userRepository) userRepository = repositories.userRepository;
  if (repositories.companyRepository) companyRepository = repositories.companyRepository;
  if (repositories.planRepository) planRepository = repositories.planRepository;
  if (repositories.subscriptionRepository)
    subscriptionRepository = repositories.subscriptionRepository;
  if (repositories.pendingPaymentRepository)
    pendingPaymentRepository = repositories.pendingPaymentRepository;
  if (repositories.propertyOwnerRepository)
    propertyOwnerRepository = repositories.propertyOwnerRepository;
  if (repositories.tenantRepository) tenantRepository = repositories.tenantRepository;
  if (repositories.propertyRepository) propertyRepository = repositories.propertyRepository;
  if (repositories.propertyPhotoRepository)
    propertyPhotoRepository = repositories.propertyPhotoRepository;
  if (repositories.contractRepository) contractRepository = repositories.contractRepository;
  if (repositories.documentRepository) documentRepository = repositories.documentRepository;
  if (repositories.customFieldRepository)
    customFieldRepository = repositories.customFieldRepository;
  if (repositories.customFieldResponseRepository)
    customFieldResponseRepository = repositories.customFieldResponseRepository;
  if (repositories.userCacheService) userCacheService = repositories.userCacheService;

  // Rebuild use cases that use the injected repositories
  // Subscriptions
  subscriptions.getCheckoutInfo = new GetCheckoutInfoUseCase(
    userRepository,
    subscriptionRepository,
  );
  subscriptions.activate = new ActivateSubscriptionUseCase(
    subscriptionRepository,
    planRepository,
    userRepository,
    userCacheService,
  );
  subscriptions.changePlan = new ChangePlanUseCase(subscriptionRepository, planRepository);

  // Auth use cases
  auth.login = new LoginUseCase(
    userRepository,
    subscriptionRepository,
    customFieldRepository,
    planFeatureRepository,
  );
  auth.register = new RegisterUseCase(userRepository, planRepository);
  auth.confirmEmail = new ConfirmEmailUseCase(
    userRepository,
    subscriptionRepository,
    planRepository,
  );

  // Users use cases that use cache
  users.updateUser = new UpdateUserUseCase(
    userRepository,
    subscriptionRepository,
    planRepository,
    userCacheService,
  );
  users.deactivateUser = new DeactivateUserUseCase(userRepository, userCacheService);
  users.activateUser = new ActivateUserUseCase(userRepository, userCacheService);

  // Payment use cases
  payment.processWebhook = new ProcessPaymentWebhookUseCase(
    pendingPaymentRepository,
    userRepository,
    subscriptionRepository,
    planRepository,
    userCacheService,
    paymentGateway,
  );

  // Property Owners use cases
  propertyOwners.create = new CreatePropertyOwnerUseCase(
    propertyOwnerRepository,
    getDocumentValidationService(),
    getContactValidationService(),
  );
  propertyOwners.list = new ListPropertyOwnersUseCase(propertyOwnerRepository);
  propertyOwners.get = new GetPropertyOwnerUseCase(propertyOwnerRepository);
  propertyOwners.update = new UpdatePropertyOwnerUseCase(
    propertyOwnerRepository,
    getDocumentValidationService(),
    getContactValidationService(),
  );
  propertyOwners.delete = new DeletePropertyOwnerUseCase(
    propertyOwnerRepository,
    propertyRepository,
  );

  // Tenants use cases
  tenants.create = new CreateTenantUseCase(
    tenantRepository,
    getDocumentValidationService(),
    getContactValidationService(),
  );
  tenants.list = new ListTenantsUseCase(tenantRepository);
  tenants.get = new GetTenantUseCase(tenantRepository);
  tenants.update = new UpdateTenantUseCase(
    tenantRepository,
    getDocumentValidationService(),
    getContactValidationService(),
  );
  tenants.delete = new DeleteTenantUseCase(tenantRepository, contractRepository);

  // Properties use cases
  properties.create = new CreatePropertyUseCase(propertyRepository, propertyOwnerRepository);
  properties.list = new ListPropertiesUseCase(propertyRepository);
  properties.get = new GetPropertyUseCase(
    propertyRepository,
    propertyOwnerRepository,
    propertyPhotoRepository,
    userRepository,
  );
  properties.update = new UpdatePropertyUseCase(propertyRepository, propertyOwnerRepository);
  properties.delete = new DeletePropertyUseCase(
    propertyRepository,
    contractRepository,
    propertyPhotoRepository,
  );

  // Property Photos use cases
  propertyPhotos.add = new AddPropertyPhotoUseCase(propertyPhotoRepository, propertyRepository);
  propertyPhotos.remove = new RemovePropertyPhotoUseCase(
    propertyPhotoRepository,
    propertyRepository,
    getStorageService(),
  );
  propertyPhotos.setPrimary = new SetPrimaryPhotoUseCase(
    propertyPhotoRepository,
    propertyRepository,
  );

  // Contracts use cases
  contracts.create = new CreateContractUseCase(
    contractRepository,
    propertyRepository,
    propertyOwnerRepository,
    tenantRepository,
  );
  contracts.list = new ListContractsUseCase(contractRepository);
  contracts.get = new GetContractUseCase(
    contractRepository,
    propertyRepository,
    propertyOwnerRepository,
    tenantRepository,
    userRepository,
  );
  contracts.update = new UpdateContractUseCase(contractRepository, tenantRepository);
  contracts.terminate = new TerminateContractUseCase(contractRepository, propertyRepository);

  // Documents use cases
  documents.add = new AddDocumentUseCase(
    documentRepository,
    propertyOwnerRepository,
    tenantRepository,
  );
  documents.list = new ListDocumentsUseCase(
    documentRepository,
    propertyOwnerRepository,
    tenantRepository,
  );
  documents.remove = new RemoveDocumentUseCase(
    documentRepository,
    propertyOwnerRepository,
    tenantRepository,
    getStorageService(),
  );

  // Companies use cases
  companies.get = new GetCompanyUseCase(companyRepository);
  companies.update = new UpdateCompanyUseCase(companyRepository);

  // Dashboard use cases
  dashboard.getStats = new GetDashboardStatsUseCase(
    propertyRepository,
    contractRepository,
    propertyOwnerRepository,
    tenantRepository,
  );

  // Plans use cases
  plans.listPlans = new ListPlansUseCase(planRepository);
  plans.getPlan = new GetPlanUseCase(planRepository);

  // Payment use cases
  payment.createPendingPayment = new CreatePendingPaymentUseCase(
    userRepository,
    planRepository,
    pendingPaymentRepository,
  );
  payment.getPendingPayment = new GetPendingPaymentUseCase(
    pendingPaymentRepository,
    planRepository,
  );
  payment.processCardPayment = new ProcessCreditCardPaymentUseCase(
    pendingPaymentRepository,
    planRepository,
    userRepository,
    subscriptionRepository,
    paymentGateway,
  );

  // Auth use cases (remaining)
  auth.refreshTokens = new RefreshTokensUseCase(userRepository);
  auth.resendVerificationCode = new ResendVerificationCodeUseCase(userRepository);
  auth.getResendStatus = new GetResendStatusUseCase(userRepository);
  auth.confirmPasswordReset = new ConfirmPasswordResetUseCase(userRepository);
  auth.getPasswordResetStatus = new GetPasswordResetStatusUseCase(userRepository);
  auth.validateEmailForReset = new ValidateEmailForResetUseCase(userRepository);
  auth.resendPasswordResetCode = new ResendPasswordResetCodeUseCase(userRepository);
  auth.getMe = new GetMeUseCase(
    userRepository,
    subscriptionRepository,
    customFieldRepository,
    customFieldResponseRepository,
    getFeatureService(),
  );

  // Users use cases (remaining)
  users.getUser = new GetUserUseCase();
  users.createUser = new CreateUserUseCase(
    userRepository,
    companyRepository,
    subscriptionRepository,
    planRepository,
    customFieldRepository,
    customFieldResponseRepository,
    getFeatureService(),
  );
  users.listUsers = new ListUsersUseCase(
    userRepository,
    customFieldRepository,
    customFieldResponseRepository,
  );
  users.deleteUser = new DeleteUserUseCase(userRepository);

  // Custom fields use cases
  customFields.create = new CreateCustomFieldUseCase(
    customFieldRepository,
    subscriptionRepository,
    getFeatureService(),
    customFieldCacheService,
  );
  customFields.list = new ListCustomFieldsUseCase(
    customFieldRepository,
    subscriptionRepository,
    getFeatureService(),
    customFieldCacheService,
  );
  customFields.update = new UpdateCustomFieldUseCase(
    customFieldRepository,
    customFieldCacheService,
  );
  customFields.delete = new DeleteCustomFieldUseCase(
    customFieldRepository,
    customFieldCacheService,
  );
  customFields.reorder = new ReorderCustomFieldsUseCase(
    customFieldRepository,
    customFieldCacheService,
  );
  customFields.getMyFields = new GetMyFieldsUseCase(
    userRepository,
    subscriptionRepository,
    customFieldRepository,
    customFieldResponseRepository,
    getFeatureService(),
  );
  customFields.saveMyFields = new SaveMyFieldsUseCase(
    userRepository,
    subscriptionRepository,
    customFieldRepository,
    customFieldResponseRepository,
    getFeatureService(),
  );
  customFields.getUserFields = new GetUserFieldsUseCase(
    userRepository,
    subscriptionRepository,
    customFieldRepository,
    customFieldResponseRepository,
    getFeatureService(),
  );
}
