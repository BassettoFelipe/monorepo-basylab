// Auth
export {
	createJwtUtils,
	createTotpUtils,
	PasswordUtils,
	type JwtConfig,
	type JwtUtils,
	type TokenPayload,
	type TokenOptions,
	type TotpConfig,
	type TotpUtils,
} from './auth'

// Crypto
export {
	PasswordUtils as CryptoPasswordUtils,
	RandomUtils,
	HashUtils,
	EncryptionUtils,
} from './crypto'

// Errors
export {
	AppError,
	ErrorCodes,
	type ErrorCode,
	// 400 Bad Request
	BadRequestError,
	BusinessRuleError,
	AccountNotVerifiedError,
	AccountAlreadyVerifiedError,
	EmailNotVerifiedError,
	AccountLockedError,
	InvalidVerificationCodeError,
	VerificationCodeExpiredError,
	InvalidPasswordResetCodeError,
	PasswordResetCodeExpiredError,
	OperationNotAllowedError,
	QuotaExceededError,
	PaymentExpiredError,
	PaymentAlreadyProcessedError,
	InvalidPaymentStatusError,
	WebhookValidationError,
	// 401 Unauthorized
	UnauthorizedError,
	InvalidCredentialsError,
	TokenExpiredError,
	InvalidTokenError,
	TokenNotFoundError,
	AuthenticationRequiredError,
	InvalidWebhookSignatureError,
	// 403 Forbidden
	ForbiddenError,
	InsufficientPermissionsError,
	SubscriptionRequiredError,
	SubscriptionExpiredError,
	PlanLimitExceededError,
	AccountDeactivatedError,
	// 404 Not Found
	NotFoundError,
	UserNotFoundError,
	PlanNotFoundError,
	SubscriptionNotFoundError,
	PaymentNotFoundError,
	PendingPaymentNotFoundError,
	// 409 Conflict
	ConflictError,
	EmailAlreadyExistsError,
	ResourceAlreadyExistsError,
	DuplicateSubscriptionError,
	// 422 Validation
	ValidationError,
	InvalidInputError,
	MissingRequiredFieldError,
	InvalidEmailError,
	InvalidCPFError,
	InvalidCNPJError,
	InvalidPhoneError,
	WeakPasswordError,
	// 429 Rate Limit
	TooManyRequestsError,
	RateLimitExceededError,
	TooManyAttemptsError,
	ResendLimitExceededError,
	// 500 Server
	InternalServerError,
	DatabaseError,
	ConfigurationError,
	// 502 External
	ExternalServiceError,
	PaymentGatewayError,
	EmailSendFailedError,
	SMSSendFailedError,
} from './errors'

// Logger
export {
	createLogger,
	createChildLogger,
	type CreateLoggerOptions,
	type Logger,
} from './logger'

// Validation
export { Validators, Sanitizers } from './validation'

// Types
export type {
	ApiResponse,
	ApiErrorResponse,
	PaginationParams,
	PaginatedResponse,
	FilterOperator,
	Filter,
	DateRange,
	Sort,
	BaseEntity,
	SoftDeleteEntity,
	AuditableEntity,
	Result,
	Nullable,
	Optional,
	RequireFields,
	OptionalFields,
} from './types'

// Dates
export { DateUtils } from './dates'

// Files
export { MimeTypes, FileUtils, FileValidation, StorageUrlUtils } from './files'
