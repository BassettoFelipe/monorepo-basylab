import { AppError } from "./app.error";

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = "Email ou senha incorretos") {
    super(message, 401, "INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsError";
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = "Token expirado") {
    super(message, 401, "TOKEN_EXPIRED");
    this.name = "TokenExpiredError";
  }
}

export class InvalidTokenError extends AppError {
  constructor(message = "Token inválido") {
    super(message, 401, "INVALID_TOKEN");
    this.name = "InvalidTokenError";
  }
}

export class TokenNotFoundError extends AppError {
  constructor(message = "Token não fornecido") {
    super(message, 401, "TOKEN_NOT_FOUND");
    this.name = "TokenNotFoundError";
  }
}

export class AuthenticationRequiredError extends AppError {
  constructor(message = "Você precisa estar autenticado para acessar este recurso") {
    super(message, 401, "AUTHENTICATION_REQUIRED");
    this.name = "AuthenticationRequiredError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(message = "Permissões insuficientes") {
    super(message, 403, "INSUFFICIENT_PERMISSIONS");
    this.name = "InsufficientPermissionsError";
  }
}

export class SubscriptionRequiredError extends AppError {
  constructor(message = "Assinatura ativa necessária") {
    super(message, 403, "SUBSCRIPTION_REQUIRED");
    this.name = "SubscriptionRequiredError";
  }
}

export class SubscriptionExpiredError extends AppError {
  constructor(message = "Assinatura expirada") {
    super(message, 403, "SUBSCRIPTION_EXPIRED");
    this.name = "SubscriptionExpiredError";
  }
}

