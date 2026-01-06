export { AppError } from "./app.error";
export { type ErrorCode, ErrorCodes } from "./error-codes";
export { HttpError } from "./http-error";
export {
  AccountAlreadyVerifiedError,
  AccountDeactivatedError,
  AccountLockedError,
  AccountNotVerifiedError,
  AuthenticationRequiredError,
  // Validation errors (400, 422)
  BadRequestError,
  // Business rule errors (400)
  BusinessRuleError,
  ConfigurationError,
  // Conflict errors (409)
  ConflictError,
  DatabaseError,
  DuplicateSubscriptionError,
  EmailAlreadyExistsError,
  EmailNotVerifiedError,
  EmailSendFailedError,
  // External service errors (502, 503)
  ExternalServiceError,
  // Authorization errors (403)
  ForbiddenError,
  InsufficientPermissionsError,
  // Internal server errors (500)
  InternalServerError,
  InvalidCNPJError,
  InvalidCPFError,
  InvalidCredentialsError,
  InvalidEmailError,
  InvalidInputError,
  InvalidPasswordResetCodeError,
  InvalidPaymentStatusError,
  InvalidPhoneError,
  InvalidTokenError,
  InvalidVerificationCodeError,
  InvalidWebhookSignatureError,
  MissingRequiredFieldError,
  // Resource not found errors (404)
  NotFoundError,
  OperationNotAllowedError,
  PasswordResetCodeExpiredError,
  PaymentAlreadyProcessedError,
  PaymentExpiredError,
  PaymentGatewayError,
  PaymentNotFoundError,
  PendingPaymentNotFoundError,
  PlanLimitExceededError,
  PlanNotFoundError,
  QuotaExceededError,
  RateLimitExceededError,
  ResendLimitExceededError,
  ResourceAlreadyExistsError,
  SMSSendFailedError,
  SubscriptionExpiredError,
  SubscriptionNotFoundError,
  SubscriptionRequiredError,
  TokenExpiredError,
  TokenNotFoundError,
  TooManyAttemptsError,
  // Rate limiting errors (429)
  TooManyRequestsError,
  // Authentication errors (401)
  UnauthorizedError,
  UserNotFoundError,
  ValidationError,
  VerificationCodeExpiredError,
  WeakPasswordError,
  // Webhook errors
  WebhookValidationError,
} from "./standardized-errors";
