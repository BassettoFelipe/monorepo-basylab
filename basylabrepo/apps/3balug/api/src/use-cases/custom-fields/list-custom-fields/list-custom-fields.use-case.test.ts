import { beforeEach, describe, expect, mock, test } from "bun:test";
import { BadRequestError, ForbiddenError } from "@basylab/core/errors";
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
import { ListCustomFieldsUseCase } from "./list-custom-fields.use-case";

describe("ListCustomFieldsUseCase", () => {
  let useCase: ListCustomFieldsUseCase;
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

    useCase = new ListCustomFieldsUseCase(
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

    // Create owner user
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

    // Create some custom fields
    await customFieldRepository.create({
      companyId: company.id,
      label: "Campo Ativo 1",
      type: FIELD_TYPES.TEXT,
      order: 0,
      isActive: true,
    });

    await customFieldRepository.create({
      companyId: company.id,
      label: "Campo Ativo 2",
      type: FIELD_TYPES.SELECT,
      options: ["Opção 1", "Opção 2"],
      order: 1,
      isActive: true,
    });

    await customFieldRepository.create({
      companyId: company.id,
      label: "Campo Inativo",
      type: FIELD_TYPES.TEXT,
      order: 2,
      isActive: false,
    });
  });

  describe("Casos de Sucesso", () => {
    test("deve listar apenas campos ativos por padrão (OWNER)", async () => {
      const result = await useCase.execute({
        user: ownerUser,
      });

      expect(result.hasFeature).toBe(true);
      expect(result.fields).toHaveLength(2);
      expect(result.fields[0].label).toBe("Campo Ativo 1");
      expect(result.fields[1].label).toBe("Campo Ativo 2");
      expect(result.fields[0].isActive).toBe(true);
      expect(result.fields[1].isActive).toBe(true);
    });

    test("deve listar apenas campos ativos por padrão (MANAGER)", async () => {
      // Create subscription for manager
      await subscriptionRepository.create({
        userId: managerUser.id,
        planId: housePlan.id,
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const result = await useCase.execute({
        user: managerUser,
      });

      expect(result.hasFeature).toBe(true);
      expect(result.fields).toHaveLength(2);
    });

    test("deve listar todos os campos incluindo inativos quando solicitado", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        includeInactive: true,
      });

      expect(result.hasFeature).toBe(true);
      expect(result.fields).toHaveLength(3);
      expect(result.fields[2].label).toBe("Campo Inativo");
      expect(result.fields[2].isActive).toBe(false);
    });

    test("deve retornar campos ordenados por order", async () => {
      const result = await useCase.execute({
        user: ownerUser,
      });

      expect(result.fields[0].order).toBe(0);
      expect(result.fields[1].order).toBe(1);
      expect(result.fields[0].order).toBeLessThan(result.fields[1].order);
    });

    test("deve retornar lista vazia quando não há campos", async () => {
      // Clear all fields
      customFieldRepository.clear();

      const result = await useCase.execute({
        user: ownerUser,
      });

      expect(result.hasFeature).toBe(true);
      expect(result.fields).toHaveLength(0);
    });

    test("deve retornar lista vazia e hasFeature=false quando plano não tem a feature", async () => {
      // Update to basic plan
      await subscriptionRepository.update(activeSubscription.id, {
        planId: basicPlan.id,
      });

      // Mock feature service to return false
      mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(false));

      const result = await useCase.execute({
        user: ownerUser,
      });

      expect(result.hasFeature).toBe(false);
      expect(result.fields).toHaveLength(0);
    });

    test("deve retornar lista vazia quando usuário não tem assinatura", async () => {
      const userWithoutSubscription = await userRepository.create({
        name: "User Without Subscription",
        email: "nosub@test.com",
        password: "password",
        role: USER_ROLES.OWNER,
        companyId: company.id,
      });

      const result = await useCase.execute({
        user: userWithoutSubscription,
      });

      expect(result.hasFeature).toBe(false);
      expect(result.fields).toHaveLength(0);
    });
  });

  describe("Validações de Erro", () => {
    test("deve lançar erro se o usuário não for OWNER ou MANAGER", async () => {
      await expect(
        useCase.execute({
          user: brokerUser,
        }),
      ).rejects.toThrow(
        new ForbiddenError("Você não tem permissão para visualizar campos personalizados."),
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
        }),
      ).rejects.toThrow(new BadRequestError("Usuário sem empresa vinculada."));
    });
  });

  describe("Isolamento e Integridade", () => {
    test("deve listar apenas campos da empresa do usuário", async () => {
      // Create another company with fields
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

      await customFieldRepository.create({
        companyId: company2.id,
        label: "Campo Empresa 2",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      // Owner 1 should see only 2 fields (from company 1)
      const result1 = await useCase.execute({
        user: ownerUser,
      });

      expect(result1.fields).toHaveLength(2);
      expect(result1.fields.every((f) => f.companyId === company.id)).toBe(true);

      // Owner 2 should see only 1 field (from company 2)
      const result2 = await useCase.execute({
        user: owner2,
      });

      expect(result2.fields).toHaveLength(1);
      expect(result2.fields[0].companyId).toBe(company2.id);
      expect(result2.fields[0].label).toBe("Campo Empresa 2");
    });

    test("deve verificar chamada ao featureService com plano correto", async () => {
      mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(true));

      await useCase.execute({
        user: ownerUser,
      });

      expect(mockPlanFeatureRepository.planHasFeature).toHaveBeenCalledWith(
        housePlan.slug,
        PLAN_FEATURES.CUSTOM_FIELDS,
      );
    });
  });
});
