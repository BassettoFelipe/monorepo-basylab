import type { IEmailService } from "./contracts/email-service.interface";

/**
 * Email Service
 *
 * Lazy-loaded getter for the configured email service from the DI container.
 * To change the email provider, update the configuration in services/container.ts
 */

let _emailService: IEmailService | null = null;

export function getEmailServiceInstance(): IEmailService {
  if (!_emailService) {
    const { getEmailService } = require("@/services/container");
    _emailService = getEmailService();
  }
  return _emailService as IEmailService;
}

export const emailService = new Proxy({} as IEmailService, {
  get(_target, prop: string | symbol): unknown {
    const service = getEmailServiceInstance();
    const value = service[prop as keyof IEmailService];
    return typeof value === "function"
      ? (value as (...args: never[]) => unknown).bind(service)
      : value;
  },
});

export type { IEmailService } from "./contracts/email-service.interface";
export { EmailServiceError } from "./contracts/email-service.interface";
