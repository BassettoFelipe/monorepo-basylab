import { beforeEach, describe, expect, mock, test } from "bun:test";
import { BadRequestError, ForbiddenError, PlanLimitExceededError } from "@basylab/core/errors";
import type { Company } from "@/db/schema/companies";
import { FIELD_TYPES } from "@/db/schema/custom-fields";
import type { Plan } from "@/db/schema/plans";
import type { Subscription } from "@/db/schema/subscriptions";
import type { User } from "@/db/schema/users";
import type { IPlanFeatureRepository } from "@/repositories/contracts/plan-feature.repository";
import {
  InMemoryCompanyRepository,
  InMemoryCustomFieldRepository,
  InMemoryPlanRepository,
  InMemorySubscriptionRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { PLAN_FEATURES } from "@/types/features";
import { USER_ROLES } from "@/types/roles";
import { CreateCustomFieldUseCase } from "./create-custom-field.use-case";

describe("CreateCustomFieldUseCase", () => {
  let useCase: CreateCustomFieldUseCase;
  let customFieldRepository: InMemoryCustomFieldRepository;
  let subscriptionRepository: InMemorySubscriptionRepository;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;
  let planRepository: InMemoryPlanRepository;
  let mockPlanFeatureRepository: IPlanFeatureRepository;

  let ownerUser: User;
  let managerUser: User;
  let brokerUser: User;
  let company: Company;
  let housePlan: Plan;
  let basicPlan: Plan;
  let activeSubscription: Subscription;

  beforeEach(async () => {
    // Setup repositories
    customFieldRepository = new InMemoryCustomFieldRepository();
    subscriptionRepository = new InMemorySubscriptionRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();
    planRepository = new InMemoryPlanRepository();

    // Link plan repository to subscription repository
    subscriptionRepository.setPlanRepository(planRepository);

    // Create mock feature service
    mockPlanFeatureRepository = {
      planHasFeature: mock(() => Promise.resolve(true)),
      getPlanFeatures: mock(() => Promise.resolve([])),
      getPlansWithFeature: mock(() => Promise.resolve([])),
    };

    useCase = new CreateCustomFieldUseCase(
      customFieldRepository,
      subscriptionRepository,
      mockPlanFeatureRepository,
    );

    // Create plans
    housePlan = await planRepository.create({
      name: "Plano House",
      slug: "house",
      price: 99990,
      durationDays: 30,
      maxUsers: 20,
      maxManagers: 5,
      maxSerasaQueries: 100,
      features: ["custom_fields"],
    });

    basicPlan = await planRepository.create({
      name: "Plano Básico",
      slug: "basico",
      price: 9990,
      durationDays: 30,
      maxUsers: 1,
      maxSerasaQueries: 100,
      features: [],
    });

    // Create company
    company = await companyRepository.create({
      name: "Imobiliária Teste",
      cnpj: "12345678901234",
    });

    // Create owner user with company
    ownerUser = await userRepository.create({
      name: "Owner User",
      email: "owner@test.com",
      password: "hashed_password",
      role: USER_ROLES.OWNER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    // Create manager user
    managerUser = await userRepository.create({
      name: "Manager User",
      email: "manager@test.com",
      password: "hashed_password",
      role: USER_ROLES.MANAGER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    // Create broker user
    brokerUser = await userRepository.create({
      name: "Broker User",
      email: "broker@test.com",
      password: "hashed_password",
      role: USER_ROLES.BROKER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    // Create active subscription with House plan
    activeSubscription = await subscriptionRepository.create({
      userId: ownerUser.id,
      planId: housePlan.id,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  });

  describe("Casos de Sucesso", () => {
    test("deve criar um campo customizado do tipo TEXT com sucesso", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        label: "Campo de Teste",
        type: FIELD_TYPES.TEXT,
        placeholder: "Digite aqui",
        helpText: "Texto de ajuda",
        isRequired: true,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.companyId).toBe(company.id);
      expect(result.label).toBe("Campo de Teste");
      expect(result.type).toBe(FIELD_TYPES.TEXT);
      expect(result.placeholder).toBe("Digite aqui");
      expect(result.helpText).toBe("Texto de ajuda");
      expect(result.isRequired).toBe(true);
      expect(result.order).toBe(0);
      expect(result.isActive).toBe(true);
    });

    test("deve criar um campo do tipo SELECT com opções", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        label: "Estado Civil",
        type: FIELD_TYPES.SELECT,
        options: ["Solteiro", "Casado", "Divorciado", "Viúvo"],
        allowMultiple: false,
        isRequired: true,
      });

      expect(result.type).toBe(FIELD_TYPES.SELECT);
      expect(result.options).toEqual(["Solteiro", "Casado", "Divorciado", "Viúvo"]);
      expect(result.allowMultiple).toBe(false);
    });

    test("deve criar um campo do tipo FILE com configuração", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        label: "Documento RG",
        type: FIELD_TYPES.FILE,
        fileConfig: {
          maxFileSize: 5,
          maxFiles: 2,
          allowedTypes: ["image/*", "application/pdf"],
        },
        isRequired: true,
      });

      expect(result.type).toBe(FIELD_TYPES.FILE);
      expect(result.fileConfig).toEqual({
        maxFileSize: 5,
        maxFiles: 2,
        allowedTypes: ["image/*", "application/pdf"],
      });
    });

    test("deve aplicar configuração padrão para campos FILE sem fileConfig", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        label: "Documento",
        type: FIELD_TYPES.FILE,
        fileConfig: {
          allowedTypes: ["image/*"],
        },
      });

      expect(result.fileConfig).toEqual({
        maxFileSize: 5,
        maxFiles: 1,
        allowedTypes: ["image/*"],
      });
    });

    test("deve criar campos com ordem sequencial correta", async () => {
      const field1 = await useCase.execute({
        user: ownerUser,
        label: "Campo 1",
        type: FIELD_TYPES.TEXT,
      });

      const field2 = await useCase.execute({
        user: ownerUser,
        label: "Campo 2",
        type: FIELD_TYPES.TEXT,
      });

      const field3 = await useCase.execute({
        user: ownerUser,
        label: "Campo 3",
        type: FIELD_TYPES.TEXT,
      });

      expect(field1.order).toBe(0);
      expect(field2.order).toBe(1);
      expect(field3.order).toBe(2);
    });

    test("deve criar campos de diferentes tipos", async () => {
      const textField = await useCase.execute({
        user: ownerUser,
        label: "Texto",
        type: FIELD_TYPES.TEXT,
      });

      const numberField = await useCase.execute({
        user: ownerUser,
        label: "Número",
        type: FIELD_TYPES.NUMBER,
        validation: { min: 0, max: 100 },
      });

      const dateField = await useCase.execute({
        user: ownerUser,
        label: "Data",
        type: FIELD_TYPES.DATE,
      });

      const emailField = await useCase.execute({
        user: ownerUser,
        label: "Email",
        type: FIELD_TYPES.EMAIL,
      });

      expect(textField.type).toBe(FIELD_TYPES.TEXT);
      expect(numberField.type).toBe(FIELD_TYPES.NUMBER);
      expect(numberField.validation).toEqual({ min: 0, max: 100 });
      expect(dateField.type).toBe(FIELD_TYPES.DATE);
      expect(emailField.type).toBe(FIELD_TYPES.EMAIL);
    });

    test("deve fazer trim do label, placeholder e helpText", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        label: "  Campo com espaços  ",
        type: FIELD_TYPES.TEXT,
        placeholder: "  Placeholder com espaços  ",
        helpText: "  Help com espaços  ",
      });

      expect(result.label).toBe("Campo com espaços");
      expect(result.placeholder).toBe("Placeholder com espaços");
      expect(result.helpText).toBe("Help com espaços");
    });
  });

  describe("Validações de Erro", () => {
    test("deve lançar erro se o usuário não for OWNER", async () => {
      await expect(
        useCase.execute({
          user: managerUser,
          label: "Campo Teste",
          type: FIELD_TYPES.TEXT,
        }),
      ).rejects.toThrow(
        new ForbiddenError("Apenas o proprietário pode criar campos personalizados."),
      );

      await expect(
        useCase.execute({
          user: brokerUser,
          label: "Campo Teste",
          type: FIELD_TYPES.TEXT,
        }),
      ).rejects.toThrow(
        new ForbiddenError("Apenas o proprietário pode criar campos personalizados."),
      );
    });

    test("deve lançar erro se o usuário não tem empresa vinculada", async () => {
      const userWithoutCompany = await userRepository.create({
        name: "User Without Company",
        email: "nocompany@test.com",
        password: "password",
        role: USER_ROLES.OWNER,
        companyId: null,
      });

      await expect(
        useCase.execute({
          user: userWithoutCompany,
          label: "Campo Teste",
          type: FIELD_TYPES.TEXT,
        }),
      ).rejects.toThrow(new BadRequestError("Usuário sem empresa vinculada."));
    });

    test("deve lançar erro se a assinatura não existe", async () => {
      const userWithoutSubscription = await userRepository.create({
        name: "User Without Subscription",
        email: "nosub@test.com",
        password: "password",
        role: USER_ROLES.OWNER,
        companyId: company.id,
      });

      await expect(
        useCase.execute({
          user: userWithoutSubscription,
          label: "Campo Teste",
          type: FIELD_TYPES.TEXT,
        }),
      ).rejects.toThrow(
        new ForbiddenError(
          "Assinatura inativa. Renove sua assinatura para usar esta funcionalidade.",
        ),
      );
    });

    test("deve lançar erro se a assinatura não está ativa", async () => {
      await subscriptionRepository.update(activeSubscription.id, {
        status: "expired",
      });

      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Campo Teste",
          type: FIELD_TYPES.TEXT,
        }),
      ).rejects.toThrow(
        new ForbiddenError(
          "Assinatura inativa. Renove sua assinatura para usar esta funcionalidade.",
        ),
      );
    });

    test("deve lançar erro se o plano não tem a feature custom_fields", async () => {
      // Update to basic plan without custom fields feature
      await subscriptionRepository.update(activeSubscription.id, {
        planId: basicPlan.id,
      });

      // Mock feature service to return false
      mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(false));

      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Campo Teste",
          type: FIELD_TYPES.TEXT,
        }),
      ).rejects.toThrow(
        new PlanLimitExceededError(
          "Seu plano não permite campos personalizados. Faça upgrade para o plano House para ter acesso a esta funcionalidade.",
        ),
      );

      // Verify feature service was called correctly
      expect(mockPlanFeatureRepository.planHasFeature).toHaveBeenCalledWith(
        "basico",
        PLAN_FEATURES.CUSTOM_FIELDS,
      );
    });

    test("deve lançar erro para tipo de campo inválido", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Campo Teste",
          type: "invalid_type" as any,
        }),
      ).rejects.toThrow(
        new BadRequestError(
          `Tipo de campo inválido. Tipos válidos: ${Object.values(FIELD_TYPES).join(", ")}`,
        ),
      );
    });

    test("deve lançar erro se campo SELECT não tem opções", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Estado Civil",
          type: FIELD_TYPES.SELECT,
        }),
      ).rejects.toThrow(
        new BadRequestError("Campos do tipo seleção devem ter pelo menos 2 opções."),
      );
    });

    test("deve lançar erro se campo SELECT tem menos de 2 opções", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Estado Civil",
          type: FIELD_TYPES.SELECT,
          options: ["Solteiro"],
        }),
      ).rejects.toThrow(
        new BadRequestError("Campos do tipo seleção devem ter pelo menos 2 opções."),
      );
    });

    test("deve lançar erro se campo SELECT tem opções duplicadas (case insensitive)", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Estado Civil",
          type: FIELD_TYPES.SELECT,
          options: ["Solteiro", "solteiro", "Casado"],
        }),
      ).rejects.toThrow(new BadRequestError("Não é permitido ter opções duplicadas."));

      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Estado Civil",
          type: FIELD_TYPES.SELECT,
          options: ["Solteiro", "Casado", "SOLTEIRO"],
        }),
      ).rejects.toThrow(new BadRequestError("Não é permitido ter opções duplicadas."));
    });

    test("deve lançar erro se campo FILE não tem tipos permitidos", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Documento",
          type: FIELD_TYPES.FILE,
          fileConfig: {
            allowedTypes: [],
          },
        }),
      ).rejects.toThrow(new BadRequestError("Selecione pelo menos um tipo de arquivo permitido."));

      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Documento",
          type: FIELD_TYPES.FILE,
          fileConfig: {},
        }),
      ).rejects.toThrow(new BadRequestError("Selecione pelo menos um tipo de arquivo permitido."));
    });

    test("deve lançar erro se maxFileSize está fora do limite (1-10 MB)", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Documento",
          type: FIELD_TYPES.FILE,
          fileConfig: {
            maxFileSize: 0,
            allowedTypes: ["image/*"],
          },
        }),
      ).rejects.toThrow(
        new BadRequestError("O tamanho máximo do arquivo deve ser entre 1 e 10 MB."),
      );

      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Documento",
          type: FIELD_TYPES.FILE,
          fileConfig: {
            maxFileSize: 11,
            allowedTypes: ["image/*"],
          },
        }),
      ).rejects.toThrow(
        new BadRequestError("O tamanho máximo do arquivo deve ser entre 1 e 10 MB."),
      );
    });

    test("deve lançar erro se maxFiles está fora do limite (1-5)", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Documento",
          type: FIELD_TYPES.FILE,
          fileConfig: {
            maxFiles: 0,
            allowedTypes: ["image/*"],
          },
        }),
      ).rejects.toThrow(
        new BadRequestError("A quantidade máxima de arquivos deve ser entre 1 e 5."),
      );

      await expect(
        useCase.execute({
          user: ownerUser,
          label: "Documento",
          type: FIELD_TYPES.FILE,
          fileConfig: {
            maxFiles: 6,
            allowedTypes: ["image/*"],
          },
        }),
      ).rejects.toThrow(
        new BadRequestError("A quantidade máxima de arquivos deve ser entre 1 e 5."),
      );
    });

    test("deve lançar erro se label está vazio ou tem menos de 2 caracteres", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          label: "",
          type: FIELD_TYPES.TEXT,
        }),
      ).rejects.toThrow(new BadRequestError("O nome do campo deve ter pelo menos 2 caracteres."));

      await expect(
        useCase.execute({
          user: ownerUser,
          label: "A",
          type: FIELD_TYPES.TEXT,
        }),
      ).rejects.toThrow(new BadRequestError("O nome do campo deve ter pelo menos 2 caracteres."));

      await expect(
        useCase.execute({
          user: ownerUser,
          label: "   ",
          type: FIELD_TYPES.TEXT,
        }),
      ).rejects.toThrow(new BadRequestError("O nome do campo deve ter pelo menos 2 caracteres."));
    });
  });

  describe("Isolamento e Integridade", () => {
    test("deve criar campos isolados por empresa", async () => {
      // Create another company
      const company2 = await companyRepository.create({
        name: "Imobiliária 2",
        cnpj: "98765432109876",
      });

      const owner2 = await userRepository.create({
        name: "Owner 2",
        email: "owner2@test.com",
        password: "password",
        role: USER_ROLES.OWNER,
        companyId: company2.id,
      });

      await subscriptionRepository.create({
        userId: owner2.id,
        planId: housePlan.id,
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Create fields for both companies
      const field1 = await useCase.execute({
        user: ownerUser,
        label: "Campo Empresa 1",
        type: FIELD_TYPES.TEXT,
      });

      const field2 = await useCase.execute({
        user: owner2,
        label: "Campo Empresa 2",
        type: FIELD_TYPES.TEXT,
      });

      expect(field1.companyId).toBe(company.id);
      expect(field2.companyId).toBe(company2.id);

      // Verify orders are independent
      expect(field1.order).toBe(0);
      expect(field2.order).toBe(0);
    });

    test("deve verificar chamada ao featureService com plano correto", async () => {
      mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(true));

      await useCase.execute({
        user: ownerUser,
        label: "Campo Teste",
        type: FIELD_TYPES.TEXT,
      });

      expect(mockPlanFeatureRepository.planHasFeature).toHaveBeenCalledWith(
        housePlan.slug,
        PLAN_FEATURES.CUSTOM_FIELDS,
      );
    });
  });
});
