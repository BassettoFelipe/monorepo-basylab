import { beforeEach, describe, expect, it, mock } from "bun:test";
import { PendingPaymentNotFoundError, PlanNotFoundError } from "@/errors";
import type { IPendingPaymentRepository } from "@/repositories/contracts/pending-payment.repository";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";
import type { PendingPayment } from "@/types/pending-payment";
import type { Plan } from "@/types/plan";
import { GetPendingPaymentUseCase } from "./get-pending-payment.use-case";

describe("GetPendingPaymentUseCase", () => {
  let pendingPaymentRepository: IPendingPaymentRepository;
  let planRepository: IPlanRepository;
  let getPendingPaymentUseCase: GetPendingPaymentUseCase;

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
    email: "user@example.com",
    name: "Test User",
    password: "$2b$10$hashedPassword",
    planId: "plan-123",
    pagarmeOrderId: null,
    pagarmeChargeId: null,
    processedWebhookId: null,
    status: "pending",
    expiresAt: new Date(Date.now() + 1800000), // 30 minutes from now
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    pendingPaymentRepository = {
      findById: mock(() => Promise.resolve({ ...mockPendingPayment })),
    } as unknown as IPendingPaymentRepository;

    planRepository = {
      findById: mock(() => Promise.resolve({ ...mockPlan })),
    } as unknown as IPlanRepository;

    getPendingPaymentUseCase = new GetPendingPaymentUseCase(
      pendingPaymentRepository,
      planRepository,
    );
  });

  describe("Fluxo de sucesso", () => {
    it("deve retornar dados do pagamento pendente com plano", async () => {
      const result = await getPendingPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
      });

      expect(result).toEqual({
        id: "pending-123",
        email: "user@example.com",
        name: "Test User",
        planId: "plan-123",
        plan: {
          id: "plan-123",
          name: "Plano Premium",
          price: 9900,
        },
        status: "pending",
        expiresAt: mockPendingPayment.expiresAt.toISOString(),
      });

      expect(pendingPaymentRepository.findById).toHaveBeenCalledWith("pending-123");
      expect(planRepository.findById).toHaveBeenCalledWith("plan-123");
    });

    it("não deve retornar senha no output", async () => {
      const result = await getPendingPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
      });

      expect(result).not.toHaveProperty("password");
    });

    it("deve retornar dados simplificados do plano", async () => {
      const result = await getPendingPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
      });

      expect(result.plan).toEqual({
        id: "plan-123",
        name: "Plano Premium",
        price: 9900,
      });

      expect(result.plan).not.toHaveProperty("description");
      expect(result.plan).not.toHaveProperty("durationDays");
      expect(result.plan).not.toHaveProperty("features");
    });
  });

  describe("Validações de erro", () => {
    it("deve lançar erro se pagamento não existir", async () => {
      pendingPaymentRepository.findById = mock(() => Promise.resolve(null));

      await expect(
        getPendingPaymentUseCase.execute({ pendingPaymentId: "non-existent" }),
      ).rejects.toThrow(PendingPaymentNotFoundError);
    });

    it("deve retornar pagamento expirado sem erro", async () => {
      const expiredPayment = {
        ...mockPendingPayment,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      };

      pendingPaymentRepository.findById = mock(() => Promise.resolve(expiredPayment));

      const result = await getPendingPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("pending-123");
      expect(new Date(result.expiresAt).getTime()).toBeLessThan(Date.now());
    });

    it("deve lançar erro se plano não existir", async () => {
      planRepository.findById = mock(() => Promise.resolve(null));

      await expect(
        getPendingPaymentUseCase.execute({ pendingPaymentId: "pending-123" }),
      ).rejects.toThrow(PlanNotFoundError);
    });
  });

  describe("Diferentes status", () => {
    it("deve retornar pagamento com status paid", async () => {
      const paidPayment = { ...mockPendingPayment, status: "paid" as const };
      pendingPaymentRepository.findById = mock(() => Promise.resolve(paidPayment));

      const result = await getPendingPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
      });

      expect(result.status).toBe("paid");
    });

    it("deve retornar pagamento com status failed", async () => {
      const failedPayment = {
        ...mockPendingPayment,
        status: "failed" as const,
      };
      pendingPaymentRepository.findById = mock(() => Promise.resolve(failedPayment));

      const result = await getPendingPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
      });

      expect(result.status).toBe("failed");
    });
  });

  describe("Expiração", () => {
    it("deve aceitar pagamento que expira em breve", async () => {
      const aboutToExpire = {
        ...mockPendingPayment,
        expiresAt: new Date(Date.now() + 1000), // 1 second from now
      };

      pendingPaymentRepository.findById = mock(() => Promise.resolve(aboutToExpire));

      const result = await getPendingPaymentUseCase.execute({
        pendingPaymentId: "pending-123",
      });

      expect(result.id).toBe("pending-123");
    });
  });
});
