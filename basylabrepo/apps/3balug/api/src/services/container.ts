import type { AwilixContainer } from "awilix";
import { asFunction, createContainer } from "awilix";
import { ContactValidator, DocumentValidator } from "@basylab/core/validation";
import { env } from "@/config/env";
import { container as repositoryContainer } from "@/container";
import { PermissionValidationService } from "@/utils/permission-validation";
import type { IEmailService } from "./email/contracts/email-service.interface";
import { SmtpProvider } from "./email/providers/smtp/smtp.provider";
import type { IImageProcessorService } from "./image/contracts/image-processor.interface";
import { SharpImageProcessor } from "./image/providers/sharp/sharp.provider";
import type { IPaymentGateway } from "./payment/contracts/payment-gateway.interface";
import { PagarmeProvider } from "./payment/providers/pagarme/pagarme.provider";
import type { IStorageService } from "./storage/contracts/storage.interface";
import { MinioStorageProvider } from "./storage/providers/minio/minio.provider";

/**
 * Service Container Configuration
 *
 * This container manages service instances using Awilix for dependency injection.
 * Services can be easily swapped by changing the provider in this file.
 *
 * NOTE: This container is for external services/libs only (email, payment, storage, image).
 * Business logic is handled via repositories and domain services.
 */

export interface ServiceContainer {
  emailService: IEmailService;
  paymentGateway: IPaymentGateway;
  storageService: IStorageService;
  imageProcessor: IImageProcessorService;
  permissionValidationService: PermissionValidationService;
  documentValidator: DocumentValidator;
  contactValidator: ContactValidator;
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

  paymentGateway: asFunction(() => {
    if (replacedServices.paymentGateway) return replacedServices.paymentGateway;
    return new PagarmeProvider({
      apiKey: env.PAGARME_API_KEY,
      statementDescriptor: "CRM IMOBIL",
    });
  }).scoped(),

  storageService: asFunction(() => {
    if (replacedServices.storageService) return replacedServices.storageService;
    return new MinioStorageProvider();
  }).scoped(),

  imageProcessor: asFunction(() => {
    if (replacedServices.imageProcessor) return replacedServices.imageProcessor;
    return new SharpImageProcessor();
  }).scoped(),

  permissionValidationService: asFunction(() => {
    if (replacedServices.permissionValidationService)
      return replacedServices.permissionValidationService;
    return new PermissionValidationService(repositoryContainer.userRepository);
  }).scoped(),

  documentValidator: asFunction(() => {
    if (replacedServices.documentValidator) return replacedServices.documentValidator;
    return new DocumentValidator();
  }).scoped(),

  contactValidator: asFunction(() => {
    if (replacedServices.contactValidator) return replacedServices.contactValidator;
    return new ContactValidator();
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

export function getStorageService(): IStorageService {
  return serviceContainer.resolve("storageService");
}

export function getImageProcessor(): IImageProcessorService {
  return serviceContainer.resolve("imageProcessor");
}

export function getPermissionValidationService(): PermissionValidationService {
  return serviceContainer.resolve("permissionValidationService");
}

export function getDocumentValidator(): DocumentValidator {
  return serviceContainer.resolve("documentValidator");
}

export function getContactValidator(): ContactValidator {
  return serviceContainer.resolve("contactValidator");
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
