import { db } from "@/db";
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

export let userRepository: IUserRepository = new UserDrizzleRepository(db);
export let companyRepository: ICompanyRepository = new CompanyDrizzleRepository(db);
export let planRepository: IPlanRepository = new PlanDrizzleRepository(db);
export let planFeatureRepository: IPlanFeatureRepository = new PlanFeatureDrizzleRepository(db);
export let subscriptionRepository: ISubscriptionRepository = new SubscriptionDrizzleRepository(db);
export let pendingPaymentRepository: IPendingPaymentRepository =
  new PendingPaymentDrizzleRepository(db);
export let customFieldRepository: ICustomFieldRepository = new CustomFieldDrizzleRepository(db);
export let customFieldResponseRepository: ICustomFieldResponseRepository =
  new CustomFieldResponseDrizzleRepository(db);
export let propertyOwnerRepository: IPropertyOwnerRepository =
  new PropertyOwnerDrizzleRepository(db);
export let tenantRepository: ITenantRepository = new TenantDrizzleRepository(db);
export let propertyRepository: IPropertyRepository = new PropertyDrizzleRepository(db);
export let propertyPhotoRepository: IPropertyPhotoRepository =
  new PropertyPhotoDrizzleRepository(db);
export let contractRepository: IContractRepository = new ContractDrizzleRepository(db);
export let documentRepository: IDocumentRepository = new DocumentDrizzleRepository(db);
