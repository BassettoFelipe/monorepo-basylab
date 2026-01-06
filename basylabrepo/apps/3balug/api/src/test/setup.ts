import { treaty } from "@elysiajs/eden";
import { injectTestRepositories } from "@/container/index";
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
import type { App } from "@/server";
import { app } from "@/server";

/**
 * Type-safe Eden Treaty client for the application
 */
export type AppClient = ReturnType<typeof treaty<App>>;

import {
  InMemoryCompanyRepository,
  InMemoryContractRepository,
  InMemoryCustomFieldRepository,
  InMemoryCustomFieldResponseRepository,
  InMemoryDocumentRepository,
  InMemoryPendingPaymentRepository,
  InMemoryPlanFeatureRepository,
  InMemoryPlanRepository,
  InMemoryPropertyOwnerRepository,
  InMemoryPropertyPhotoRepository,
  InMemoryPropertyRepository,
  InMemorySubscriptionRepository,
  InMemoryTenantRepository,
  InMemoryUserCacheService,
  InMemoryUserRepository,
} from "./mock-repository";

let userRepository: InMemoryUserRepository | null = null;
let companyRepository: InMemoryCompanyRepository | null = null;
let planRepository: InMemoryPlanRepository | null = null;
let planFeatureRepository: InMemoryPlanFeatureRepository | null = null;
let subscriptionRepository: InMemorySubscriptionRepository | null = null;
let pendingPaymentRepository: InMemoryPendingPaymentRepository | null = null;
let propertyOwnerRepository: InMemoryPropertyOwnerRepository | null = null;
let tenantRepository: InMemoryTenantRepository | null = null;
let propertyRepository: InMemoryPropertyRepository | null = null;
let propertyPhotoRepository: InMemoryPropertyPhotoRepository | null = null;
let contractRepository: InMemoryContractRepository | null = null;
let customFieldRepository: InMemoryCustomFieldRepository | null = null;
let customFieldResponseRepository: InMemoryCustomFieldResponseRepository | null = null;
let documentRepository: InMemoryDocumentRepository | null = null;
let userCacheService: InMemoryUserCacheService | null = null;

export function getUserRepository(): IUserRepository {
  if (!userRepository) {
    userRepository = new InMemoryUserRepository();
  }
  return userRepository;
}

export function getCompanyRepository(): ICompanyRepository {
  if (!companyRepository) {
    companyRepository = new InMemoryCompanyRepository();
  }
  return companyRepository;
}

export function getPlanRepository(): IPlanRepository {
  if (!planRepository) {
    planRepository = new InMemoryPlanRepository();
    planRepository.seedTestPlans();
  }
  return planRepository;
}

export function getPlanFeatureRepository(): IPlanFeatureRepository {
  if (!planFeatureRepository) {
    planFeatureRepository = new InMemoryPlanFeatureRepository();
    planFeatureRepository.setPlanRepository(getPlanRepository() as InMemoryPlanRepository);
  }
  return planFeatureRepository;
}

export function getSubscriptionRepository(): ISubscriptionRepository {
  if (!subscriptionRepository) {
    subscriptionRepository = new InMemorySubscriptionRepository();
  }
  return subscriptionRepository;
}

export function getPendingPaymentRepository(): IPendingPaymentRepository {
  if (!pendingPaymentRepository) {
    pendingPaymentRepository = new InMemoryPendingPaymentRepository();
  }
  return pendingPaymentRepository;
}

export function getPropertyOwnerRepository(): IPropertyOwnerRepository {
  if (!propertyOwnerRepository) {
    propertyOwnerRepository = new InMemoryPropertyOwnerRepository();
  }
  return propertyOwnerRepository;
}

export function getTenantRepository(): ITenantRepository {
  if (!tenantRepository) {
    tenantRepository = new InMemoryTenantRepository();
  }
  return tenantRepository;
}

export function getPropertyRepository(): IPropertyRepository {
  if (!propertyRepository) {
    propertyRepository = new InMemoryPropertyRepository();
  }
  return propertyRepository;
}

export function getPropertyPhotoRepository(): IPropertyPhotoRepository {
  if (!propertyPhotoRepository) {
    propertyPhotoRepository = new InMemoryPropertyPhotoRepository();
  }
  return propertyPhotoRepository;
}

export function getContractRepository(): IContractRepository {
  if (!contractRepository) {
    contractRepository = new InMemoryContractRepository();
  }
  return contractRepository;
}

export function getCustomFieldRepository(): ICustomFieldRepository {
  if (!customFieldRepository) {
    customFieldRepository = new InMemoryCustomFieldRepository();
  }
  return customFieldRepository;
}

export function getCustomFieldResponseRepository(): ICustomFieldResponseRepository {
  if (!customFieldResponseRepository) {
    customFieldResponseRepository = new InMemoryCustomFieldResponseRepository();
  }
  return customFieldResponseRepository;
}

export function getDocumentRepository(): IDocumentRepository {
  if (!documentRepository) {
    documentRepository = new InMemoryDocumentRepository();
  }
  return documentRepository;
}

export function getUserCacheService(): InMemoryUserCacheService {
  if (!userCacheService) {
    userCacheService = new InMemoryUserCacheService();
  }
  return userCacheService;
}

/**
 * Creates an authenticated Eden Treaty client with pre-set Authorization header.
 * This provides type-safe E2E testing with automatic auth token injection.
 *
 * @param token - The JWT access token to use for authentication
 * @returns Type-safe Eden Treaty client with auth header
 *
 * @example
 * ```ts
 * const token = await generateTestToken(user.id);
 * const authClient = createAuthenticatedClient(token);
 * const { data } = await authClient.users.me.get();
 * ```
 */
