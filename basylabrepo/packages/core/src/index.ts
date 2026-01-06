// Auth
export {
	createJwtUtils,
	createTotpUtils,
	type JwtConfig,
	type JwtUtils,
	PasswordUtils,
	type TokenOptions,
	type TokenPayload,
	type TotpConfig,
	type TotpUtils,
} from './auth'

// Crypto
export {
	EncryptionUtils,
	HashUtils,
	PasswordUtils as CryptoPasswordUtils,
	RandomUtils,
} from './crypto'
// Dates
export { DateUtils } from './dates'
// Errors
export {
	AccountAlreadyVerifiedError,
	AccountDeactivatedError,
	AccountLockedError,
	AccountNotVerifiedError,
	AppError,
	AuthenticationRequiredError,
	// 400 Bad Request
	BadRequestError,
	BusinessRuleError,
	ConfigurationError,
	// 409 Conflict
	ConflictError,
	DatabaseError,
	DuplicateSubscriptionError,
	EmailAlreadyExistsError,
	EmailNotVerifiedError,
	EmailSendFailedError,
	type ErrorCode,
	ErrorCodes,
	// 502 External
	ExternalServiceError,
	// 403 Forbidden
	ForbiddenError,
	InsufficientPermissionsError,
	// 500 Server
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
	// 404 Not Found
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
	// 429 Rate Limit
	TooManyRequestsError,
	// 401 Unauthorized
	UnauthorizedError,
	UserNotFoundError,
	// 422 Validation
	ValidationError,
	VerificationCodeExpiredError,
	WeakPasswordError,
	WebhookValidationError,
} from './errors'
// Files
export { FileUtils, FileValidation, MimeTypes, StorageUrlUtils } from './files'
// Logger
export {
	type CreateLoggerOptions,
	createChildLogger,
	createLogger,
	type Logger,
} from './logger'
// Types
export type {
	ApiErrorResponse,
	ApiResponse,
	AuditableEntity,
	BaseEntity,
	DateRange,
	Filter,
	FilterOperator,
	Nullable,
	Optional,
	OptionalFields,
	PaginatedResponse,
	PaginationParams,
	RequireFields,
	Result,
	SoftDeleteEntity,
	Sort,
} from './types'
// Validation
export { Sanitizers, Validators } from './validation'
