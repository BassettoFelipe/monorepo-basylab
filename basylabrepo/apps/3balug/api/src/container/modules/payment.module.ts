import { paymentGateway } from "@/services/payment";
import { CreatePendingPaymentUseCase } from "@/use-cases/payment/create-pending-payment/create-pending-payment.use-case";
import { GetPendingPaymentUseCase } from "@/use-cases/payment/get-pending-payment/get-pending-payment.use-case";
import { ProcessCreditCardPaymentUseCase } from "@/use-cases/payment/process-credit-card-payment/process-credit-card-payment.use-case";
import { ProcessPaymentWebhookUseCase } from "@/use-cases/payment/process-payment-webhook/process-payment-webhook.use-case";
import {
  pendingPaymentRepository,
  planRepository,
  subscriptionRepository,
  userRepository,
} from "./repositories";
import { userCacheService } from "./services";

export function createPaymentUseCases() {
  return {
    createPendingPayment: new CreatePendingPaymentUseCase(
      userRepository,
      planRepository,
      pendingPaymentRepository,
    ),
    getPendingPayment: new GetPendingPaymentUseCase(pendingPaymentRepository, planRepository),
    processCardPayment: new ProcessCreditCardPaymentUseCase(
      pendingPaymentRepository,
      planRepository,
      userRepository,
      subscriptionRepository,
      paymentGateway,
    ),
    processWebhook: new ProcessPaymentWebhookUseCase(
      pendingPaymentRepository,
      userRepository,
      subscriptionRepository,
      planRepository,
      userCacheService,
      paymentGateway,
    ),
  };
}
