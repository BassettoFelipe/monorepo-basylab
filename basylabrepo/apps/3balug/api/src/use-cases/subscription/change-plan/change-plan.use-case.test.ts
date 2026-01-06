import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  OperationNotAllowedError,
  PlanNotFoundError,
  SubscriptionNotFoundError,
} from "@basylab/core/errors";
import type { User } from "@/db/schema/users";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import { USER_ROLES } from "@/types/roles";
import { ChangePlanUseCase } from "./change-plan.use-case";

describe("ChangePlanUseCase", () => {
  let useCase: ChangePlanUseCase;
  let mockSubscriptionRepository: ISubscriptionRepository;
  let mockPlanRepository: IPlanRepository;
  let mockUser: User;

  beforeEach(() => {
    mockSubscriptionRepository = {
      findCurrentByUserId: mock(() =>
        Promise.resolve({
          id: "sub-123",
          planId: "plan-basic",
          status: "pending",
        }),
      ),
      update: mock((id: string, data: any) =>
        Promise.resolve({
          id,
          planId: data.planId,
          status: "pending",
        }),
      ),
    } as any;

    mockPlanRepository = {
      findById: mock((id: string) =>
        Promise.resolve({
          id,
          slug: id === "plan-premium" ? "premium" : "basic",
          name: id === "plan-premium" ? "Premium" : "Basic",
          price: id === "plan-premium" ? 99.9 : 49.9,
        }),
      ),
    } as any;

    mockUser = {
      id: "user-123",
      role: USER_ROLES.OWNER,
      email: "user@test.com",
    } as User;

    useCase = new ChangePlanUseCase(mockSubscriptionRepository, mockPlanRepository);
  });

  describe("Casos de Sucesso", () => {
    test("deve alterar plano com sucesso", async () => {
      const result = await useCase.execute({
        user: mockUser,
        planId: "plan-premium",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Plano alterado com sucesso");
      expect(result.subscription).toBeDefined();
      expect(result.subscription.planId).toBe("plan-premium");
      expect(mockSubscriptionRepository.update).toHaveBeenCalledWith("sub-123", {
        planId: "plan-premium",
      });
    });

    test("deve retornar informações do novo plano", async () => {
      const result = await useCase.execute({
        user: mockUser,
        planId: "plan-premium",
      });

      expect(result.subscription.plan).toBeDefined();
      expect(result.subscription.plan.id).toBe("plan-premium");
      expect(result.subscription.plan.name).toBe("Premium");
      expect(result.subscription.plan.price).toBe(99.9);
    });

    test("deve atualizar subscription existente", async () => {
      await useCase.execute({
        user: mockUser,
        planId: "plan-premium",
      });

      expect(mockSubscriptionRepository.update).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionRepository.update).toHaveBeenCalledWith("sub-123", {
        planId: "plan-premium",
      });
    });

    test("deve buscar subscription do usuário", async () => {
      await useCase.execute({
        user: mockUser,
        planId: "plan-premium",
      });

      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith("user-123");
    });

    test("deve buscar detalhes do novo plano", async () => {
      await useCase.execute({
        user: mockUser,
        planId: "plan-premium",
      });

      expect(mockPlanRepository.findById).toHaveBeenCalledWith("plan-premium");
    });
  });

  describe("Validações de Subscription", () => {
    test("deve rejeitar quando usuário não tem subscription", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          user: mockUser,
          planId: "plan-premium",
        }),
      ).rejects.toThrow(SubscriptionNotFoundError);
    });

    test("deve rejeitar quando subscription não está pending", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        id: "sub-123",
        planId: "plan-basic",
        status: "active",
      });

      await expect(
        useCase.execute({
          user: mockUser,
          planId: "plan-premium",
        }),
      ).rejects.toThrow(OperationNotAllowedError);
    });

    test("deve rejeitar subscription cancelled", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        id: "sub-123",
        planId: "plan-basic",
        status: "cancelled",
      });

      await expect(
        useCase.execute({
          user: mockUser,
          planId: "plan-premium",
        }),
      ).rejects.toThrow("Apenas assinaturas pendentes podem ter o plano alterado");
    });

    test("deve rejeitar subscription expired", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        id: "sub-123",
        planId: "plan-basic",
        status: "expired",
      });

      await expect(
        useCase.execute({
          user: mockUser,
          planId: "plan-premium",
        }),
      ).rejects.toThrow(OperationNotAllowedError);
    });

    test("deve aceitar apenas subscription pending", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        id: "sub-123",
        planId: "plan-basic",
        status: "pending",
      });

      const result = await useCase.execute({
        user: mockUser,
        planId: "plan-premium",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Validações de Plano", () => {
    test("deve rejeitar quando plano não existe", async () => {
      (mockPlanRepository.findById as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          user: mockUser,
          planId: "invalid-plan",
        }),
      ).rejects.toThrow(PlanNotFoundError);
    });

    test("deve rejeitar quando tenta mudar para o mesmo plano", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        id: "sub-123",
        planId: "plan-premium",
        status: "pending",
      });

      await expect(
        useCase.execute({
          user: mockUser,
          planId: "plan-premium",
        }),
      ).rejects.toThrow(OperationNotAllowedError);
    });

    test("deve rejeitar com mensagem apropriada ao tentar mesmo plano", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        id: "sub-123",
        planId: "plan-basic",
        status: "pending",
      });

      await expect(
        useCase.execute({
          user: mockUser,
          planId: "plan-basic",
        }),
      ).rejects.toThrow("Você já está neste plano");
    });

    test("deve permitir upgrade de plano", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        id: "sub-123",
        planId: "plan-basic",
        status: "pending",
      });

      const result = await useCase.execute({
        user: mockUser,
        planId: "plan-premium",
      });

      expect(result.success).toBe(true);
      expect(result.subscription.plan.price).toBe(99.9);
    });

    test("deve permitir downgrade de plano", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        id: "sub-123",
        planId: "plan-premium",
        status: "pending",
      });

      (mockPlanRepository.findById as any).mockResolvedValueOnce({
        id: "plan-basic",
        slug: "basic",
        name: "Basic",
        price: 49.9,
      });

      const result = await useCase.execute({
        user: mockUser,
        planId: "plan-basic",
      });

      expect(result.success).toBe(true);
      expect(result.subscription.plan.price).toBe(49.9);
    });
  });

  describe("Validações de Update", () => {
    test("deve rejeitar quando update falha", async () => {
      (mockSubscriptionRepository.update as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          user: mockUser,
          planId: "plan-premium",
        }),
      ).rejects.toThrow(OperationNotAllowedError);
    });

    test("deve rejeitar com mensagem apropriada quando update falha", async () => {
      (mockSubscriptionRepository.update as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          user: mockUser,
          planId: "plan-premium",
        }),
      ).rejects.toThrow("Falha ao atualizar a assinatura");
    });

    test("deve chamar update com parâmetros corretos", async () => {
      await useCase.execute({
        user: mockUser,
        planId: "plan-premium",
      });

      expect(mockSubscriptionRepository.update).toHaveBeenCalledWith("sub-123", {
        planId: "plan-premium",
      });
    });
  });

  describe("Integração com Serviços", () => {
    test("deve chamar serviços na ordem correta", async () => {
      const callOrder: string[] = [];

      (mockSubscriptionRepository.findCurrentByUserId as any).mockImplementation(async () => {
        callOrder.push("findSubscription");
        return { id: "sub-123", planId: "plan-basic", status: "pending" };
      });

      (mockPlanRepository.findById as any).mockImplementation(async () => {
        callOrder.push("findPlan");
        return { id: "plan-premium", name: "Premium", price: 99.9 };
      });

      (mockSubscriptionRepository.update as any).mockImplementation(async () => {
        callOrder.push("updateSubscription");
        return { id: "sub-123", planId: "plan-premium", status: "pending" };
      });

      await useCase.execute({
        user: mockUser,
        planId: "plan-premium",
      });

      expect(callOrder).toEqual(["findSubscription", "findPlan", "updateSubscription"]);
    });

    test("deve propagar erro do repository.findCurrentByUserId", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockRejectedValueOnce(
        new Error("Database connection failed"),
      );

      await expect(
        useCase.execute({
          user: mockUser,
          planId: "plan-premium",
        }),
      ).rejects.toThrow("Database connection failed");
    });

    test("deve propagar erro do planRepository.findById", async () => {
      (mockPlanRepository.findById as any).mockRejectedValueOnce(new Error("Plan query failed"));

      await expect(
        useCase.execute({
          user: mockUser,
          planId: "plan-premium",
        }),
      ).rejects.toThrow("Plan query failed");
    });

    test("deve propagar erro do repository.update", async () => {
      (mockSubscriptionRepository.update as any).mockRejectedValueOnce(new Error("Update failed"));

      await expect(
        useCase.execute({
          user: mockUser,
          planId: "plan-premium",
        }),
      ).rejects.toThrow("Update failed");
    });
  });

  describe("Casos Edge", () => {
    test("deve lidar com diferentes usuários", async () => {
      const user1 = { ...mockUser, id: "user-111" };
      const user2 = { ...mockUser, id: "user-222" };

      await useCase.execute({
        user: user1,
        planId: "plan-premium",
      });

      await useCase.execute({
        user: user2,
        planId: "plan-premium",
      });

      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith("user-111");
      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith("user-222");
    });

    test("deve retornar subscription ID correto", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        id: "custom-sub-id-999",
        planId: "plan-basic",
        status: "pending",
      });

      (mockSubscriptionRepository.update as any).mockResolvedValueOnce({
        id: "custom-sub-id-999",
        planId: "plan-premium",
        status: "pending",
      });

      const result = await useCase.execute({
        user: mockUser,
        planId: "plan-premium",
      });

      expect(result.subscription.id).toBe("custom-sub-id-999");
    });

    test("deve lidar com IDs de plano com formatos diferentes", async () => {
      const planIds = ["plan-123", "uuid-abc-def-123", "custom_plan_id", "1234567890"];

      for (const planId of planIds) {
        (mockPlanRepository.findById as any).mockResolvedValueOnce({
          id: planId,
          name: "Test Plan",
          price: 99.9,
        });

        (mockSubscriptionRepository.update as any).mockResolvedValueOnce({
          id: "sub-123",
          planId,
          status: "pending",
        });

        const result = await useCase.execute({
          user: mockUser,
          planId,
        });

        expect(result.subscription.planId).toBe(planId);
      }
    });
  });
});
