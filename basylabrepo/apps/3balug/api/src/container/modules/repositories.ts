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

export interface Repositories {
  userRepository: IUserRepository;
  companyRepository: ICompanyRepository;
  planRepository: IPlanRepository;
  planFeatureRepository: IPlanFeatureRepository;
  subscriptionRepository: ISubscriptionRepository;
  pendingPaymentRepository: IPendingPaymentRepository;
  customFieldRepository: ICustomFieldRepository;
  customFieldResponseRepository: ICustomFieldResponseRepository;
  propertyOwnerRepository: IPropertyOwnerRepository;
  tenantRepository: ITenantRepository;
  propertyRepository: IPropertyRepository;
  propertyPhotoRepository: IPropertyPhotoRepository;
  contractRepository: IContractRepository;
  documentRepository: IDocumentRepository;
}

export const repositories: Repositories = {
  userRepository: new UserDrizzleRepository(db),
  companyRepository: new CompanyDrizzleRepository(db),
  planRepository: new PlanDrizzleRepository(db),
  planFeatureRepository: new PlanFeatureDrizzleRepository(db),
  subscriptionRepository: new SubscriptionDrizzleRepository(db),
  pendingPaymentRepository: new PendingPaymentDrizzleRepository(db),
  customFieldRepository: new CustomFieldDrizzleRepository(db),
  customFieldResponseRepository: new CustomFieldResponseDrizzleRepository(db),
  propertyOwnerRepository: new PropertyOwnerDrizzleRepository(db),
  tenantRepository: new TenantDrizzleRepository(db),
  propertyRepository: new PropertyDrizzleRepository(db),
  propertyPhotoRepository: new PropertyPhotoDrizzleRepository(db),
  contractRepository: new ContractDrizzleRepository(db),
  documentRepository: new DocumentDrizzleRepository(db),
};
