import { beforeEach, describe, expect, mock, test } from "bun:test";
import { BadRequestError, ForbiddenError } from "@basylab/core/errors";
import type { User } from "@/db/schema/users";
import type { ICustomFieldRepository } from "@/repositories/contracts/custom-field.repository";
import type { ICustomFieldResponseRepository } from "@/repositories/contracts/custom-field-response.repository";
import type { IPlanFeatureRepository } from "@/repositories/contracts/plan-feature.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { PLAN_FEATURES } from "@/types/features";
import { SaveMyFieldsUseCase } from "./save-my-fields.use-case";

describe("SaveMyFieldsUseCase", () => {
  let useCase: SaveMyFieldsUseCase;
  let mockUserRepository: IUserRepository;
  let mockSubscriptionRepository: ISubscriptionRepository;
  let mockCustomFieldRepository: ICustomFieldRepository;
  let mockCustomFieldResponseRepository: ICustomFieldResponseRepository;
  let mockPlanFeatureRepository: IPlanFeatureRepository;

  const mockUser: User = {
    id: "user-123",
    companyId: "company-123",
    name: "Test User",
    email: "test@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockSubscription = {
    id: "sub-123",
    userId: "user-123",
    plan: { slug: "premium" },
    status: "active",
  };

  const mockActiveFields = [
    {
      id: "field-1",
      label: "Campo Texto",
      isRequired: false,
      isActive: true,
      companyId: "company-123",
    },
    {
      id: "field-2",
      label: "Campo Obrigatório",
      isRequired: true,
      isActive: true,
      companyId: "company-123",
    },
  ];

  beforeEach(() => {
    mockUserRepository = {
      findById: mock(() => Promise.resolve(null)),
    } as any;

    mockSubscriptionRepository = {
      findCurrentByUserId: mock(() => Promise.resolve(mockSubscription)),
    } as any;

    mockCustomFieldRepository = {
      findActiveByCompanyId: mock(() => Promise.resolve(mockActiveFields)),
    } as any;

    mockCustomFieldResponseRepository = {
      upsertMany: mock(() => Promise.resolve()),
    } as any;

    mockPlanFeatureRepository = {
      planHasFeature: mock(() => Promise.resolve(true)),
    } as any;

    useCase = new SaveMyFieldsUseCase(
      mockUserRepository,
      mockSubscriptionRepository,
      mockCustomFieldRepository,
      mockCustomFieldResponseRepository,
      mockPlanFeatureRepository,
    );
  });

  describe("Casos de Sucesso", () => {
    test("deve salvar campos com sucesso", async () => {
      const result = await useCase.execute({
        user: mockUser,
        fields: [
          { fieldId: "field-1", value: "Valor teste" },
          { fieldId: "field-2", value: "Valor obrigatório" },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Informações salvas com sucesso");
      expect(mockCustomFieldResponseRepository.upsertMany).toHaveBeenCalled();
    });

    test("deve salvar apenas campo obrigatório", async () => {
      const result = await useCase.execute({
        user: mockUser,
        fields: [{ fieldId: "field-2", value: "Valor obrigatório" }],
      });

      expect(result.success).toBe(true);
      expect(mockCustomFieldResponseRepository.upsertMany).toHaveBeenCalledWith([
        {
          userId: "user-123",
          fieldId: "field-2",
          value: "Valor obrigatório",
        },
      ]);
    });

    test("deve permitir valores null para campos opcionais", async () => {
      const result = await useCase.execute({
        user: mockUser,
        fields: [
          { fieldId: "field-1", value: null },
          { fieldId: "field-2", value: "Valor obrigatório" },
        ],
      });

      expect(result.success).toBe(true);
      expect(mockCustomFieldResponseRepository.upsertMany).toHaveBeenCalledWith([
        { userId: "user-123", fieldId: "field-1", value: null },
        {
          userId: "user-123",
          fieldId: "field-2",
          value: "Valor obrigatório",
        },
      ]);
    });

    test("deve salvar múltiplos campos de uma vez", async () => {
      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce([
        { id: "field-1", isRequired: false, isActive: true },
        { id: "field-2", isRequired: false, isActive: true },
        { id: "field-3", isRequired: false, isActive: true },
      ]);

      const result = await useCase.execute({
        user: mockUser,
        fields: [
          { fieldId: "field-1", value: "Valor 1" },
          { fieldId: "field-2", value: "Valor 2" },
          { fieldId: "field-3", value: "Valor 3" },
        ],
      });

      expect(result.success).toBe(true);
      expect(mockCustomFieldResponseRepository.upsertMany).toHaveBeenCalledWith([
        { userId: "user-123", fieldId: "field-1", value: "Valor 1" },
        { userId: "user-123", fieldId: "field-2", value: "Valor 2" },
        { userId: "user-123", fieldId: "field-3", value: "Valor 3" },
      ]);
    });
  });

  describe("Validações de Empresa", () => {
    test("deve rejeitar quando usuário não tem empresa", async () => {
      const userNoCompany = { ...mockUser, companyId: null };

      await expect(
        useCase.execute({
          user: userNoCompany,
          fields: [],
        }),
      ).rejects.toThrow(ForbiddenError);

      expect(mockCustomFieldResponseRepository.upsertMany).not.toHaveBeenCalled();
    });

    test("deve buscar campos da empresa do usuário", async () => {
      await useCase.execute({
        user: mockUser,
        fields: [{ fieldId: "field-2", value: "Valor" }],
      });

      expect(mockCustomFieldRepository.findActiveByCompanyId).toHaveBeenCalledWith("company-123");
    });
  });

  describe("Validações de Subscription", () => {
    test("deve verificar feature na subscription do usuário", async () => {
      await useCase.execute({
        user: mockUser,
        fields: [{ fieldId: "field-2", value: "Valor" }],
      });

      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith("user-123");
      expect(mockPlanFeatureRepository.planHasFeature).toHaveBeenCalledWith(
        "premium",
        PLAN_FEATURES.CUSTOM_FIELDS,
      );
    });

    test("deve rejeitar quando plano não tem feature", async () => {
      (mockPlanFeatureRepository.planHasFeature as any).mockResolvedValueOnce(false);

      await expect(
        useCase.execute({
          user: mockUser,
          fields: [{ fieldId: "field-2", value: "Valor" }],
        }),
      ).rejects.toThrow("Seu plano não tem acesso a campos customizados");

      expect(mockCustomFieldResponseRepository.upsertMany).not.toHaveBeenCalled();
    });

    test("deve rejeitar quando não há subscription e não tem createdBy", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          user: mockUser,
          fields: [{ fieldId: "field-2", value: "Valor" }],
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    test("deve buscar subscription do owner quando usuário não tem subscription", async () => {
      const userCreatedByOwner = { ...mockUser, createdBy: "owner-123" };
      (mockSubscriptionRepository.findCurrentByUserId as any)
        .mockResolvedValueOnce(null) // Primeira chamada: usuário não tem subscription
        .mockResolvedValueOnce(mockSubscription); // Segunda chamada: owner tem subscription

      (mockUserRepository.findById as any).mockResolvedValueOnce({
        id: "owner-123",
        companyId: "company-123",
      });

      const result = await useCase.execute({
        user: userCreatedByOwner,
        fields: [{ fieldId: "field-2", value: "Valor" }],
      });

      expect(result.success).toBe(true);
      expect(mockUserRepository.findById).toHaveBeenCalledWith("owner-123");
      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith("owner-123");
    });

    test("deve rejeitar quando owner também não tem subscription", async () => {
      const userCreatedByOwner = { ...mockUser, createdBy: "owner-123" };
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValue(null);
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        id: "owner-123",
        companyId: "company-123",
      });

      await expect(
        useCase.execute({
          user: userCreatedByOwner,
          fields: [{ fieldId: "field-2", value: "Valor" }],
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    test("deve rejeitar quando owner não é encontrado", async () => {
      const userCreatedByOwner = { ...mockUser, createdBy: "owner-123" };
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce(null);
      (mockUserRepository.findById as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          user: userCreatedByOwner,
          fields: [{ fieldId: "field-2", value: "Valor" }],
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("Validações de Campos Obrigatórios", () => {
    test("deve rejeitar quando campo obrigatório não é fornecido", async () => {
      await expect(
        useCase.execute({
          user: mockUser,
          fields: [{ fieldId: "field-1", value: "Apenas opcional" }],
        }),
      ).rejects.toThrow(BadRequestError);

      expect(mockCustomFieldResponseRepository.upsertMany).not.toHaveBeenCalled();
    });

    test("deve rejeitar quando campo obrigatório tem valor vazio", async () => {
      await expect(
        useCase.execute({
          user: mockUser,
          fields: [{ fieldId: "field-2", value: "" }],
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("deve rejeitar quando campo obrigatório tem apenas espaços", async () => {
      await expect(
        useCase.execute({
          user: mockUser,
          fields: [{ fieldId: "field-2", value: "   " }],
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("deve rejeitar quando campo obrigatório tem valor null", async () => {
      await expect(
        useCase.execute({
          user: mockUser,
          fields: [{ fieldId: "field-2", value: null }],
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("deve incluir nome do campo na mensagem de erro", async () => {
      try {
        await useCase.execute({
          user: mockUser,
          fields: [],
        });
        expect(true).toBe(false); // Não deveria chegar aqui
      } catch (error) {
        expect((error as Error).message).toContain("Campo Obrigatório");
        expect((error as Error).message).toContain("obrigatório");
      }
    });

    test("deve aceitar quando todos os campos obrigatórios são fornecidos", async () => {
      const result = await useCase.execute({
        user: mockUser,
        fields: [
          { fieldId: "field-1", value: "Opcional" },
          { fieldId: "field-2", value: "Obrigatório preenchido" },
        ],
      });

      expect(result.success).toBe(true);
    });

    test("deve validar múltiplos campos obrigatórios", async () => {
      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce([
        { id: "field-1", label: "Campo 1", isRequired: true, isActive: true },
        { id: "field-2", label: "Campo 2", isRequired: true, isActive: true },
        { id: "field-3", label: "Campo 3", isRequired: false, isActive: true },
      ]);

      await expect(
        useCase.execute({
          user: mockUser,
          fields: [
            { fieldId: "field-1", value: "Valor 1" },
            // field-2 faltando
            { fieldId: "field-3", value: "Valor 3" },
          ],
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("Filtragem de Campos", () => {
    test("deve filtrar apenas campos ativos", async () => {
      const result = await useCase.execute({
        user: mockUser,
        fields: [
          { fieldId: "field-1", value: "Campo ativo" },
          { fieldId: "field-2", value: "Obrigatório" },
          { fieldId: "field-invalid", value: "Campo inválido" },
        ],
      });

      expect(result.success).toBe(true);
      expect(mockCustomFieldResponseRepository.upsertMany).toHaveBeenCalledWith([
        { userId: "user-123", fieldId: "field-1", value: "Campo ativo" },
        { userId: "user-123", fieldId: "field-2", value: "Obrigatório" },
      ]);
    });

    test("não deve salvar campos desconhecidos", async () => {
      const result = await useCase.execute({
        user: mockUser,
        fields: [
          { fieldId: "field-2", value: "Obrigatório" },
          { fieldId: "unknown-field", value: "Desconhecido" },
          { fieldId: "another-unknown", value: "Outro desconhecido" },
        ],
      });

      expect(result.success).toBe(true);
      const callArgs = (mockCustomFieldResponseRepository.upsertMany as any).mock.calls[0][0];
      expect(callArgs).toHaveLength(1);
      expect(callArgs[0].fieldId).toBe("field-2");
    });

    test("deve funcionar quando não há campos para salvar após filtro", async () => {
      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce([]);

      const result = await useCase.execute({
        user: mockUser,
        fields: [{ fieldId: "field-unknown", value: "Desconhecido" }],
      });

      expect(result.success).toBe(true);
      expect(mockCustomFieldResponseRepository.upsertMany).not.toHaveBeenCalled();
    });
  });

  describe("Casos Extremos", () => {
    test("deve aceitar lista vazia de campos quando não há obrigatórios", async () => {
      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce([
        { id: "field-1", isRequired: false, isActive: true },
      ]);

      const result = await useCase.execute({
        user: mockUser,
        fields: [],
      });

      expect(result.success).toBe(true);
      expect(mockCustomFieldResponseRepository.upsertMany).not.toHaveBeenCalled();
    });

    test("deve aceitar valores vazios para campos opcionais", async () => {
      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce([
        { id: "field-1", isRequired: false, isActive: true },
      ]);

      const result = await useCase.execute({
        user: mockUser,
        fields: [{ fieldId: "field-1", value: "" }],
      });

      expect(result.success).toBe(true);
    });

    test("deve aceitar valores com apenas espaços para campos opcionais", async () => {
      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce([
        { id: "field-1", isRequired: false, isActive: true },
      ]);

      const result = await useCase.execute({
        user: mockUser,
        fields: [{ fieldId: "field-1", value: "   " }],
      });

      expect(result.success).toBe(true);
    });

    test("deve converter valores vazios para null no upsert", async () => {
      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce([
        { id: "field-1", isRequired: false, isActive: true },
      ]);

      await useCase.execute({
        user: mockUser,
        fields: [{ fieldId: "field-1", value: "" }],
      });

      expect(mockCustomFieldResponseRepository.upsertMany).toHaveBeenCalledWith([
        { userId: "user-123", fieldId: "field-1", value: null },
      ]);
    });
  });

  describe("Integração Completa", () => {
    test("deve executar fluxo completo: validar empresa -> buscar subscription -> verificar feature -> validar campos -> salvar", async () => {
      const result = await useCase.execute({
        user: mockUser,
        fields: [
          { fieldId: "field-1", value: "Valor 1" },
          { fieldId: "field-2", value: "Valor 2" },
        ],
      });

      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith("user-123");
      expect(mockPlanFeatureRepository.planHasFeature).toHaveBeenCalledWith(
        "premium",
        PLAN_FEATURES.CUSTOM_FIELDS,
      );
      expect(mockCustomFieldRepository.findActiveByCompanyId).toHaveBeenCalledWith("company-123");
      expect(mockCustomFieldResponseRepository.upsertMany).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test("deve executar fluxo com fallback para owner subscription", async () => {
      const userCreatedByOwner = { ...mockUser, createdBy: "owner-123" };
      (mockSubscriptionRepository.findCurrentByUserId as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockSubscription);

      (mockUserRepository.findById as any).mockResolvedValueOnce({
        id: "owner-123",
        companyId: "company-123",
      });

      const result = await useCase.execute({
        user: userCreatedByOwner,
        fields: [{ fieldId: "field-2", value: "Valor" }],
      });

      expect(mockUserRepository.findById).toHaveBeenCalledWith("owner-123");
      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    test("deve salvar corretamente quando há mix de campos válidos e inválidos", async () => {
      const result = await useCase.execute({
        user: mockUser,
        fields: [
          { fieldId: "field-1", value: "Válido 1" },
          { fieldId: "invalid-1", value: "Inválido 1" },
          { fieldId: "field-2", value: "Válido 2" },
          { fieldId: "invalid-2", value: "Inválido 2" },
        ],
      });

      expect(result.success).toBe(true);
      const callArgs = (mockCustomFieldResponseRepository.upsertMany as any).mock.calls[0][0];
      expect(callArgs).toHaveLength(2);
      expect(callArgs.every((arg: any) => arg.userId === "user-123")).toBe(true);
    });
  });

  describe("Mensagens de Retorno", () => {
    test("deve retornar mensagem de sucesso padrão", async () => {
      const result = await useCase.execute({
        user: mockUser,
        fields: [{ fieldId: "field-2", value: "Valor" }],
      });

      expect(result.message).toBe("Informações salvas com sucesso");
    });

    test("deve retornar success: true", async () => {
      const result = await useCase.execute({
        user: mockUser,
        fields: [{ fieldId: "field-2", value: "Valor" }],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Validações de Planos", () => {
    test("deve funcionar com plano premium", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        plan: { slug: "premium" },
      });

      const result = await useCase.execute({
        user: mockUser,
        fields: [{ fieldId: "field-2", value: "Valor" }],
      });

      expect(result.success).toBe(true);
    });

    test("deve funcionar com plano business", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        plan: { slug: "business" },
      });
      (mockPlanFeatureRepository.planHasFeature as any).mockResolvedValueOnce(true);

      const result = await useCase.execute({
        user: mockUser,
        fields: [{ fieldId: "field-2", value: "Valor" }],
      });

      expect(result.success).toBe(true);
    });

    test("deve rejeitar plano básico sem feature", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        plan: { slug: "basic" },
      });
      (mockPlanFeatureRepository.planHasFeature as any).mockResolvedValueOnce(false);

      await expect(
        useCase.execute({
          user: mockUser,
          fields: [{ fieldId: "field-2", value: "Valor" }],
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