export function createAuthenticatedClient(token: string): AppClient {
  return treaty<App>(app, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function createTestApp() {
  const testUserRepository = getUserRepository() as InMemoryUserRepository;
  const testCompanyRepository = getCompanyRepository() as InMemoryCompanyRepository;
  const testPlanRepository = getPlanRepository() as InMemoryPlanRepository;
  const testPlanFeatureRepository = getPlanFeatureRepository() as InMemoryPlanFeatureRepository;
  const testSubscriptionRepository = getSubscriptionRepository() as InMemorySubscriptionRepository;
  const testPendingPaymentRepository =
    getPendingPaymentRepository() as InMemoryPendingPaymentRepository;
  const testPropertyOwnerRepository =
    getPropertyOwnerRepository() as InMemoryPropertyOwnerRepository;
  const testTenantRepository = getTenantRepository() as InMemoryTenantRepository;
  const testPropertyRepository = getPropertyRepository() as InMemoryPropertyRepository;
  const testPropertyPhotoRepository =
    getPropertyPhotoRepository() as InMemoryPropertyPhotoRepository;
  const testContractRepository = getContractRepository() as InMemoryContractRepository;
  const testCustomFieldRepository = getCustomFieldRepository() as InMemoryCustomFieldRepository;
  const testCustomFieldResponseRepository =
    getCustomFieldResponseRepository() as InMemoryCustomFieldResponseRepository;
  const testDocumentRepository = getDocumentRepository() as InMemoryDocumentRepository;
  const testUserCacheService = getUserCacheService();

  testSubscriptionRepository.setPlanRepository(testPlanRepository);
  testUserRepository.setCompanyRepository(testCompanyRepository);
  testUserRepository.setSubscriptionRepository(testSubscriptionRepository);
  testContractRepository.setPropertyRepository(testPropertyRepository);
  testPlanFeatureRepository.setPlanRepository(testPlanRepository);

  injectTestRepositories({
    userRepository: testUserRepository,
    companyRepository: testCompanyRepository,
    planRepository: testPlanRepository,
    planFeatureRepository: testPlanFeatureRepository,
    subscriptionRepository: testSubscriptionRepository,
    pendingPaymentRepository: testPendingPaymentRepository,
    propertyOwnerRepository: testPropertyOwnerRepository,
    tenantRepository: testTenantRepository,
    propertyRepository: testPropertyRepository,
    propertyPhotoRepository: testPropertyPhotoRepository,
    contractRepository: testContractRepository,
    customFieldRepository: testCustomFieldRepository,
    customFieldResponseRepository: testCustomFieldResponseRepository,
    documentRepository: testDocumentRepository,
    userCacheService: testUserCacheService,
  });

  // Create type-safe Eden Treaty client
  const client = treaty<App>(app);

  return {
    app,
    client,
    createAuthenticatedClient,
    userRepository: testUserRepository,
    companyRepository: testCompanyRepository,
    planRepository: testPlanRepository,
    planFeatureRepository: testPlanFeatureRepository,
    subscriptionRepository: testSubscriptionRepository,
    pendingPaymentRepository: testPendingPaymentRepository,
    propertyOwnerRepository: testPropertyOwnerRepository,
    tenantRepository: testTenantRepository,
    propertyRepository: testPropertyRepository,
    propertyPhotoRepository: testPropertyPhotoRepository,
    contractRepository: testContractRepository,
    customFieldRepository: testCustomFieldRepository,
    customFieldResponseRepository: testCustomFieldResponseRepository,
    documentRepository: testDocumentRepository,
    userCacheService: testUserCacheService,
  };
}

export function clearTestData() {
  if (userRepository) userRepository.clear();
  if (companyRepository) companyRepository.clear();
  if (subscriptionRepository) subscriptionRepository.clear();
  if (pendingPaymentRepository) pendingPaymentRepository.clear();
  if (propertyOwnerRepository) propertyOwnerRepository.clear();
  if (tenantRepository) tenantRepository.clear();
  if (propertyRepository) propertyRepository.clear();
  if (propertyPhotoRepository) propertyPhotoRepository.clear();
  if (contractRepository) contractRepository.clear();
  if (customFieldRepository) customFieldRepository.clear();
  if (customFieldResponseRepository) customFieldResponseRepository.clear();
  if (documentRepository) documentRepository.clear();
  if (userCacheService) userCacheService.clear();
  // Reseed plans after clearing - plans are required for most tests
  if (planRepository) {
    planRepository.clear();
    planRepository.seedTestPlans();
  }
}

export function resetAllRepositories() {
  if (userRepository) userRepository.clear();
  if (companyRepository) companyRepository.clear();
  if (planRepository) {
    planRepository.clear();
    planRepository.seedTestPlans();
  }
  if (subscriptionRepository) subscriptionRepository.clear();
  if (pendingPaymentRepository) pendingPaymentRepository.clear();
  if (propertyOwnerRepository) propertyOwnerRepository.clear();
  if (tenantRepository) tenantRepository.clear();
  if (propertyRepository) propertyRepository.clear();
  if (propertyPhotoRepository) propertyPhotoRepository.clear();
  if (contractRepository) contractRepository.clear();
  if (customFieldRepository) customFieldRepository.clear();
  if (customFieldResponseRepository) customFieldResponseRepository.clear();
  if (documentRepository) documentRepository.clear();
  if (userCacheService) userCacheService.clear();
}
