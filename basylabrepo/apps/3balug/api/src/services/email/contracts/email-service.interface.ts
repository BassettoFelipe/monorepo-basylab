/**
 * Generic Email Service Interface
 *
 * This interface abstracts email sending operations to allow
 * multiple email providers (SMTP, AWS SES, SendGrid, etc.) without
 * changing business logic in use cases.
 */

export interface IEmailService {
	/**
	 * Sends a verification code email to the user
	 * @param to - Recipient email address
	 * @param name - Recipient name
	 * @param code - Verification code (typically 6 digits)
	 */
	sendVerificationCode(to: string, name: string, code: string): Promise<void>

	/**
	 * Sends a password reset code email to the user
	 * @param to - Recipient email address
	 * @param name - Recipient name
	 * @param code - Password reset code (typically 6 digits)
	 */
	sendPasswordResetCode(to: string, name: string, code: string): Promise<void>

	/**
	 * Sends an invitation email to a new user
	 * @param to - Recipient email address
	 * @param name - Recipient name
	 * @param companyName - Company name
	 * @param role - User role in the company
	 * @param invitedBy - Name of the person who sent the invitation
	 * @param resetPasswordUrl - URL for the user to set their password
	 */
	sendUserInvitation(
		to: string,
		name: string,
		companyName: string,
		role: string,
		invitedBy: string,
		resetPasswordUrl: string,
	): Promise<void>

	/**
	 * Verifies that the email service is properly configured and can connect
	 * @returns true if connection is successful, false otherwise
	 */
	verifyConnection(): Promise<boolean>
}

/**
 * Custom error class for email service failures
 */
export class EmailServiceError extends Error {
	public readonly originalError: Error

	constructor(message: string, originalError: Error) {
		super(message)
		this.name = 'EmailServiceError'
		this.originalError = originalError
		Object.setPrototypeOf(this, EmailServiceError.prototype)
	}
}
