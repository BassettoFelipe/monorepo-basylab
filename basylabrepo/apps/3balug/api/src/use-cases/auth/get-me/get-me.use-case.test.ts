import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Company } from "@/db/schema/companies";
import { FIELD_TYPES } from "@/db/schema/custom-fields";
import type { Plan } from "@/db/schema/plans";
import type { Subscription } from "@/db/schema/subscriptions";
import type { User } from "@/db/schema/users";
import type { IPlanFeatureRepository } from "@/repositories/contracts/plan-feature.repository";
import {
  InMemoryCompanyRepository,
  InMemoryCustomFieldRepository,
  InMemoryCustomFieldResponseRepository,
  InMemoryPlanRepository,
  InMemorySubscriptionRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { GetMeUseCase } from "./get-me.use-case";

describe("GetMeUseCase", () => {
  let useCase: GetMeUseCase;
  let userRepository: InMemoryUserRepository;
  let subscriptionRepository: InMemorySubscriptionRepository;
  let customFieldRepository: InMemoryCustomFieldRepository;
  let customFieldResponseRepository: InMemoryCustomFieldResponseRepository;
  let planRepository: InMemoryPlanRepository;
  let companyRepository: InMemoryCompanyRepository;
  let mockPlanFeatureRepository: IPlanFeatureRepository;

  let company: Company;
  let housePlan: Plan;
  let basicPlan: Plan;
  let ownerUser: User;
  let brokerUser: User;
  let activeSubscription: Subscription;

  beforeEach(async () => {
    // Setup repositories
    userRepository = new InMemoryUserRepository();
    subscriptionRepository = new InMemorySubscriptionRepository();
    customFieldRepository = new InMemoryCustomFieldRepository();
    customFieldResponseRepository = new InMemoryCustomFieldResponseRepository();
    planRepository = new InMemoryPlanRepository();
    companyRepository = new InMemoryCompanyRepository();

    // Link repositories
    subscriptionRepository.setPlanRepository(planRepository);

    // Create mock plan feature repository
    mockPlanFeatureRepository = {
      planHasFeature: mock(() => Promise.resolve(true)),
      getPlanFeatures: mock(() => Promise.resolve([])),
      getPlansWithFeature: mock(() => Promise.resolve([])),
    };

    useCase = new GetMeUseCase(
      userRepository,
      subscriptionRepository,
      customFieldRepository,
      customFieldResponseRepository,
      mockPlanFeatureRepository,
    );

    // Create test data
    company = await companyRepository.create({
      name: "Imobiliária Teste",
      cnpj: "12345678901234",
    });

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

    ownerUser = await userRepository.create({
      name: "Owner User",
      email: "owner@test.com",
      password: "hashed_password",
      role: USER_ROLES.OWNER,
      companyId: company.id,
      phone: "+5511999999999",
      avatarUrl: "https://example.com/avatar.jpg",
      isActive: true,
      isEmailVerified: true,
    });

    activeSubscription = await subscriptionRepository.create({
      userId: ownerUser.id,
      planId: housePlan.id,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  });

  describe("Casos de Sucesso", () => {
    test("deve retornar dados completos do usuário owner com assinatura ativa", async () => {
      const subscription = await subscriptionRepository.findCurrentByUserId(ownerUser.id);

      const result = await useCase.execute({
        user: ownerUser,
        subscription,
      });

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.name).toBe("Owner User");
      expect(result.user.email).toBe("owner@test.com");
      expect(result.user.role).toBe(USER_ROLES.OWNER);
      expect(result.user.phone).toBe("+5511999999999");
      expect(result.user.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(result.user.isActive).toBe(true);
      expect(result.user.isEmailVerified).toBe(true);
      expect(result.user.hasPendingCustomFields).toBe(false);
      expect(result.user.subscription).toBeDefined();
      expect(result.user.subscription?.status).toBe("active");
      expect(result.user.subscription?.plan.name).toBe("Plano House");
      expect(result.user.subscription?.plan.price).toBe(99990);
    });

    test("deve retornar dados do usuário sem campos opcionais (phone e avatarUrl)", async () => {
      const userWithoutOptionals = await userRepository.create({
        name: "User Without Optionals",
        email: "nooptionals@test.com",
        password: "hashed_password",
        role: USER_ROLES.MANAGER,
        companyId: company.id,
        phone: null,
        avatarUrl: null,
        isActive: true,
        isEmailVerified: true,
      });

      const result = await useCase.execute({
        user: userWithoutOptionals,
        subscription: null,
      });

      expect(result.user.phone).toBe(null);
      expect(result.user.avatarUrl).toBe(null);
      expect(result.user.subscription).toBe(null);
    });

    test("deve retornar subscription null para usuário sem assinatura", async () => {
      const userWithoutSubscription = await userRepository.create({
        name: "User Without Sub",
        email: "nosub@test.com",
        password: "hashed_password",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const result = await useCase.execute({
        user: userWithoutSubscription,
        subscription: null,
      });

      expect(result.user.subscription).toBe(null);
    });

    test("deve buscar assinatura do owner quando usuário foi criado por outro", async () => {
      brokerUser = await userRepository.create({
        name: "Broker User",
        email: "broker@test.com",
        password: "hashed_password",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        createdBy: ownerUser.id,
        isActive: true,
        isEmailVerified: false,
      });

      const result = await useCase.execute({
        user: brokerUser,
        subscription: null,
      });

      expect(result.user.subscription).toBeDefined();
      expect(result.user.subscription?.plan.name).toBe("Plano House");
      expect(result.user.subscription?.status).toBe("active");
    });

    test("deve retornar isEmailVerified false para usuário não verificado", async () => {
      const unverifiedUser = await userRepository.create({
        name: "Unverified User",
        email: "unverified@test.com",
        password: "hashed_password",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        isActive: true,
        isEmailVerified: false,
      });

      const result = await useCase.execute({
        user: unverifiedUser,
        subscription: null,
      });

      expect(result.user.isEmailVerified).toBe(false);
    });

    test("deve retornar isActive false para usuário inativo", async () => {
      const inactiveUser = await userRepository.create({
        name: "Inactive User",
        email: "inactive@test.com",
        password: "hashed_password",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        isActive: false,
        isEmailVerified: true,
      });

      const result = await useCase.execute({
        user: inactiveUser,
        subscription: null,
      });

      expect(result.user.isActive).toBe(false);
    });
  });

  describe("Custom Fields Pendentes", () => {
    test("deve retornar hasPendingCustomFields false quando não há custom fields", async () => {
      brokerUser = await userRepository.create({
        name: "Broker User",
        email: "broker@test.com",
        password: "hashed_password",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        createdBy: ownerUser.id,
        isActive: true,
        isEmailVerified: true,
      });

      const subscription = await subscriptionRepository.findCurrentByUserId(ownerUser.id);

      const result = await useCase.execute({
        user: brokerUser,
        subscription,
      });

      expect(result.user.hasPendingCustomFields).toBe(false);
    });

    test("deve retornar hasPendingCustomFields true quando há campos obrigatórios sem resposta", async () => {
      brokerUser = await userRepository.create({
        name: "Broker User",
        email: "broker@test.com",
        password: "hashed_password",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        createdBy: ownerUser.id,
        isActive: true,
        isEmailVerified: true,
      });

      // Create required custom field
      await customFieldRepository.create({
        companyId: company.id,
        label: "CPF",
        type: FIELD_TYPES.TEXT,
        isRequired: true,
        isActive: true,
        order: 0,
      });

      const subscription = await subscriptionRepository.findCurrentByUserId(ownerUser.id);

      const result = await useCase.execute({
        user: brokerUser,
        subscription,
      });

      expect(result.user.hasPendingCustomFields).toBe(true);
    });

    test("deve retornar hasPendingCustomFields false quando campos obrigatórios têm resposta", async () => {
      brokerUser = await userRepository.create({
        name: "Broker User",
        email: "broker@test.com",
        password: "hashed_password",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        createdBy: ownerUser.id,
        isActive: true,
        isEmailVerified: true,
      });

      const field = await customFieldRepository.create({
        companyId: company.id,
        label: "CPF",
        type: FIELD_TYPES.TEXT,
        isRequired: true,
        isActive: true,
        order: 0,
      });

      // Create response
      await customFieldResponseRepository.create({
        userId: brokerUser.id,
        fieldId: field.id,
        value: "123.456.789-00",
      });

      const subscription = await subscriptionRepository.findCurrentByUserId(ownerUser.id);

      const result = await useCase.execute({
        user: brokerUser,
        subscription,
      });

      expect(result.user.hasPendingCustomFields).toBe(false);
    });

    test("deve retornar hasPendingCustomFields true quando resposta está vazia", async () => {
      brokerUser = await userRepository.create({
        name: "Broker User",
        email: "broker@test.com",
        password: "hashed_password",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        createdBy: ownerUser.id,
        isActive: true,
        isEmailVerified: true,
      });

      const field = await customFieldRepository.create({
        companyId: company.id,
        label: "CPF",
        type: FIELD_TYPES.TEXT,
        isRequired: true,
        isActive: true,
        order: 0,
      });

      // Create empty response
      await customFieldResponseRepository.create({
        userId: brokerUser.id,
        fieldId: field.id,
        value: "   ",
      });

      const subscription = await subscriptionRepository.findCurrentByUserId(ownerUser.id);

      const result = await useCase.execute({
        user: brokerUser,
        subscription,
      });

      expect(result.user.hasPendingCustomFields).toBe(true);
    });

    test("deve retornar hasPendingCustomFields false quando plano não tem feature custom_fields", async () => {
      // Update subscription to basic plan (without custom_fields)
      await subscriptionRepository.update(activeSubscription.id, {
        planId: basicPlan.id,
      });

      brokerUser = await userRepository.create({
        name: "Broker User",
        email: "broker@test.com",
        password: "hashed_password",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        createdBy: ownerUser.id,
        isActive: true,
        isEmailVerified: true,
      });

      await customFieldRepository.create({
        companyId: company.id,
        label: "CPF",
        type: FIELD_TYPES.TEXT,
        isRequired: true,
        isActive: true,
        order: 0,
      });

      mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(false));

      const subscription = await subscriptionRepository.findCurrentByUserId(ownerUser.id);

      const result = await useCase.execute({
        user: brokerUser,
        subscription,
      });

      expect(result.user.hasPendingCustomFields).toBe(false);
    });

    test("deve retornar hasPendingCustomFields false quando usuário não tem createdBy", async () => {
      const subscription = await subscriptionRepository.findCurrentByUserId(ownerUser.id);

      const result = await useCase.execute({
        user: ownerUser,
        subscription,
      });

      expect(result.user.hasPendingCustomFields).toBe(false);
    });

    test("deve ignorar campos inativos ao verificar pending custom fields", async () => {
      brokerUser = await userRepository.create({
        name: "Broker User",
        email: "broker@test.com",
        password: "hashed_password",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        createdBy: ownerUser.id,
        isActive: true,
        isEmailVerified: true,
      });

      // Create inactive required field
      await customFieldRepository.create({
        companyId: company.id,
        label: "CPF",
        type: FIELD_TYPES.TEXT,
        isRequired: true,
        isActive: false,
        order: 0,
      });

      const subscription = await subscriptionRepository.findCurrentByUserId(ownerUser.id);

      const result = await useCase.execute({
        user: brokerUser,
        subscription,
      });

      expect(result.user.hasPendingCustomFields).toBe(false);
    });

    test("deve retornar hasPendingCustomFields true quando usuário não tem nenhuma resposta", async () => {
      brokerUser = await userRepository.create({
        name: "Broker User",
        email: "broker@test.com",
        password: "hashed_password",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        createdBy: ownerUser.id,
        isActive: true,
        isEmailVerified: true,
      });

      // Create non-required field (still expects at least one response)
      await customFieldRepository.create({
        companyId: company.id,
        label: "Observações",
        type: FIELD_TYPES.TEXTAREA,
        isRequired: false,
        isActive: true,
        order: 0,
      });

      const subscription = await subscriptionRepository.findCurrentByUserId(ownerUser.id);

      const result = await useCase.execute({
        user: brokerUser,
        subscription,
      });

      expect(result.user.hasPendingCustomFields).toBe(true);
    });
  });

  describe("Subscription Info", () => {
    test("deve incluir daysRemaining e status corretos da assinatura", async () => {
      const subscription = await subscriptionRepository.findCurrentByUserId(ownerUser.id);

      const result = await useCase.execute({
        user: ownerUser,
        subscription,
      });

      expect(result.user.subscription?.daysRemaining).toBeDefined();
      expect(result.user.subscription?.status).toBe("active");
      expect(result.user.subscription?.startDate).toBeInstanceOf(Date);
      expect(result.user.subscription?.endDate).toBeInstanceOf(Date);
    });

    test("deve retornar subscription null quando não encontra owner subscription", async () => {
      const userWithDeletedOwner = await userRepository.create({
        name: "Orphan User",
        email: "orphan@test.com",
        password: "hashed_password",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        createdBy: "non-existent-id",
        isActive: true,
        isEmailVerified: true,
      });

      const result = await useCase.execute({
        user: userWithDeletedOwner,
        subscription: null,
      });

      expect(result.user.subscription).toBe(null);
    });
  });
});
