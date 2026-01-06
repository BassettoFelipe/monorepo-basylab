import { beforeEach, describe, expect, it, mock } from "bun:test";
import { PaymentAlreadyProcessedError } from "@/errors";
import type { IPendingPaymentRepository } from "@/repositories/contracts/pending-payment.repository";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import type { IUserCacheService } from "@/services/contracts/user-cache-service.interface";
import type { IPaymentGateway } from "@/services/payment/contracts/payment-gateway.interface";
import type { PendingPayment } from "@/types/pending-payment";
import type { Plan } from "@/types/plan";
import type { User } from "@/types/user";
import { ProcessPaymentWebhookUseCase } from "./process-payment-webhook.use-case";

describe("ProcessPaymentWebhookUseCase", () => {
  let pendingPaymentRepository: IPendingPaymentRepository;
  let userRepository: IUserRepository;
  let subscriptionRepository: ISubscriptionRepository;
  let planRepository: IPlanRepository;
  let userCacheService: IUserCacheService;
  let paymentGateway: IPaymentGateway;
  let processPaymentWebhookUseCase: ProcessPaymentWebhookUseCase;

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

  const mockPendingPayment: PendingPayment = {
    id: "pending-payment-123",
    email: "newuser@example.com",
    name: "New User",
    password: "$2b$10$hashedPassword",
    planId: "plan-123",
    pagarmeOrderId: null,
    pagarmeChargeId: null,
    processedWebhookId: null,
    status: "pending",
    expiresAt: new Date(Date.now() + 1800000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExistingUser: User = {
    id: "existing-user-123",
    name: "Existing User",
    email: "existing@example.com",
    password: "$2b$10$hashedPassword",
    role: "owner",
    phone: null,
    avatarUrl: null,
    companyId: "company-123",
    createdBy: null,
    isActive: true,
    isEmailVerified: true,
    verificationSecret: null,
    verificationExpiresAt: null,
    verificationAttempts: 0,
    verificationLastAttemptAt: null,
    verificationResendCount: 0,
    verificationLastResendAt: null,
    passwordResetSecret: null,
    passwordResetExpiresAt: null,
    passwordResetResendCount: 0,
    passwordResetCooldownEndsAt: null,
    passwordResetResendBlocked: false,
    passwordResetResendBlockedUntil: null,
    passwordResetAttempts: 0,
    passwordResetLastAttemptAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    pendingPaymentRepository = {
      findById: mock(() => Promise.resolve({ ...mockPendingPayment })),
      update: mock(() => Promise.resolve()),
      processPaymentWithTransaction: mock(() =>
        Promise.resolve({
          userId: "new-user-123",
          subscription: { id: "subscription-123" },
        }),
      ),
    } as unknown as IPendingPaymentRepository;

    userRepository = {
      findByEmail: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({ id: "new-user-123" } as User)),
    } as unknown as IUserRepository;

    subscriptionRepository = {
      create: mock(() => Promise.resolve()),
    } as unknown as ISubscriptionRepository;

    planRepository = {
      findById: mock(() => Promise.resolve({ ...mockPlan })),
    } as unknown as IPlanRepository;

    userCacheService = {
      invalidate: mock(() => Promise.resolve()),
    } as unknown as IUserCacheService;

    paymentGateway = {
      getOrder: mock(() =>
        Promise.resolve({
          id: "order-123",
          status: "paid",
          externalReference: "pending-payment-123",
          customerEmail: "newuser@example.com",
        }),
      ),
    } as unknown as IPaymentGateway;

    processPaymentWebhookUseCase = new ProcessPaymentWebhookUseCase(
      pendingPaymentRepository,
      userRepository,
      subscriptionRepository,
      planRepository,
      userCacheService,
      paymentGateway,
    );
  });

  describe("Eventos de webhook", () => {
    it("deve processar evento order.paid", async () => {
      const result = await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Webhook processed successfully");
      expect(paymentGateway.getOrder).toHaveBeenCalledWith("order-123");
    });

    it("deve processar evento charge.paid", async () => {
      const result = await processPaymentWebhookUseCase.execute({
        type: "charge.paid",
        data: { id: "order-123" },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Webhook processed successfully");
      expect(paymentGateway.getOrder).toHaveBeenCalledWith("order-123");
    });

    it("deve ignorar outros tipos de eventos", async () => {
      const result = await processPaymentWebhookUseCase.execute({
        type: "order.canceled",
        data: { id: "order-123" },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Event type not processed");
      expect(paymentGateway.getOrder).not.toHaveBeenCalled();
    });
  });

  describe("Criação de novo usuário", () => {
    it("deve processar pagamento com transação quando email não existe", async () => {
      const result = await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      expect(result.success).toBe(true);
      expect(userRepository.findByEmail).toHaveBeenCalledWith("newuser@example.com");
      expect(pendingPaymentRepository.processPaymentWithTransaction).toHaveBeenCalled();
      expect(userCacheService.invalidate).toHaveBeenCalledWith("new-user-123");
    });

    it("deve passar dados corretos para transaction incluindo novo usuário", async () => {
      await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      const transactionCall = (pendingPaymentRepository.processPaymentWithTransaction as any).mock
        .calls[0][0];

      expect(transactionCall.pendingPaymentId).toBe("pending-payment-123");
      expect(transactionCall.webhookId).toBe("order-123");
      expect(transactionCall.userId).toBeUndefined();
      expect(transactionCall.newUser).toEqual({
        email: "newuser@example.com",
        password: "$2b$10$hashedPassword",
        name: "New User",
      });
      expect(transactionCall.subscription.planId).toBe("plan-123");
      expect(transactionCall.subscription.status).toBe("active");
    });
  });

  describe("Usuário existente", () => {
    it("deve usar userId existente na transação", async () => {
      const existingPendingPayment = {
        ...mockPendingPayment,
        email: "existing@example.com",
      };

      pendingPaymentRepository.findById = mock(() => Promise.resolve(existingPendingPayment));
      userRepository.findByEmail = mock(() => Promise.resolve(mockExistingUser));
      pendingPaymentRepository.processPaymentWithTransaction = mock(() =>
        Promise.resolve({
          userId: "existing-user-123",
          subscription: { id: "subscription-123" },
        }),
      );

      await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith("existing@example.com");

      const transactionCall = (pendingPaymentRepository.processPaymentWithTransaction as any).mock
        .calls[0][0];

      expect(transactionCall.userId).toBe("existing-user-123");
      expect(transactionCall.newUser).toBeUndefined();

      expect(userCacheService.invalidate).toHaveBeenCalledWith("existing-user-123");
    });
  });

  describe("Validações de erro", () => {
    it("deve retornar sucesso false se pendingPayment não existir", async () => {
      pendingPaymentRepository.findById = mock(() => Promise.resolve(null));

      const result = await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Pagamento pendente não encontrado");
    });

    it("deve retornar sucesso true (idempotente) se pagamento já foi processado", async () => {
      const processedPayment = {
        ...mockPendingPayment,
        status: "paid" as const,
      };

      pendingPaymentRepository.findById = mock(() => Promise.resolve(processedPayment));

      pendingPaymentRepository.processPaymentWithTransaction = mock(() => {
        throw new PaymentAlreadyProcessedError();
      });

      const result = await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("idempotent");
    });

    it("deve retornar sucesso false se plano não existir", async () => {
      planRepository.findById = mock(() => Promise.resolve(null));

      const result = await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Plano não encontrado");
    });

    it("deve lidar com erros de gateway de pagamento", async () => {
      paymentGateway.getOrder = mock(() => Promise.reject(new Error("Gateway timeout")));

      const result = await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Gateway timeout");
    });

    it("deve lidar com erros desconhecidos", async () => {
      paymentGateway.getOrder = mock(() => Promise.reject("Unknown error"));

      const result = await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Unknown error");
    });
  });

  describe("Status do pedido", () => {
    it("deve processar apenas pedidos com status paid", async () => {
      paymentGateway.getOrder = mock(() =>
        Promise.resolve({
          id: "order-123",
          status: "paid" as const,
          externalReference: "pending-payment-123",
          customerEmail: "newuser@example.com",
        }),
      );

      await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      expect(pendingPaymentRepository.processPaymentWithTransaction).toHaveBeenCalled();
    });

    it("deve ignorar pedidos com status diferente de paid", async () => {
      paymentGateway.getOrder = mock(() =>
        Promise.resolve({
          id: "order-123",
          status: "pending" as const,
          externalReference: "pending-payment-123",
          customerEmail: "newuser@example.com",
        }),
      );

      await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      expect(pendingPaymentRepository.processPaymentWithTransaction).not.toHaveBeenCalled();
    });

    it("deve ignorar pedidos sem externalReference", async () => {
      paymentGateway.getOrder = mock(() =>
        Promise.resolve({
          id: "order-123",
          status: "paid" as const,
          externalReference: null,
          customerEmail: null,
        }),
      );

      await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      expect(pendingPaymentRepository.findById).not.toHaveBeenCalled();
      expect(pendingPaymentRepository.processPaymentWithTransaction).not.toHaveBeenCalled();
    });
  });

  describe("Invalidação de cache", () => {
    it("deve invalidar cache do usuário após criar subscription", async () => {
      await processPaymentWebhookUseCase.execute({
        type: "order.paid",
        data: { id: "order-123" },
      });

      expect(userCacheService.invalidate).toHaveBeenCalledWith("new-user-123");
      expect(userCacheService.invalidate).toHaveBeenCalledTimes(1);
    });
  });
});
