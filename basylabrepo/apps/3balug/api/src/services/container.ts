import type { AwilixContainer } from "awilix";
import { asFunction, createContainer } from "awilix";
import { env } from "@/config/env";
import { container as repositoryContainer } from "@/container";
import type { PlanFeatureSlug } from "@/types/features";
import { PLAN_FEATURES } from "@/types/features";
import type { IFeatureService } from "./contracts/feature-service.interface";
import type { IEmailService } from "./email/contracts/email-service.interface";
import { SmtpProvider } from "./email/providers/smtp/smtp.provider";
import { FeatureService } from "./feature/feature.service";
import type { IPaymentGateway } from "./payment/contracts/payment-gateway.interface";
import { PagarmeProvider } from "./payment/providers/pagarme/pagarme.provider";
import { ContactValidationService } from "./validation/contact-validation.service";
import { DocumentValidationService } from "./validation/document-validation.service";
import { PermissionValidationService } from "./validation/permission-validation.service";

/**
 * Mock FeatureService for test environment
 * Returns features based on plan slug without hitting the real database
 */
class MockFeatureService implements IFeatureService {
  private planFeatures: Record<string, PlanFeatureSlug[]> = {
    house: [PLAN_FEATURES.CUSTOM_FIELDS],
    imobiliaria: [PLAN_FEATURES.CUSTOM_FIELDS],
    basico: [],
  };

  async planHasFeature(planSlug: string, feature: PlanFeatureSlug): Promise<boolean> {
    const features = this.planFeatures[planSlug] || [];
    return features.includes(feature);
  }

  async getPlanFeatures(planSlug: string): Promise<PlanFeatureSlug[]> {
    return this.planFeatures[planSlug] || [];
  }

  async getPlansWithFeature(feature: PlanFeatureSlug): Promise<string[]> {
    return Object.entries(this.planFeatures)
      .filter(([_, features]) => features.includes(feature))
      .map(([slug]) => slug);
  }
}

/**
 * Service Container Configuration
 *
 * This container manages service instances using Awilix for dependency injection.
 * Services can be easily swapped by changing the provider in this file.
 */

export interface ServiceContainer {
  emailService: IEmailService;
  featureService: IFeatureService;
  paymentGateway: IPaymentGateway;
  permissionValidationService: PermissionValidationService;
  documentValidationService: DocumentValidationService;
  contactValidationService: ContactValidationService;
}

const serviceContainer = createContainer<ServiceContainer>();

/**
 * Store for replaced services (used in testing)
 * This allows services to be replaced before the container is resolved
 */
const replacedServices: Partial<ServiceContainer> = {};

serviceContainer.register({
  emailService: asFunction(() => {
    if (replacedServices.emailService) return replacedServices.emailService;
    return new SmtpProvider({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.EMAIL_FROM,
      totpStepSeconds: env.TOTP_STEP_SECONDS,
    });
  }).scoped(),

  featureService: asFunction(() => {
    if (replacedServices.featureService) return replacedServices.featureService;
    // Use mock in test environment to avoid database dependency
    if (env.NODE_ENV === "test") return new MockFeatureService();
    return new FeatureService();
  }).scoped(),

  paymentGateway: asFunction(() => {
    if (replacedServices.paymentGateway) return replacedServices.paymentGateway;
    return new PagarmeProvider({
      apiKey: env.PAGARME_API_KEY,
      statementDescriptor: "CRM IMOBIL",
    });
  }).scoped(),

  permissionValidationService: asFunction(() => {
    if (replacedServices.permissionValidationService)
      return replacedServices.permissionValidationService;
    return new PermissionValidationService(repositoryContainer.userRepository);
  }).scoped(),

  documentValidationService: asFunction(() => {
    if (replacedServices.documentValidationService)
      return replacedServices.documentValidationService;
    return new DocumentValidationService();
  }).scoped(),

  contactValidationService: asFunction(() => {
    if (replacedServices.contactValidationService) return replacedServices.contactValidationService;
    return new ContactValidationService();
  }).scoped(),
});

/**
 * Get the service container instance
 */
export function getServiceContainer(): AwilixContainer<ServiceContainer> {
  return serviceContainer;
}

/**
 * Resolve a service from the container
 */
export function getEmailService(): IEmailService {
  return serviceContainer.resolve("emailService");
}

export function getPaymentGateway(): IPaymentGateway {
  return serviceContainer.resolve("paymentGateway");
}

export function getFeatureService(): IFeatureService {
  return serviceContainer.resolve("featureService");
}

export function getPermissionValidationService(): PermissionValidationService {
  return serviceContainer.resolve("permissionValidationService");
}

export function getDocumentValidationService(): DocumentValidationService {
  return serviceContainer.resolve("documentValidationService");
}

export function getContactValidationService(): ContactValidationService {
  return serviceContainer.resolve("contactValidationService");
}

/**
 * Replace a service in the container (useful for testing)
 */
export function replaceService<K extends keyof ServiceContainer>(
  serviceName: K,
  service: ServiceContainer[K],
): void {
  replacedServices[serviceName] = service;
}
