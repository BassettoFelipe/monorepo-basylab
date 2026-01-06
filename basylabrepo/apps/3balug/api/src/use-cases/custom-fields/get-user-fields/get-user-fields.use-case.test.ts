import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ForbiddenError } from "@basylab/core/errors";
import type { User } from "@/db/schema/users";
import type { ICustomFieldRepository } from "@/repositories/contracts/custom-field.repository";
import type { ICustomFieldResponseRepository } from "@/repositories/contracts/custom-field-response.repository";
import type { IPlanFeatureRepository } from "@/repositories/contracts/plan-feature.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { PLAN_FEATURES } from "@/types/features";
import { GetUserFieldsUseCase } from "./get-user-fields.use-case";

describe("GetUserFieldsUseCase", () => {
  let useCase: GetUserFieldsUseCase;
  let mockUserRepository: IUserRepository;
  let mockSubscriptionRepository: ISubscriptionRepository;
  let mockCustomFieldRepository: ICustomFieldRepository;
  let mockCustomFieldResponseRepository: ICustomFieldResponseRepository;
  let mockPlanFeatureRepository: IPlanFeatureRepository;

  const mockCurrentUser: User = {
    id: "current-user-123",
    companyId: "company-123",
    name: "Current User",
    email: "current@test.com",
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockTargetUser = {
    id: "target-user-123",
    companyId: "company-123",
    name: "Target User",
    email: "target@test.com",
    avatarUrl: "https://example.com/avatar.jpg",
  };

  const mockSubscription = {
    id: "sub-123",
    userId: "current-user-123",
    plan: { slug: "premium", name: "Premium" },
    status: "active",
  };

  const mockFields = [
    {
      id: "field-1",
      companyId: "company-123",
      label: "Nome Completo",
      type: "text",
      isRequired: true,
      isActive: true,
      options: null,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "field-2",
      companyId: "company-123",
      label: "Telefone",
      type: "phone",
      isRequired: false,
      isActive: false,
      options: null,
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockResponses = [
    {
      id: "resp-1",
      userId: "target-user-123",
      fieldId: "field-1",
      value: "João Silva",
    },
  ];

  beforeEach(() => {
    mockUserRepository = {
      findById: mock((id: string) =>
        id === "target-user-123" ? Promise.resolve(mockTargetUser) : Promise.resolve(null),
      ),
    } as any;

    mockSubscriptionRepository = {
      findCurrentByUserId: mock(() => Promise.resolve(mockSubscription)),
    } as any;

    mockCustomFieldRepository = {
      findByCompanyId: mock(() => Promise.resolve(mockFields)),
    } as any;

    mockCustomFieldResponseRepository = {
      findByUserId: mock(() => Promise.resolve(mockResponses)),
    } as any;

    mockPlanFeatureRepository = {
      planHasFeature: mock(() => Promise.resolve(true)),
    } as any;

    useCase = new GetUserFieldsUseCase(
      mockUserRepository,
      mockSubscriptionRepository,
      mockCustomFieldRepository,
      mockCustomFieldResponseRepository,
      mockPlanFeatureRepository,
    );
  });

  describe("Casos de Sucesso", () => {
    test("deve retornar campos do usuário alvo com valores", async () => {
      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe("target-user-123");
      expect(result.user.name).toBe("Target User");
      expect(result.user.email).toBe("target@test.com");
      expect(result.user.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(result.fields).toHaveLength(2);
      expect(result.fields[0].value).toBe("João Silva");
      expect(result.fields[1].value).toBeNull();
    });

    test("deve buscar campos do usuário alvo correto", async () => {
      await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(mockUserRepository.findById).toHaveBeenCalledWith("target-user-123");
      expect(mockCustomFieldResponseRepository.findByUserId).toHaveBeenCalledWith(
        "target-user-123",
      );
    });

    test("deve retornar informações básicas do usuário", async () => {
      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.user).toEqual({
        id: "target-user-123",
        name: "Target User",
        email: "target@test.com",
        avatarUrl: "https://example.com/avatar.jpg",
      });
    });

    test("deve retornar avatarUrl null quando usuário não tem avatar", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        avatarUrl: null,
      });

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.user.avatarUrl).toBeNull();
    });

    test("deve retornar todos os campos incluindo inativos", async () => {
      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields).toHaveLength(2);
      expect(result.fields.some((f) => f.isActive === false)).toBe(true);
    });
  });

  describe("Validações de Usuário Alvo", () => {
    test("deve rejeitar quando usuário alvo não existe", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          currentUser: mockCurrentUser,
          targetUserId: "invalid-id",
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    test("deve rejeitar quando usuário alvo está em outra empresa", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        companyId: "other-company",
      });

      await expect(
        useCase.execute({
          currentUser: mockCurrentUser,
          targetUserId: "target-user-123",
        }),
      ).rejects.toThrow("Você não tem permissão para visualizar este usuário");
    });

    test("deve permitir quando usuário alvo está na mesma empresa", async () => {
      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.user.id).toBe("target-user-123");
    });

    test("deve validar empresa antes de buscar campos", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        companyId: "other-company",
      });

      await expect(
        useCase.execute({
          currentUser: mockCurrentUser,
          targetUserId: "target-user-123",
        }),
      ).rejects.toThrow(ForbiddenError);

      expect(mockCustomFieldRepository.findByCompanyId).not.toHaveBeenCalled();
    });
  });

  describe("Validações de Empresa do Current User", () => {
    test("deve retornar apenas userInfo quando currentUser não tem companyId", async () => {
      const userNoCompany = { ...mockCurrentUser, companyId: null };

      const result = await useCase.execute({
        currentUser: userNoCompany,
        targetUserId: "target-user-123",
      });

      expect(result.user).toBeDefined();
      expect(result.fields).toHaveLength(0);
      expect(mockSubscriptionRepository.findCurrentByUserId).not.toHaveBeenCalled();
    });

    test("deve buscar campos da empresa do currentUser", async () => {
      await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(mockCustomFieldRepository.findByCompanyId).toHaveBeenCalledWith("company-123");
    });
  });

  describe("Validações de Subscription", () => {
    test("deve verificar feature na subscription do currentUser", async () => {
      await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith(
        "current-user-123",
      );
      expect(mockPlanFeatureRepository.planHasFeature).toHaveBeenCalledWith(
        "premium",
        PLAN_FEATURES.CUSTOM_FIELDS,
      );
    });

    test("deve retornar apenas userInfo quando plano não tem feature", async () => {
      (mockPlanFeatureRepository.planHasFeature as any).mockResolvedValueOnce(false);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.user).toBeDefined();
      expect(result.fields).toHaveLength(0);
      expect(mockCustomFieldRepository.findByCompanyId).not.toHaveBeenCalled();
    });

    test("deve retornar apenas userInfo quando não há subscription", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce(null);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields).toHaveLength(0);
    });

    test("deve buscar subscription do owner quando currentUser não tem subscription", async () => {
      const userCreatedByOwner = { ...mockCurrentUser, createdBy: "owner-123" };
      (mockSubscriptionRepository.findCurrentByUserId as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockSubscription);

      (mockUserRepository.findById as any).mockImplementation((id: string) => {
        if (id === "target-user-123") return Promise.resolve(mockTargetUser);
        if (id === "owner-123")
          return Promise.resolve({ id: "owner-123", companyId: "company-123" });
        return Promise.resolve(null);
      });

      const result = await useCase.execute({
        currentUser: userCreatedByOwner,
        targetUserId: "target-user-123",
      });

      expect(result.fields).toHaveLength(2);
      expect(mockUserRepository.findById).toHaveBeenCalledWith("owner-123");
      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith("owner-123");
    });

    test("deve retornar apenas userInfo quando owner também não tem subscription", async () => {
      const userCreatedByOwner = { ...mockCurrentUser, createdBy: "owner-123" };
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValue(null);
      (mockUserRepository.findById as any).mockImplementation((id: string) => {
        if (id === "target-user-123") return Promise.resolve(mockTargetUser);
        if (id === "owner-123")
          return Promise.resolve({ id: "owner-123", companyId: "company-123" });
        return Promise.resolve(null);
      });

      const result = await useCase.execute({
        currentUser: userCreatedByOwner,
        targetUserId: "target-user-123",
      });

      expect(result.fields).toHaveLength(0);
    });
  });

  describe("Mapeamento de Campos e Valores", () => {
    test("deve mesclar corretamente campos e respostas do usuário alvo", async () => {
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([
        { fieldId: "field-1", value: "Valor 1" },
        { fieldId: "field-2", value: "Valor 2" },
      ]);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields[0].value).toBe("Valor 1");
      expect(result.fields[1].value).toBe("Valor 2");
    });

    test("deve retornar null para campos sem resposta", async () => {
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([]);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields.every((f) => f.value === null)).toBe(true);
    });

    test("deve preservar todas as propriedades dos campos", async () => {
      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      const field = result.fields[0];
      expect(field).toHaveProperty("id");
      expect(field).toHaveProperty("companyId");
      expect(field).toHaveProperty("label");
      expect(field).toHaveProperty("type");
      expect(field).toHaveProperty("isRequired");
      expect(field).toHaveProperty("isActive");
      expect(field).toHaveProperty("options");
      expect(field).toHaveProperty("order");
      expect(field).toHaveProperty("createdAt");
      expect(field).toHaveProperty("updatedAt");
      expect(field).toHaveProperty("value");
    });

    test("deve ignorar respostas de campos que não existem mais", async () => {
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([
        { fieldId: "field-1", value: "Valor 1" },
        { fieldId: "field-deleted", value: "Valor deletado" },
      ]);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields).toHaveLength(2);
      expect(result.fields.find((f) => f.id === "field-deleted")).toBeUndefined();
    });

    test("deve retornar valores parcialmente preenchidos", async () => {
      (mockCustomFieldRepository.findByCompanyId as any).mockResolvedValueOnce([
        {
          id: "field-1",
          label: "F1",
          type: "text",
          isActive: true,
          isRequired: false,
          companyId: "company-123",
          options: null,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "field-2",
          label: "F2",
          type: "text",
          isActive: true,
          isRequired: false,
          companyId: "company-123",
          options: null,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "field-3",
          label: "F3",
          type: "text",
          isActive: true,
          isRequired: false,
          companyId: "company-123",
          options: null,
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([
        { fieldId: "field-1", value: "Valor 1" },
        // field-2 não tem valor
        { fieldId: "field-3", value: "Valor 3" },
      ]);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields[0].value).toBe("Valor 1");
      expect(result.fields[1].value).toBeNull();
      expect(result.fields[2].value).toBe("Valor 3");
    });
  });

  describe("Diferenças entre findByCompanyId e findActiveByCompanyId", () => {
    test("deve buscar TODOS os campos da empresa (ativos e inativos)", async () => {
      await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      // Importante: usa findByCompanyId (não findActiveByCompanyId)
      expect(mockCustomFieldRepository.findByCompanyId).toHaveBeenCalledWith("company-123");
    });

    test("deve retornar campos ativos e inativos", async () => {
      (mockCustomFieldRepository.findByCompanyId as any).mockResolvedValueOnce([
        {
          id: "field-active",
          isActive: true,
          label: "Ativo",
          type: "text",
          isRequired: false,
          companyId: "company-123",
          options: null,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "field-inactive",
          isActive: false,
          label: "Inativo",
          type: "text",
          isRequired: false,
          companyId: "company-123",
          options: null,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields).toHaveLength(2);
      expect(result.fields.find((f) => f.id === "field-active")).toBeDefined();
      expect(result.fields.find((f) => f.id === "field-inactive")).toBeDefined();
    });
  });

  describe("Tipos de Campos", () => {
    test("deve retornar todos os tipos de campos suportados", async () => {
      const allTypeFields = [
        {
          id: "f1",
          type: "text",
          label: "Text",
          isActive: true,
          isRequired: false,
        },
        {
          id: "f2",
          type: "textarea",
          label: "Textarea",
          isActive: true,
          isRequired: false,
        },
        {
          id: "f3",
          type: "number",
          label: "Number",
          isActive: true,
          isRequired: false,
        },
        {
          id: "f4",
          type: "email",
          label: "Email",
          isActive: true,
          isRequired: false,
        },
        {
          id: "f5",
          type: "phone",
          label: "Phone",
          isActive: true,
          isRequired: false,
        },
        {
          id: "f6",
          type: "select",
          label: "Select",
          isActive: true,
          isRequired: false,
        },
        {
          id: "f7",
          type: "checkbox",
          label: "Checkbox",
          isActive: true,
          isRequired: false,
        },
        {
          id: "f8",
          type: "date",
          label: "Date",
          isActive: true,
          isRequired: false,
        },
        {
          id: "f9",
          type: "file",
          label: "File",
          isActive: true,
          isRequired: false,
        },
      ];

      (mockCustomFieldRepository.findByCompanyId as any).mockResolvedValueOnce(
        allTypeFields.map((f) => ({
          ...f,
          companyId: "company-123",
          options: null,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([]);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields).toHaveLength(9);
      expect(result.fields.map((f) => f.type)).toEqual([
        "text",
        "textarea",
        "number",
        "email",
        "phone",
        "select",
        "checkbox",
        "date",
        "file",
      ]);
    });

    test("deve retornar campo select com options", async () => {
      (mockCustomFieldRepository.findByCompanyId as any).mockResolvedValueOnce([
        {
          id: "field-select",
          label: "Estado",
          type: "select",
          options: ["SP", "RJ", "MG"],
          isActive: true,
          isRequired: false,
          companyId: "company-123",
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([
        { fieldId: "field-select", value: "SP" },
      ]);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields[0].options).toEqual(["SP", "RJ", "MG"]);
      expect(result.fields[0].value).toBe("SP");
    });
  });

  describe("Casos Extremos", () => {
    test("deve funcionar quando não há campos na empresa", async () => {
      (mockCustomFieldRepository.findByCompanyId as any).mockResolvedValueOnce([]);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.user).toBeDefined();
      expect(result.fields).toHaveLength(0);
    });

    test("deve funcionar quando usuário alvo não tem respostas", async () => {
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([]);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields).toHaveLength(2);
      expect(result.fields.every((f) => f.value === null)).toBe(true);
    });

    test("deve funcionar quando currentUser visualiza seus próprios campos", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockCurrentUser,
        avatarUrl: null,
      });

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "current-user-123",
      });

      expect(result.user.id).toBe("current-user-123");
      expect(result.fields).toBeDefined();
    });

    test("deve funcionar com grande quantidade de campos", async () => {
      const manyFields = Array.from({ length: 50 }, (_, i) => ({
        id: `field-${i}`,
        label: `Campo ${i}`,
        type: "text",
        isActive: true,
        isRequired: false,
        companyId: "company-123",
        options: null,
        order: i,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      (mockCustomFieldRepository.findByCompanyId as any).mockResolvedValueOnce(manyFields);
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([]);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields).toHaveLength(50);
    });

    test("deve preservar valores vazios como string vazia", async () => {
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([
        { fieldId: "field-1", value: "" },
      ]);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields[0].value).toBe("");
    });

    test("deve preservar valores null", async () => {
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([
        { fieldId: "field-1", value: null },
      ]);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.fields[0].value).toBeNull();
    });
  });

  describe("Integração Completa", () => {
    test("deve executar fluxo completo: buscar target -> validar empresa -> buscar subscription -> verificar feature -> buscar campos -> buscar respostas -> mesclar", async () => {
      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(mockUserRepository.findById).toHaveBeenCalledWith("target-user-123");
      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith(
        "current-user-123",
      );
      expect(mockPlanFeatureRepository.planHasFeature).toHaveBeenCalledWith(
        "premium",
        PLAN_FEATURES.CUSTOM_FIELDS,
      );
      expect(mockCustomFieldRepository.findByCompanyId).toHaveBeenCalledWith("company-123");
      expect(mockCustomFieldResponseRepository.findByUserId).toHaveBeenCalledWith(
        "target-user-123",
      );
      expect(result.user).toBeDefined();
      expect(result.fields).toHaveLength(2);
    });

    test("deve executar fluxo com fallback para owner subscription", async () => {
      const userCreatedByOwner = { ...mockCurrentUser, createdBy: "owner-123" };
      (mockSubscriptionRepository.findCurrentByUserId as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockSubscription);

      (mockUserRepository.findById as any).mockImplementation((id: string) => {
        if (id === "target-user-123") return Promise.resolve(mockTargetUser);
        if (id === "owner-123")
          return Promise.resolve({ id: "owner-123", companyId: "company-123" });
        return Promise.resolve(null);
      });

      const result = await useCase.execute({
        currentUser: userCreatedByOwner,
        targetUserId: "target-user-123",
      });

      expect(mockUserRepository.findById).toHaveBeenCalledWith("owner-123");
      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledTimes(2);
      expect(result.fields).toHaveLength(2);
    });

    test("deve interromper fluxo quando target não existe", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          currentUser: mockCurrentUser,
          targetUserId: "invalid-id",
        }),
      ).rejects.toThrow(ForbiddenError);

      expect(mockCustomFieldRepository.findByCompanyId).not.toHaveBeenCalled();
    });

    test("deve retornar userInfo mas não campos quando currentUser não tem companyId", async () => {
      const userNoCompany = { ...mockCurrentUser, companyId: null };

      const result = await useCase.execute({
        currentUser: userNoCompany,
        targetUserId: "target-user-123",
      });

      expect(result.user).toBeDefined();
      expect(result.fields).toHaveLength(0);
      expect(mockSubscriptionRepository.findCurrentByUserId).not.toHaveBeenCalled();
    });

    test("deve retornar userInfo mas não campos quando não tem feature", async () => {
      (mockPlanFeatureRepository.planHasFeature as any).mockResolvedValueOnce(false);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.user).toBeDefined();
      expect(result.fields).toHaveLength(0);
      expect(mockCustomFieldRepository.findByCompanyId).not.toHaveBeenCalled();
    });
  });

  describe("Mensagens de Erro", () => {
    test("deve retornar mensagem específica quando target não existe", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce(null);

      try {
        await useCase.execute({
          currentUser: mockCurrentUser,
          targetUserId: "invalid-id",
        });
      } catch (error) {
        expect((error as Error).message).toBe("Usuário alvo não encontrado");
      }
    });

    test("deve retornar mensagem específica quando target está em outra empresa", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        companyId: "other-company",
      });

      try {
        await useCase.execute({
          currentUser: mockCurrentUser,
          targetUserId: "target-user-123",
        });
      } catch (error) {
        expect((error as Error).message).toBe(
          "Você não tem permissão para visualizar este usuário",
        );
      }
    });
  });

  describe("Retorno de Dados", () => {
    test("deve sempre retornar estrutura com user e fields", async () => {
      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("fields");
      expect(Array.isArray(result.fields)).toBe(true);
    });

    test("deve retornar userInfo mesmo quando não há feature", async () => {
      (mockPlanFeatureRepository.planHasFeature as any).mockResolvedValueOnce(false);

      const result = await useCase.execute({
        currentUser: mockCurrentUser,
        targetUserId: "target-user-123",
      });

      expect(result.user).toEqual({
        id: "target-user-123",
        name: "Target User",
        email: "target@test.com",
        avatarUrl: "https://example.com/avatar.jpg",
      });
      expect(result.fields).toHaveLength(0);
    });
  });
});
