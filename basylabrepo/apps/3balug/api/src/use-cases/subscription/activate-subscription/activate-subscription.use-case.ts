import {
  DuplicateSubscriptionError,
  EmailNotVerifiedError,
  InvalidInputError,
  OperationNotAllowedError,
  PaymentGatewayError,
  PlanNotFoundError,
  SubscriptionNotFoundError,
  UserNotFoundError,
} from "@/errors";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import type { IUserCacheService } from "@/services/contracts/user-cache-service.interface";
import { paymentGateway } from "@/services/payment";

type ActivateSubscriptionInput = {
  userId: string;
  subscriptionId: string;
  planId: string;
  cardToken: string;
  payerDocument: string;
  installments?: number;
};

type ActivateSubscriptionOutput = {
  success: boolean;
  message: string;
  subscriptionId: string;
  status: string;
};

type ExtendedStatus = "paid" | "pending" | "failed" | "canceled" | "refunded" | "processing";

export class ActivateSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly planRepository: IPlanRepository,
    private readonly userRepository: IUserRepository,
    private readonly userCacheService: IUserCacheService,
  ) {}

  async execute(input: ActivateSubscriptionInput): Promise<ActivateSubscriptionOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    if (!user.isEmailVerified) {
      throw new EmailNotVerifiedError();
    }

    const subscription = await this.subscriptionRepository.findById(input.subscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFoundError();
    }

    if (subscription.userId !== user.id) {
      throw new OperationNotAllowedError("Assinatura não pertence ao usuário");
    }

    if (subscription.status === "active") {
      throw new DuplicateSubscriptionError("Você já possui uma assinatura ativa");
    }

    if (subscription.status !== "pending") {
      throw new OperationNotAllowedError("Esta assinatura não pode ser ativada");
    }

    const plan = await this.planRepository.findById(input.planId);
    if (!plan) {
      throw new PlanNotFoundError();
    }

    const installments = input.installments || 1;

    if (installments < 1 || installments > 12) {
      throw new InvalidInputError("Número de parcelas inválido (1-12)");
    }

    try {
      const order = await paymentGateway.createOrder({
        title: `Plano ${plan.name} - CRM Imobiliário`,
        quantity: 1,
        unitPrice: plan.price,
        customerName: user.name,
        customerEmail: user.email,
        customerDocument: input.payerDocument,
        externalReference: subscription.id,
        cardToken: input.cardToken,
        installments,
      });

      if (order.status === "paid") {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.durationDays);

        await this.subscriptionRepository.update(subscription.id, {
          status: "active",
          startDate,
          endDate,
        });

        // Invalidar cache do usuário após ativar subscription
        await this.userCacheService.invalidate(user.id);

        return {
          success: true,
          message: "Assinatura ativada com sucesso!",
          subscriptionId: subscription.id,
          status: "active",
        };
      }

      const extendedStatus = order.status as ExtendedStatus;
      if (extendedStatus === "pending" || extendedStatus === "processing") {
        return {
          success: true,
          message: "Pagamento em processamento. Você receberá um email quando for aprovado.",
          subscriptionId: subscription.id,
          status: "processing",
        };
      }

      return {
        success: false,
        message:
          "Não foi possível processar seu pagamento. Por favor, verifique os dados do cartão e tente novamente.",
        subscriptionId: subscription.id,
        status: "failed",
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new PaymentGatewayError(
          "Não foi possível processar seu pagamento no momento. Por favor, verifique os dados e tente novamente.",
        );
      }

      throw new PaymentGatewayError(
        "Não foi possível processar seu pagamento no momento. Por favor, tente novamente.",
      );
    }
  }
}