export class PlanLimitExceededError extends AppError {
  constructor(message = "Limite do plano excedido") {
    super(message, 403, "PLAN_LIMIT_EXCEEDED");
    this.name = "PlanLimitExceededError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Requisição inválida") {
    super(message, 400, "BAD_REQUEST");
    this.name = "BadRequestError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Erro de validação") {
    super(message, 422, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class InvalidInputError extends AppError {
  constructor(message = "Dados de entrada inválidos") {
    super(message, 422, "INVALID_INPUT");
    this.name = "InvalidInputError";
  }
}

export class MissingRequiredFieldError extends AppError {
  constructor(field: string) {
    super(`Campo obrigatório: ${field}`, 422, "MISSING_REQUIRED_FIELD");
    this.name = "MissingRequiredFieldError";
  }
}

export class InvalidEmailError extends AppError {
  constructor(message = "Email inválido") {
    super(message, 422, "INVALID_EMAIL");
    this.name = "InvalidEmailError";
  }
}

export class InvalidCPFError extends AppError {
  constructor(message = "CPF inválido") {
    super(message, 422, "INVALID_CPF");
    this.name = "InvalidCPFError";
  }
}

export class InvalidCNPJError extends AppError {
  constructor(message = "CNPJ inválido") {
    super(message, 422, "INVALID_CNPJ");
    this.name = "InvalidCNPJError";
  }
}

export class InvalidPhoneError extends AppError {
  constructor(message = "Telefone inválido") {
    super(message, 422, "INVALID_PHONE");
    this.name = "InvalidPhoneError";
  }
}

export class WeakPasswordError extends AppError {
  constructor(
    message = "Senha fraca. Deve conter pelo menos 8 caracteres, 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial",
  ) {
    super(message, 422, "WEAK_PASSWORD");
    this.name = "WeakPasswordError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UserNotFoundError extends AppError {
  constructor(message = "Usuário não encontrado") {
    super(message, 404, "USER_NOT_FOUND");
    this.name = "UserNotFoundError";
  }
}

export class PlanNotFoundError extends AppError {
  constructor(message = "Plano não encontrado") {
    super(message, 404, "PLAN_NOT_FOUND");
    this.name = "PlanNotFoundError";
  }
}

export class SubscriptionNotFoundError extends AppError {
  constructor(message = "Assinatura não encontrada") {
    super(message, 404, "SUBSCRIPTION_NOT_FOUND");
    this.name = "SubscriptionNotFoundError";
  }
}

export class PaymentNotFoundError extends AppError {
  constructor(message = "Pagamento não encontrado") {
    super(message, 404, "PAYMENT_NOT_FOUND");
    this.name = "PaymentNotFoundError";
  }
}

export class PendingPaymentNotFoundError extends AppError {
  constructor(message = "Pagamento pendente não encontrado") {
    super(message, 404, "PENDING_PAYMENT_NOT_FOUND");
    this.name = "PendingPaymentNotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito de recursos") {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class EmailAlreadyExistsError extends AppError {
  constructor(message = "Este email já está cadastrado") {
    super(message, 409, "EMAIL_ALREADY_EXISTS");
    this.name = "EmailAlreadyExistsError";
  }
}

export class ResourceAlreadyExistsError extends AppError {
  constructor(message = "Recurso já existe") {
    super(message, 409, "RESOURCE_ALREADY_EXISTS");
    this.name = "ResourceAlreadyExistsError";
  }
}

export class DuplicateSubscriptionError extends AppError {
  constructor(message = "Já existe uma assinatura ativa") {
    super(message, 409, "DUPLICATE_SUBSCRIPTION");
    this.name = "DuplicateSubscriptionError";
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, 400, "BUSINESS_RULE_VIOLATION");
    this.name = "BusinessRuleError";
  }
}

export class AccountNotVerifiedError extends AppError {
  constructor(message = "Conta não verificada. Verifique seu email") {
    super(message, 400, "ACCOUNT_NOT_VERIFIED");
    this.name = "AccountNotVerifiedError";
  }
}

export class AccountAlreadyVerifiedError extends AppError {
  constructor(message = "Esta conta já foi verificada") {
    super(message, 400, "ACCOUNT_ALREADY_VERIFIED");
    this.name = "AccountAlreadyVerifiedError";
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(message = "Email não verificado", metadata?: Record<string, unknown>) {
    super(message, 400, "EMAIL_NOT_VERIFIED", metadata);
    this.name = "EmailNotVerifiedError";
  }
}

export class AccountLockedError extends AppError {
  constructor(message = "Conta bloqueada temporariamente") {
    super(message, 400, "ACCOUNT_LOCKED");
    this.name = "AccountLockedError";
  }
}

export class AccountDeactivatedError extends AppError {
  constructor(
    message = "Sua conta foi desativada. Entre em contato com o administrador da sua empresa para mais informações.",
  ) {
    super(message, 403, "ACCOUNT_DEACTIVATED");
    this.name = "AccountDeactivatedError";
  }
}

export class InvalidVerificationCodeError extends AppError {
  constructor(message = "Código de verificação inválido ou expirado") {
    super(message, 400, "INVALID_VERIFICATION_CODE");
    this.name = "InvalidVerificationCodeError";
  }
}

export class VerificationCodeExpiredError extends AppError {
  constructor(message = "Código de verificação expirado") {
    super(message, 400, "VERIFICATION_CODE_EXPIRED");
    this.name = "VerificationCodeExpiredError";
  }
}

export class InvalidPasswordResetCodeError extends AppError {
  constructor(message = "Código de redefinição de senha inválido ou expirado") {
    super(message, 400, "INVALID_PASSWORD_RESET_CODE");
    this.name = "InvalidPasswordResetCodeError";
  }
}

export class PasswordResetCodeExpiredError extends AppError {
  constructor(message = "Código de redefinição de senha expirado") {
    super(message, 400, "PASSWORD_RESET_CODE_EXPIRED");
    this.name = "PasswordResetCodeExpiredError";
  }
}

export class OperationNotAllowedError extends AppError {
  constructor(message = "Operação não permitida") {
    super(message, 400, "OPERATION_NOT_ALLOWED");
    this.name = "OperationNotAllowedError";
  }
}

export class QuotaExceededError extends AppError {
  constructor(message = "Cota excedida") {
    super(message, 400, "QUOTA_EXCEEDED");
    this.name = "QuotaExceededError";
  }
}

export class PaymentExpiredError extends AppError {
  constructor(message = "Pagamento expirado") {
    super(message, 400, "PAYMENT_EXPIRED");
    this.name = "PaymentExpiredError";
  }
}

export class PaymentAlreadyProcessedError extends AppError {
  constructor(message = "Pagamento já processado") {
    super(message, 400, "PAYMENT_ALREADY_PROCESSED");
    this.name = "PaymentAlreadyProcessedError";
  }
}

export class InvalidPaymentStatusError extends AppError {
  constructor(message = "Status de pagamento inválido") {
    super(message, 400, "INVALID_PAYMENT_STATUS");
    this.name = "InvalidPaymentStatusError";
  }
}

export class TooManyRequestsError extends AppError {
  constructor(
    message = "Muitas requisições. Tente novamente mais tarde",
    metadata?: Record<string, unknown>,
  ) {
    super(message, 429, "TOO_MANY_REQUESTS", metadata);
    this.name = "TooManyRequestsError";
  }
}

export class RateLimitExceededError extends AppError {
  constructor(message = "Limite de taxa excedido", metadata?: Record<string, unknown>) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", metadata);
    this.name = "RateLimitExceededError";
  }
}

export class TooManyAttemptsError extends AppError {
  constructor(
    message = "Muitas tentativas. Tente novamente mais tarde",
    metadata?: Record<string, unknown>,
  ) {
    super(message, 429, "TOO_MANY_ATTEMPTS", metadata);
    this.name = "TooManyAttemptsError";
  }
}

export class ResendLimitExceededError extends AppError {
  constructor(
    message = "Limite de reenvios excedido. Tente novamente mais tarde",
    metadata?: Record<string, unknown>,
  ) {
    super(message, 429, "RESEND_LIMIT_EXCEEDED", metadata);
    this.name = "ResendLimitExceededError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = "Erro no serviço externo", metadata?: Record<string, unknown>) {
    super(message, 502, "EXTERNAL_SERVICE_ERROR", metadata);
    this.name = "ExternalServiceError";
  }
}

export class PaymentGatewayError extends AppError {
  constructor(message = "Erro no gateway de pagamento", metadata?: Record<string, unknown>) {
    super(message, 502, "PAYMENT_GATEWAY_ERROR", metadata);
    this.name = "PaymentGatewayError";
  }
}

export class EmailSendFailedError extends AppError {
  constructor(message = "Falha ao enviar email", metadata?: Record<string, unknown>) {
    super(message, 502, "EMAIL_SEND_FAILED", metadata);
    this.name = "EmailSendFailedError";
  }
}

export class SMSSendFailedError extends AppError {
  constructor(message = "Falha ao enviar SMS", metadata?: Record<string, unknown>) {
    super(message, 502, "SMS_SEND_FAILED", metadata);
    this.name = "SMSSendFailedError";
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Erro interno do servidor", metadata?: Record<string, unknown>) {
    super(message, 500, "INTERNAL_SERVER_ERROR", metadata);
    this.name = "InternalServerError";
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Erro no banco de dados", metadata?: Record<string, unknown>) {
    super(message, 500, "DATABASE_ERROR", metadata);
    this.name = "DatabaseError";
  }
}

export class ConfigurationError extends AppError {
  constructor(message = "Erro de configuração", metadata?: Record<string, unknown>) {
    super(message, 500, "CONFIGURATION_ERROR", metadata);
    this.name = "ConfigurationError";
  }
}

export class WebhookValidationError extends AppError {
  constructor(message = "Falha na validação do webhook") {
    super(message, 400, "WEBHOOK_VALIDATION_ERROR");
    this.name = "WebhookValidationError";
  }
}

export class InvalidWebhookSignatureError extends AppError {
  constructor(message = "Assinatura do webhook inválida") {
    super(message, 401, "INVALID_WEBHOOK_SIGNATURE");
    this.name = "InvalidWebhookSignatureError";
  }
}
