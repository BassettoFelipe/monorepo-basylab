import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { User } from "@/db/schema/users";
import type { ICustomFieldRepository } from "@/repositories/contracts/custom-field.repository";
import type { ICustomFieldResponseRepository } from "@/repositories/contracts/custom-field-response.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import type { IFeatureService } from "@/services/contracts/feature-service.interface";
import { PLAN_FEATURES } from "@/types/features";
import { GetMyFieldsUseCase } from "./get-my-fields.use-case";

describe("GetMyFieldsUseCase", () => {
  let useCase: GetMyFieldsUseCase;
  let mockUserRepository: IUserRepository;
  let mockSubscriptionRepository: ISubscriptionRepository;
  let mockCustomFieldRepository: ICustomFieldRepository;
  let mockCustomFieldResponseRepository: ICustomFieldResponseRepository;
  let mockFeatureService: IFeatureService;

  const mockUser: User = {
    id: "user-123",
    companyId: "company-123",
    email: "user@test.com",
    name: "Test User",
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockSubscription = {
    id: "sub-123",
    userId: "user-123",
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
      isActive: true,
      options: null,
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockResponses = [
    {
      id: "resp-1",
      userId: "user-123",
      fieldId: "field-1",
      value: "João Silva",
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
      findActiveByCompanyId: mock(() => Promise.resolve(mockFields)),
    } as any;

    mockCustomFieldResponseRepository = {
      findByUserId: mock(() => Promise.resolve(mockResponses)),
    } as any;

    mockFeatureService = {
      planHasFeature: mock(() => Promise.resolve(true)),
    } as any;

    useCase = new GetMyFieldsUseCase(
      mockUserRepository,
      mockSubscriptionRepository,
      mockCustomFieldRepository,
      mockCustomFieldResponseRepository,
      mockFeatureService,
    );
  });

  describe("Casos de Sucesso", () => {
    test("deve retornar campos com valores quando usuário tem feature", async () => {
      const result = await useCase.execute({ user: mockUser });

      expect(result.hasFeature).toBe(true);
      expect(result.fields).toHaveLength(2);
      expect(result.fields[0].id).toBe("field-1");
      expect(result.fields[0].value).toBe("João Silva");
      expect(result.fields[1].id).toBe("field-2");
      expect(result.fields[1].value).toBeNull();
    });

    test("deve retornar campo com value null quando não há resposta", async () => {
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([]);

      const result = await useCase.execute({ user: mockUser });

      expect(result.fields).toHaveLength(2);
      expect(result.fields[0].value).toBeNull();
      expect(result.fields[1].value).toBeNull();
    });

    test("deve mesclar corretamente campos e respostas", async () => {
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([
        { id: "resp-1", fieldId: "field-1", value: "Valor 1" },
        { id: "resp-2", fieldId: "field-2", value: "Valor 2" },
      ]);

      const result = await useCase.execute({ user: mockUser });

      expect(result.fields[0].value).toBe("Valor 1");
      expect(result.fields[1].value).toBe("Valor 2");
    });

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

      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce(
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

      const result = await useCase.execute({ user: mockUser });

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

    test("deve preservar todas as propriedades dos campos", async () => {
      const result = await useCase.execute({ user: mockUser });

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
  });

  describe("Validações de Empresa", () => {
    test("deve retornar vazio quando usuário não tem companyId", async () => {
      const userWithoutCompany = { ...mockUser, companyId: null };

      const result = await useCase.execute({ user: userWithoutCompany });

      expect(result.hasFeature).toBe(false);
      expect(result.fields).toHaveLength(0);
      expect(mockSubscriptionRepository.findCurrentByUserId).not.toHaveBeenCalled();
    });

    test("deve buscar campos apenas da empresa do usuário", async () => {
      await useCase.execute({ user: mockUser });

      expect(mockCustomFieldRepository.findActiveByCompanyId).toHaveBeenCalledWith("company-123");
    });

    test("deve buscar respostas apenas do usuário", async () => {
      await useCase.execute({ user: mockUser });

      expect(mockCustomFieldResponseRepository.findByUserId).toHaveBeenCalledWith("user-123");
    });
  });

  describe("Validações de Subscription", () => {
    test("deve verificar feature na subscription do usuário", async () => {
      await useCase.execute({ user: mockUser });

      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith("user-123");
      expect(mockFeatureService.planHasFeature).toHaveBeenCalledWith(
        "premium",
        PLAN_FEATURES.CUSTOM_FIELDS,
      );
    });

    test("deve retornar vazio quando plano não tem feature", async () => {
      (mockFeatureService.planHasFeature as any).mockResolvedValueOnce(false);

      const result = await useCase.execute({ user: mockUser });

      expect(result.hasFeature).toBe(false);
      expect(result.fields).toHaveLength(0);
      expect(mockCustomFieldRepository.findActiveByCompanyId).not.toHaveBeenCalled();
    });

    test("deve retornar vazio quando não há subscription", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce(null);

      const result = await useCase.execute({ user: mockUser });

      expect(result.hasFeature).toBe(false);
      expect(result.fields).toHaveLength(0);
    });

    test("deve buscar subscription do owner quando usuário não tem subscription", async () => {
      const userCreatedByOwner = { ...mockUser, createdBy: "owner-123" };
      (mockSubscriptionRepository.findCurrentByUserId as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockSubscription);

      (mockUserRepository.findById as any).mockResolvedValueOnce({
        id: "owner-123",
        companyId: "company-123",
      });

      const result = await useCase.execute({ user: userCreatedByOwner });

      expect(result.hasFeature).toBe(true);
      expect(mockUserRepository.findById).toHaveBeenCalledWith("owner-123");
      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith("owner-123");
    });

    test("deve retornar vazio quando owner também não tem subscription", async () => {
      const userCreatedByOwner = { ...mockUser, createdBy: "owner-123" };
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValue(null);
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        id: "owner-123",
        companyId: "company-123",
      });

      const result = await useCase.execute({ user: userCreatedByOwner });

      expect(result.hasFeature).toBe(false);
      expect(result.fields).toHaveLength(0);
    });

    test("deve retornar vazio quando owner não é encontrado", async () => {
      const userCreatedByOwner = { ...mockUser, createdBy: "owner-123" };
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce(null);
      (mockUserRepository.findById as any).mockResolvedValueOnce(null);

      const result = await useCase.execute({ user: userCreatedByOwner });

      expect(result.hasFeature).toBe(false);
      expect(result.fields).toHaveLength(0);
    });

    test("deve retornar vazio quando subscription não tem plan", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        id: "sub-123",
        plan: null,
      });

      const result = await useCase.execute({ user: mockUser });

      expect(result.hasFeature).toBe(false);
      expect(result.fields).toHaveLength(0);
    });

    test("deve retornar vazio quando plan não tem slug", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        id: "sub-123",
        plan: { slug: null, name: "Premium" },
      });

      const result = await useCase.execute({ user: mockUser });

      expect(result.hasFeature).toBe(false);
      expect(result.fields).toHaveLength(0);
    });
  });

  describe("Mapeamento de Valores", () => {
    test("deve retornar campos ordenados corretamente", async () => {
      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce([
        { ...mockFields[0], order: 2 },
        { ...mockFields[1], order: 1 },
      ]);

      const result = await useCase.execute({ user: mockUser });

      expect(result.fields).toHaveLength(2);
      // A ordem é preservada conforme retornada pelo repository
      expect(result.fields[0].order).toBe(2);
      expect(result.fields[1].order).toBe(1);
    });

    test("deve manter valores parcialmente preenchidos", async () => {
      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce([
        {
          id: "field-1",
          label: "F1",
          isActive: true,
          type: "text",
          companyId: "company-123",
          isRequired: false,
          options: null,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "field-2",
          label: "F2",
          isActive: true,
          type: "text",
          companyId: "company-123",
          isRequired: false,
          options: null,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "field-3",
          label: "F3",
          isActive: true,
          type: "text",
          companyId: "company-123",
          isRequired: false,
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

      const result = await useCase.execute({ user: mockUser });

      expect(result.fields[0].value).toBe("Valor 1");
      expect(result.fields[1].value).toBeNull();
      expect(result.fields[2].value).toBe("Valor 3");
    });

    test("deve ignorar respostas de campos que não existem mais", async () => {
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([
        { fieldId: "field-1", value: "Valor 1" },
        { fieldId: "field-deleted", value: "Valor deletado" },
        { fieldId: "field-2", value: "Valor 2" },
      ]);

      const result = await useCase.execute({ user: mockUser });

      expect(result.fields).toHaveLength(2);
      expect(result.fields.find((f) => f.id === "field-deleted")).toBeUndefined();
    });

    test("deve preservar valores vazios como string vazia", async () => {
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([
        { fieldId: "field-1", value: "" },
      ]);

      const result = await useCase.execute({ user: mockUser });

      expect(result.fields[0].value).toBe("");
    });

    test("deve preservar valores null", async () => {
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([
        { fieldId: "field-1", value: null },
      ]);

      const result = await useCase.execute({ user: mockUser });

      expect(result.fields[0].value).toBeNull();
    });
  });

  describe("Campos com Options", () => {
    test("deve retornar campo select com options", async () => {
      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce([
        {
          id: "field-select",
          label: "Estado Civil",
          type: "select",
          options: ["Solteiro", "Casado", "Divorciado"],
          isActive: true,
          isRequired: false,
          companyId: "company-123",
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([
        { fieldId: "field-select", value: "Casado" },
      ]);

      const result = await useCase.execute({ user: mockUser });

      expect(result.fields[0].options).toEqual(["Solteiro", "Casado", "Divorciado"]);
      expect(result.fields[0].value).toBe("Casado");
    });

    test("deve retornar null para options quando campo não é select", async () => {
      const result = await useCase.execute({ user: mockUser });

      expect(result.fields[0].options).toBeNull();
    });
  });

  describe("Casos Extremos", () => {
    test("deve retornar array vazio quando não há campos ativos", async () => {
      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce([]);

      const result = await useCase.execute({ user: mockUser });

      expect(result.hasFeature).toBe(true);
      expect(result.fields).toHaveLength(0);
    });

    test("deve funcionar quando não há respostas", async () => {
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([]);

      const result = await useCase.execute({ user: mockUser });

      expect(result.hasFeature).toBe(true);
      expect(result.fields).toHaveLength(2);
      expect(result.fields.every((f) => f.value === null)).toBe(true);
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

      (mockCustomFieldRepository.findActiveByCompanyId as any).mockResolvedValueOnce(manyFields);
      (mockCustomFieldResponseRepository.findByUserId as any).mockResolvedValueOnce([]);

      const result = await useCase.execute({ user: mockUser });

      expect(result.fields).toHaveLength(50);
    });
  });

  describe("Integração Completa", () => {
    test("deve executar fluxo completo: verificar empresa -> buscar subscription -> verificar feature -> buscar campos -> buscar respostas -> mesclar", async () => {
      const result = await useCase.execute({ user: mockUser });

      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledWith("user-123");
      expect(mockFeatureService.planHasFeature).toHaveBeenCalledWith(
        "premium",
        PLAN_FEATURES.CUSTOM_FIELDS,
      );
      expect(mockCustomFieldRepository.findActiveByCompanyId).toHaveBeenCalledWith("company-123");
      expect(mockCustomFieldResponseRepository.findByUserId).toHaveBeenCalledWith("user-123");
      expect(result.hasFeature).toBe(true);
      expect(result.fields).toHaveLength(2);
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

      const result = await useCase.execute({ user: userCreatedByOwner });

      expect(mockUserRepository.findById).toHaveBeenCalledWith("owner-123");
      expect(mockSubscriptionRepository.findCurrentByUserId).toHaveBeenCalledTimes(2);
      expect(result.hasFeature).toBe(true);
    });

    test("deve interromper fluxo quando não tem companyId", async () => {
      const userWithoutCompany = { ...mockUser, companyId: null };

      const result = await useCase.execute({ user: userWithoutCompany });

      expect(mockSubscriptionRepository.findCurrentByUserId).not.toHaveBeenCalled();
      expect(mockCustomFieldRepository.findActiveByCompanyId).not.toHaveBeenCalled();
      expect(result.hasFeature).toBe(false);
    });

    test("deve interromper fluxo quando não tem feature", async () => {
      (mockFeatureService.planHasFeature as any).mockResolvedValueOnce(false);

      const result = await useCase.execute({ user: mockUser });

      expect(mockCustomFieldRepository.findActiveByCompanyId).not.toHaveBeenCalled();
      expect(mockCustomFieldResponseRepository.findByUserId).not.toHaveBeenCalled();
      expect(result.hasFeature).toBe(false);
    });
  });

  describe("Validações de Planos", () => {
    test("deve funcionar com plano premium", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        plan: { slug: "premium" },
      });

      const result = await useCase.execute({ user: mockUser });

      expect(result.hasFeature).toBe(true);
    });

    test("deve funcionar com plano business", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        plan: { slug: "business" },
      });
      (mockFeatureService.planHasFeature as any).mockResolvedValueOnce(true);

      const result = await useCase.execute({ user: mockUser });

      expect(result.hasFeature).toBe(true);
    });

    test("deve falhar com plano básico sem feature", async () => {
      (mockSubscriptionRepository.findCurrentByUserId as any).mockResolvedValueOnce({
        plan: { slug: "basic" },
      });
      (mockFeatureService.planHasFeature as any).mockResolvedValueOnce(false);

      const result = await useCase.execute({ user: mockUser });

      expect(result.hasFeature).toBe(false);
      expect(result.fields).toHaveLength(0);
    });
  });

  describe("Retorno de Dados", () => {
    test("deve retornar estrutura correta com hasFeature true", async () => {
      const result = await useCase.execute({ user: mockUser });

      expect(result).toHaveProperty("fields");
      expect(result).toHaveProperty("hasFeature");
      expect(result.hasFeature).toBe(true);
      expect(Array.isArray(result.fields)).toBe(true);
    });

    test("deve retornar estrutura correta com hasFeature false", async () => {
      (mockFeatureService.planHasFeature as any).mockResolvedValueOnce(false);

      const result = await useCase.execute({ user: mockUser });

      expect(result).toEqual({
        fields: [],
        hasFeature: false,
      });
    });
  });
});
