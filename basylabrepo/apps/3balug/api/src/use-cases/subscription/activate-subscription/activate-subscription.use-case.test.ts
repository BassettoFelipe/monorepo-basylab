import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import {
  DuplicateSubscriptionError,
  EmailNotVerifiedError,
  InvalidInputError,
  OperationNotAllowedError,
  PaymentGatewayError,
  PlanNotFoundError,
  SubscriptionNotFoundError,
} from "@basylab/core/errors";
import type { IUserCacheService } from "@/services/cache";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import type { IPaymentGateway } from "@/services/payment/contracts/payment-gateway.interface";
import type { Plan } from "@/types/plan";
import type { Subscription } from "@/types/subscription";
import type { User } from "@/types/user";
import { ActivateSubscriptionUseCase } from "./activate-subscription.use-case";

// Mock payment gateway
const mockCreateOrder = mock(() =>
  Promise.resolve({
    id: "order-123",
    status: "paid" as const,
    charges: [{ id: "charge-123", status: "paid" as const }],
  }),
);

const mockPaymentGateway: IPaymentGateway = {
  createOrder: mockCreateOrder,
  getOrder: mock(() =>
    Promise.resolve({
      id: "order-123",
      status: "paid" as const,
      externalReference: "test-ref",
      customerEmail: "test@example.com",
    }),
  ),
  processWebhook: mock(() =>
    Promise.resolve({
      success: true,
      orderId: "order-123",
      status: "paid" as const,
    }),
  ),
  validateWebhookSignature: () => true,
};

mock.module("@/services/payment", () => ({
  paymentGateway: mockPaymentGateway,
}));

afterAll(() => {
  mock.restore();
});

