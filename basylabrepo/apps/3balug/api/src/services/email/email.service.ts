/**
 * @deprecated Use `@/services/email` instead
 *
 * This file is kept for backward compatibility.
 * The email service has been refactored into a provider-based architecture.
 */

export type { IEmailService } from './contracts/email-service.interface'
export { EmailServiceError, emailService } from './index'
