import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
  InvalidInputError,
  PaymentAlreadyProcessedError,
  PaymentExpiredError,
  PaymentGatewayError,
  PendingPaymentNotFoundError,
  PlanNotFoundError,
} from "@basylab/core/errors";
import type { IPendingPaymentRepository } from "@/repositories/contracts/pending-payment.repository";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import type { IPaymentGateway } from "@/services/payment/contracts/payment-gateway.interface";
import type { PendingPayment } from "@/types/pending-payment";
import type { Plan } from "@/types/plan";
import type { User } from "@/types/user";
import { ProcessCreditCardPaymentUseCase } from "./process-credit-card-payment.use-case";

describe("ProcessCreditCardPaymentUseCase", () => {
  let pendingPaymentRepository: IPendingPaymentRepository;
  let planRepository: IPlanRepository;
  let userRepository: IUserRepository;
  let subscriptionRepository: ISubscriptionRepository;
  let paymentGateway: IPaymentGateway;
  let processCreditCardPaymentUseCase: ProcessCreditCardPaymentUseCase;

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
    id: "pending-123",
    email: "newuser@example.com",
    name: "New User",
    password: "$2b$10$hashedPassword",
    planId: "plan-123",
    pagarmeOrderId: null,
    pagarmeChargeId: null,
    processedWebhookId: null,
    status: "pending",
    expiresAt: new Date(Date.now() + 1800000), // 30 min from now
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    pendingPaymentRepository = {
      findById: mock(() => Promise.resolve({ ...mockPendingPayment })),
      update: mock(() => Promise.resolve()),
    } as unknown as IPendingPaymentRepository;

    planRepository = {
      findById: mock(() => Promise.resolve({ ...mockPlan })),
    } as unknown as IPlanRepository;

    userRepository = {
      findByEmail: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({ id: "new-user-123" } as User)),
    } as unknown as IUserRepository;

    subscriptionRepository = {
      create: mock(() => Promise.resolve()),
    } as unknown as ISubscriptionRepository;

    paymentGateway = {
      createOrder: mock(() =>
        Promise.resolve({
          id: "order-123",
          status: "paid",
          charges: [{ id: "charge-123" }],
        }),
      ),
    } as unknown as IPaymentGateway;

    processCreditCardPaymentUseCase = new ProcessCreditCardPaymentUseCase(
      pendingPaymentRepository,
      planRepository,
      userRepository,
      subscriptionRepository,
      paymentGateway,
    );
  });

  describe("Pagamento aprovado imediatamente", () => {
    it("deve criar usuário e subscription quando pagamento aprovado", async () => {
      const result = await processCreditCardPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
        cardToken: "tok_test123",
        installments: 1,
      });

      expect(result).toEqual({
        orderId: "order-123",
        status: "paid",
        userId: "new-user-123",
      });

      expect(paymentGateway.createOrder).toHaveBeenCalledWith({
        title: "Plano Plano Premium - CRM Imobiliário",
        quantity: 1,
        unitPrice: 9900,
        customerName: "New User",
        customerEmail: "newuser@example.com",
        customerDocument: "",
        externalReference: "pending-123",
        cardToken: "tok_test123",
        installments: 1,
      });

      expect(userRepository.create).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "$2b$10$hashedPassword",
        name: "New User",
      });

      expect(subscriptionRepository.create).toHaveBeenCalledWith({
        userId: "new-user-123",
        planId: "plan-123",
        status: "active",
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });

      expect(pendingPaymentRepository.update).toHaveBeenCalledWith("pending-123", {
        status: "paid",
      });
    });

    it("deve usar usuário existente se email já cadastrado", async () => {
      const existingUser = { id: "existing-user-123" } as User;
      userRepository.findByEmail = mock(() => Promise.resolve(existingUser));

      const result = await processCreditCardPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
        cardToken: "tok_test123",
        installments: 1,
      });

      expect(result.userId).toBe("existing-user-123");
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(subscriptionRepository.create).toHaveBeenCalledWith({
        userId: "existing-user-123",
        planId: "plan-123",
        status: "active",
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });
    });

    it("deve atualizar pagarmeOrderId e pagarmeChargeId", async () => {
      await processCreditCardPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
        cardToken: "tok_test123",
        installments: 1,
      });

      expect(pendingPaymentRepository.update).toHaveBeenCalledWith("pending-123", {
        pagarmeOrderId: "order-123",
        pagarmeChargeId: "charge-123",
      });
    });
  });

  describe("Pagamento em processamento", () => {
    it("deve retornar status processing para pedido pendente", async () => {
      paymentGateway.createOrder = mock(() =>
        Promise.resolve({
          id: "order-123",
          status: "pending" as const,
          charges: [{ id: "charge-123", status: "pending" as const }],
        }),
      );

      const result = await processCreditCardPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
        cardToken: "tok_test123",
        installments: 1,
      });

      expect(result).toEqual({
        orderId: "order-123",
        status: "pending",
      });

      expect(result.userId).toBeUndefined();
      expect(subscriptionRepository.create).not.toHaveBeenCalled();
    });

    it("deve retornar status processing para pedido em processamento", async () => {
      paymentGateway.createOrder = mock(() =>
        Promise.resolve({
          id: "order-123",
          status: "pending" as const,
          charges: [{ id: "charge-123", status: "pending" as const }],
        }),
      );

      const result = await processCreditCardPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
        cardToken: "tok_test123",
        installments: 1,
      });

      expect(result.status).toBe("pending");
    });
  });

  describe("Pagamento rejeitado", () => {
    it("deve retornar status failed para pedido rejeitado", async () => {
      paymentGateway.createOrder = mock(() =>
        Promise.resolve({
          id: "order-123",
          status: "failed" as const,
          charges: [{ id: "charge-123", status: "failed" as const }],
        }),
      );

      const result = await processCreditCardPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
        cardToken: "tok_test123",
        installments: 1,
      });

      expect(result).toEqual({
        orderId: "order-123",
        status: "failed",
      });

      expect(subscriptionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("Validações de erro", () => {
    it("deve lançar erro se pendingPayment não existir", async () => {
      pendingPaymentRepository.findById = mock(() => Promise.resolve(null));

      await expect(
        processCreditCardPaymentUseCase.execute({
          pendingPaymentId: "non-existent",
          cardToken: "tok_test123",
          installments: 1,
        }),
      ).rejects.toThrow(PendingPaymentNotFoundError);
    });

    it("deve lançar erro se pagamento expirou", async () => {
      const expiredPayment = {
        ...mockPendingPayment,
        expiresAt: new Date(Date.now() - 1000), // 1s ago
      };

      pendingPaymentRepository.findById = mock(() => Promise.resolve(expiredPayment));

      await expect(
        processCreditCardPaymentUseCase.execute({
          pendingPaymentId: "pending-123",
          cardToken: "tok_test123",
          installments: 1,
        }),
      ).rejects.toThrow(PaymentExpiredError);

      expect(pendingPaymentRepository.update).toHaveBeenCalledWith("pending-123", {
        status: "expired",
      });
    });

    it("deve lançar erro se pagamento já foi processado", async () => {
      const paidPayment = { ...mockPendingPayment, status: "paid" as const };
      pendingPaymentRepository.findById = mock(() => Promise.resolve(paidPayment));

      await expect(
        processCreditCardPaymentUseCase.execute({
          pendingPaymentId: "pending-123",
          cardToken: "tok_test123",
          installments: 1,
        }),
      ).rejects.toThrow(PaymentAlreadyProcessedError);
    });

    it("deve lançar erro se plano não existir", async () => {
      planRepository.findById = mock(() => Promise.resolve(null));

      await expect(
        processCreditCardPaymentUseCase.execute({
          pendingPaymentId: "pending-123",
          cardToken: "tok_test123",
          installments: 1,
        }),
      ).rejects.toThrow(PlanNotFoundError);
    });

    it("deve lançar erro se número de parcelas inválido (<1)", async () => {
      await expect(
        processCreditCardPaymentUseCase.execute({
          pendingPaymentId: "pending-123",
          cardToken: "tok_test123",
          installments: 0,
        }),
      ).rejects.toThrow(InvalidInputError);
    });

    it("deve lançar erro se número de parcelas inválido (>12)", async () => {
      await expect(
        processCreditCardPaymentUseCase.execute({
          pendingPaymentId: "pending-123",
          cardToken: "tok_test123",
          installments: 13,
        }),
      ).rejects.toThrow(InvalidInputError);

      await expect(
        processCreditCardPaymentUseCase.execute({
          pendingPaymentId: "pending-123",
          cardToken: "tok_test123",
          installments: 13,
        }),
      ).rejects.toThrow("Número de parcelas inválido (1-12)");
    });
  });

  describe("Erros do gateway", () => {
    it("deve marcar como failed e lançar erro se gateway falhar", async () => {
      paymentGateway.createOrder = mock(() => Promise.reject(new Error("Gateway error")));

      await expect(
        processCreditCardPaymentUseCase.execute({
          pendingPaymentId: "pending-123",
          cardToken: "tok_test123",
          installments: 1,
        }),
      ).rejects.toThrow(PaymentGatewayError);

      expect(pendingPaymentRepository.update).toHaveBeenCalledWith("pending-123", {
        status: "failed",
      });
    });

    it("deve lançar erro genérico se erro desconhecido", async () => {
      paymentGateway.createOrder = mock(() => Promise.reject("Unknown error"));

      await expect(
        processCreditCardPaymentUseCase.execute({
          pendingPaymentId: "pending-123",
          cardToken: "tok_test123",
          installments: 1,
        }),
      ).rejects.toThrow(PaymentGatewayError);

      await expect(
        processCreditCardPaymentUseCase.execute({
          pendingPaymentId: "pending-123",
          cardToken: "tok_test123",
          installments: 1,
        }),
      ).rejects.toThrow(
        "Não foi possível processar seu pagamento no momento. Por favor, tente novamente.",
      );
    });
  });

  describe("Diferentes números de parcelas", () => {
    it("deve processar pagamento à vista (1 parcela)", async () => {
      await processCreditCardPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
        cardToken: "tok_test123",
        installments: 1,
      });

      expect(paymentGateway.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ installments: 1 }),
      );
    });

    it("deve processar pagamento parcelado (12x)", async () => {
      await processCreditCardPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
        cardToken: "tok_test123",
        installments: 12,
      });

      expect(paymentGateway.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ installments: 12 }),
      );
    });
  });
});
