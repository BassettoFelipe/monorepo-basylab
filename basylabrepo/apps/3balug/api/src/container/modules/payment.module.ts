import { paymentGateway } from "@/services/payment";
import { CreatePendingPaymentUseCase } from "@/use-cases/payment/create-pending-payment/create-pending-payment.use-case";
import { GetPendingPaymentUseCase } from "@/use-cases/payment/get-pending-payment/get-pending-payment.use-case";
import { ProcessCreditCardPaymentUseCase } from "@/use-cases/payment/process-credit-card-payment/process-credit-card-payment.use-case";
import { ProcessPaymentWebhookUseCase } from "@/use-cases/payment/process-payment-webhook/process-payment-webhook.use-case";
import { repositories } from "./repositories";
import { services } from "./services";

export function createPaymentUseCases() {
  return {
    createPendingPayment: new CreatePendingPaymentUseCase(
      repositories.userRepository,
      repositories.planRepository,
      repositories.pendingPaymentRepository,
    ),
    getPendingPayment: new GetPendingPaymentUseCase(
      repositories.pendingPaymentRepository,
      repositories.planRepository,
    ),
    processCardPayment: new ProcessCreditCardPaymentUseCase(
      repositories.pendingPaymentRepository,
      repositories.planRepository,
      repositories.userRepository,
      repositories.subscriptionRepository,
      paymentGateway,
    ),
    processWebhook: new ProcessPaymentWebhookUseCase(
      repositories.pendingPaymentRepository,
      repositories.userRepository,
      repositories.subscriptionRepository,
      repositories.planRepository,
      services.userCacheService,
      paymentGateway,
    ),
  };
}