describe("ActivateSubscriptionUseCase", () => {
  let subscriptionRepository: ISubscriptionRepository;
  let planRepository: IPlanRepository;
  let userRepository: IUserRepository;
  let userCacheService: IUserCacheService;
  let activateSubscriptionUseCase: ActivateSubscriptionUseCase;

  const mockUser: User = {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    password: "$2b$10$hashedPassword",
    isEmailVerified: true,
    companyId: "company-123",
    role: "owner",
    isActive: true,
    phone: null,
    avatarUrl: null,
    createdBy: null,
    verificationSecret: null,
    verificationExpiresAt: null,
    verificationAttempts: 0,
    verificationLastAttemptAt: null,
    passwordResetSecret: null,
    passwordResetExpiresAt: null,
    passwordResetAttempts: 0,
    passwordResetLastAttemptAt: null,
    passwordResetResendCount: 0,
    passwordResetCooldownEndsAt: null,
    passwordResetResendBlocked: false,
    passwordResetResendBlockedUntil: null,
    verificationResendCount: 0,
    verificationLastResendAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPlan: Plan = {
    id: "plan-123",
    name: "Plano Premium",
    slug: "plano-premium",
    description: "Plano completo",
    price: 9900,
    durationDays: 30,
    maxUsers: 10,
    maxManagers: 5,
    maxSerasaQueries: 100,
    allowsLateCharges: 1,
    features: ["feature1"],
    pagarmePlanId: "plan_pagarme_123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubscription: Subscription = {
    id: "subscription-123",
    userId: "user-123",
    planId: "plan-123",
    status: "pending",
    startDate: new Date(),
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockCreateOrder.mockClear();
    mockCreateOrder.mockResolvedValue({
      id: "order-123",
      status: "paid",
      charges: [{ id: "charge-123", status: "paid" }],
    });

    subscriptionRepository = {
      findById: mock(() => Promise.resolve({ ...mockSubscription })),
      update: mock(() => Promise.resolve()),
    } as unknown as ISubscriptionRepository;

    planRepository = {
      findById: mock(() => Promise.resolve({ ...mockPlan })),
    } as unknown as IPlanRepository;

    userRepository = {
      findById: mock(() => Promise.resolve({ ...mockUser })),
    } as unknown as IUserRepository;

    userCacheService = {
      invalidate: mock(() => Promise.resolve()),
    } as unknown as IUserCacheService;

    activateSubscriptionUseCase = new ActivateSubscriptionUseCase(
      subscriptionRepository,
      planRepository,
      userRepository,
      userCacheService,
    );
  });

  describe("Ativação com pagamento aprovado", () => {
    it("deve ativar subscription quando pagamento aprovado", async () => {
      const result = await activateSubscriptionUseCase.execute({
        userId: mockUser.id,
        subscriptionId: "subscription-123",
        planId: "plan-123",
        cardToken: "tok_test123",
        payerDocument: "12345678900",
        installments: 1,
      });

      expect(result).toEqual({
        success: true,
        message: "Assinatura ativada com sucesso!",
        subscriptionId: "subscription-123",
        status: "active",
      });

      expect(mockCreateOrder).toHaveBeenCalledWith({
        title: "Plano Plano Premium - CRM Imobiliário",
        quantity: 1,
        unitPrice: 9900,
        customerName: "Test User",
        customerEmail: "test@example.com",
        customerDocument: "12345678900",
        externalReference: "subscription-123",
        cardToken: "tok_test123",
        installments: 1,
      });

      expect(subscriptionRepository.update).toHaveBeenCalledWith("subscription-123", {
        status: "active",
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });

      expect(userCacheService.invalidate).toHaveBeenCalledWith("user-123");
    });

    it("deve calcular endDate corretamente baseado no plano", async () => {
      await activateSubscriptionUseCase.execute({
        userId: mockUser.id,
        subscriptionId: "subscription-123",
        planId: "plan-123",
        cardToken: "tok_test123",
        payerDocument: "12345678900",
        installments: 1,
      });

      const updateCall = (subscriptionRepository.update as any).mock.calls[0][1];
      const startDate = updateCall.startDate as Date;
      const endDate = updateCall.endDate as Date;

      const expectedEndDate = new Date(startDate);
      expectedEndDate.setDate(expectedEndDate.getDate() + 30); // plan.durationDays

      expect(endDate.getTime()).toBeCloseTo(expectedEndDate.getTime(), -2);
    });

    it("deve usar 1 parcela como padrão se não especificado", async () => {
      await activateSubscriptionUseCase.execute({
        userId: mockUser.id,
        subscriptionId: "subscription-123",
        planId: "plan-123",
        cardToken: "tok_test123",
        payerDocument: "12345678900",
      });

      expect(mockCreateOrder).toHaveBeenCalledWith(expect.objectContaining({ installments: 1 }));
    });
  });

  describe("Pagamento em processamento", () => {
    it("deve retornar status processing se pagamento pendente", async () => {
      mockCreateOrder.mockResolvedValue({
        id: "order-123",
        status: "pending" as any,
        charges: [{ id: "charge-123", status: "pending" as any }],
      });

      const result = await activateSubscriptionUseCase.execute({
        userId: mockUser.id,
        subscriptionId: "subscription-123",
        planId: "plan-123",
        cardToken: "tok_test123",
        payerDocument: "12345678900",
      });

      expect(result).toEqual({
        success: true,
        message: "Pagamento em processamento. Você receberá um email quando for aprovado.",
        subscriptionId: "subscription-123",
        status: "processing",
      });

      expect(subscriptionRepository.update).not.toHaveBeenCalled();
    });

    it("deve retornar status processing se em processamento", async () => {
      mockCreateOrder.mockResolvedValue({
        id: "order-123",
        status: "processing" as any,
        charges: [{ id: "charge-123", status: "processing" as any }],
      });

      const result = await activateSubscriptionUseCase.execute({
        userId: mockUser.id,
        subscriptionId: "subscription-123",
        planId: "plan-123",
        cardToken: "tok_test123",
        payerDocument: "12345678900",
      });

      expect(result.status).toBe("processing");
    });
  });

  describe("Pagamento rejeitado", () => {
    it("deve retornar status failed se pagamento rejeitado", async () => {
      mockCreateOrder.mockResolvedValue({
        id: "order-123",
        status: "failed" as any,
        charges: [{ id: "charge-123", status: "failed" as any }],
      });

      const result = await activateSubscriptionUseCase.execute({
        userId: mockUser.id,
        subscriptionId: "subscription-123",
        planId: "plan-123",
        cardToken: "tok_test123",
        payerDocument: "12345678900",
      });

      expect(result).toEqual({
        success: false,
        message:
          "Não foi possível processar seu pagamento. Por favor, verifique os dados do cartão e tente novamente.",
        subscriptionId: "subscription-123",
        status: "failed",
      });
    });
  });

  describe("Validações de usuário", () => {
    it("deve lançar erro se email não verificado", async () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      userRepository.findById = mock(() => Promise.resolve(unverifiedUser));

      await expect(
        activateSubscriptionUseCase.execute({
          userId: unverifiedUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow(EmailNotVerifiedError);
    });
  });

  describe("Validações de subscription", () => {
    it("deve lançar erro se subscription não existir", async () => {
      subscriptionRepository.findById = mock(() => Promise.resolve(null));

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "non-existent",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow(SubscriptionNotFoundError);
    });

    it("deve lançar erro se subscription não pertence ao usuário", async () => {
      const otherUserSubscription = {
        ...mockSubscription,
        userId: "other-user",
      };
      subscriptionRepository.findById = mock(() => Promise.resolve(otherUserSubscription));

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow(OperationNotAllowedError);

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow("Assinatura não pertence ao usuário");
    });

    it("deve lançar erro se subscription já está ativa", async () => {
      const activeSubscription = {
        ...mockSubscription,
        status: "active" as const,
      };
      subscriptionRepository.findById = mock(() => Promise.resolve(activeSubscription));

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow(DuplicateSubscriptionError);

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow("Você já possui uma assinatura ativa");
    });

    it("deve lançar erro se subscription não pode ser ativada", async () => {
      const canceledSubscription = {
        ...mockSubscription,
        status: "canceled" as const,
      };
      subscriptionRepository.findById = mock(() => Promise.resolve(canceledSubscription));

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow(OperationNotAllowedError);

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow("Esta assinatura não pode ser ativada");
    });
  });

  describe("Validações de plano", () => {
    it("deve lançar erro se plano não existir", async () => {
      planRepository.findById = mock(() => Promise.resolve(null));

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "non-existent",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow(PlanNotFoundError);
    });
  });

  describe("Validações de parcelas", () => {
    it("deve lançar erro se parcelas < 1", async () => {
      // Testar com valor negativo (0 é convertido para 1 pelo código)
      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
          installments: -1,
        }),
      ).rejects.toThrow(InvalidInputError);

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
          installments: -1,
        }),
      ).rejects.toThrow("Número de parcelas inválido (1-12)");
    });

    it("deve lançar erro se parcelas > 12", async () => {
      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
          installments: 13,
        }),
      ).rejects.toThrow(InvalidInputError);
    });

    it("deve aceitar 12 parcelas", async () => {
      await activateSubscriptionUseCase.execute({
        userId: mockUser.id,
        subscriptionId: "subscription-123",
        planId: "plan-123",
        cardToken: "tok_test123",
        payerDocument: "12345678900",
        installments: 12,
      });

      expect(mockCreateOrder).toHaveBeenCalledWith(expect.objectContaining({ installments: 12 }));
    });
  });

  describe("Erros do gateway", () => {
    it("deve lançar PaymentGatewayError se createOrder falhar", async () => {
      mockCreateOrder.mockRejectedValue(new Error("Gateway error"));

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow(PaymentGatewayError);

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow(
        "Não foi possível processar seu pagamento no momento. Por favor, verifique os dados e tente novamente.",
      );
    });

    it("deve lançar erro genérico para erros desconhecidos", async () => {
      mockCreateOrder.mockRejectedValue("Unknown error");

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow(PaymentGatewayError);

      await expect(
        activateSubscriptionUseCase.execute({
          userId: mockUser.id,
          subscriptionId: "subscription-123",
          planId: "plan-123",
          cardToken: "tok_test123",
          payerDocument: "12345678900",
        }),
      ).rejects.toThrow(
        "Não foi possível processar seu pagamento no momento. Por favor, tente novamente.",
      );
    });
  });
});
