import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { USER_ROLES } from "@/types/roles";
import { JwtUtils } from "@/utils/jwt.utils";
import { clearTestData, createTestApp } from "@/test/setup";

const {
  client,
  userRepository,
  companyRepository,
  tenantRepository,
  subscriptionRepository,
  planRepository,
} = createTestApp();

describe("Tenants E2E", () => {
  let ownerToken: string;
  let managerToken: string;
  let brokerToken: string;
  let companyId: string;
  let ownerId: string;
  let managerId: string;
  let brokerId: string;
  // Para testes de cross-company isolation
  let otherCompanyId: string;
  let otherOwnerToken: string;
  let otherOwnerId: string;

  beforeAll(async () => {
    clearTestData();

    // Create company
    const company = await companyRepository.create({
      name: "Test Company",
      ownerId: "temp-owner",
    });
    companyId = company.id;

    // Create owner user
    const owner = await userRepository.create({
      email: "owner@test.com",
      password: "hashedpassword",
      name: "Owner User",
      role: USER_ROLES.OWNER,
      companyId,
      isActive: true,
      isEmailVerified: true,
    });
    ownerId = owner.id;

    await companyRepository.update(companyId, { ownerId: owner.id });

    // Create manager user
    const manager = await userRepository.create({
      email: "manager@test.com",
      password: "hashedpassword",
      name: "Manager User",
      role: USER_ROLES.MANAGER,
      companyId,
      isActive: true,
      isEmailVerified: true,
    });
    managerId = manager.id;

    // Create broker user
    const broker = await userRepository.create({
      email: "broker@test.com",
      password: "hashedpassword",
      name: "Broker User",
      role: USER_ROLES.BROKER,
      companyId,
      isActive: true,
      isEmailVerified: true,
    });
    brokerId = broker.id;

    // Create subscriptions for all users
    const plans = await planRepository.findAll();
    const subscriptionData = {
      planId: plans[0].id,
      status: "active" as const,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    await subscriptionRepository.create({
      userId: ownerId,
      ...subscriptionData,
    });

    await subscriptionRepository.create({
      userId: managerId,
      ...subscriptionData,
    });

    await subscriptionRepository.create({
      userId: brokerId,
      ...subscriptionData,
    });

    // Generate tokens with role and companyId
    ownerToken = await JwtUtils.generateToken(ownerId, "access", {
      role: USER_ROLES.OWNER,
      companyId,
    });
    managerToken = await JwtUtils.generateToken(managerId, "access", {
      role: USER_ROLES.MANAGER,
      companyId,
    });
    brokerToken = await JwtUtils.generateToken(brokerId, "access", {
      role: USER_ROLES.BROKER,
      companyId,
    });

    // Create other company for isolation tests
    const otherCompany = await companyRepository.create({
      name: "Other Company",
      ownerId: "temp-other-owner",
    });
    otherCompanyId = otherCompany.id;

    const otherOwner = await userRepository.create({
      email: "other-owner@test.com",
      password: "hashedpassword",
      name: "Other Owner User",
      role: USER_ROLES.OWNER,
      companyId: otherCompanyId,
      isActive: true,
      isEmailVerified: true,
    });
    otherOwnerId = otherOwner.id;

    await companyRepository.update(otherCompanyId, { ownerId: otherOwner.id });

    // Create subscription for other company
    await subscriptionRepository.create({
      userId: otherOwnerId,
      planId: plans[0].id,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    otherOwnerToken = await JwtUtils.generateToken(otherOwnerId, "access", {
      role: USER_ROLES.OWNER,
      companyId: otherCompanyId,
    });
  });

  afterAll(() => {
    clearTestData();
  });

  beforeEach(() => {
    tenantRepository.clear();
  });

  describe("POST /api/tenants", () => {
    // CPFs válidos para teste
    const VALID_CPFS = {
      joao: "52998224725",
      maria: "01471737870",
      carlos: "45317828791",
      duplicate: "74682489070",
      ana: "16903123784",
    };

    test("owner should create a tenant successfully", async () => {
      const response = await client.api.tenants.post(
        {
          name: "João Silva",
          cpf: VALID_CPFS.joao,
          email: "joao@example.com",
          phone: "11999999999",
          monthlyIncome: 500000,
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(response.data?.data?.name).toBe("João Silva");
      expect(response.data?.data?.cpf).toBe(VALID_CPFS.joao);
      expect(response.data?.data?.monthlyIncome).toBe(500000);
    });

    test("manager should create a tenant successfully", async () => {
      const response = await client.api.tenants.post(
        {
          name: "Maria Santos",
          cpf: VALID_CPFS.maria,
          email: "maria@example.com",
        },
        {
          headers: { Authorization: `Bearer ${managerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
    });

    test("broker should create a tenant successfully", async () => {
      const response = await client.api.tenants.post(
        {
          name: "Carlos Oliveira",
          cpf: VALID_CPFS.carlos,
        },
        {
          headers: { Authorization: `Bearer ${brokerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
    });

    test("should fail without authentication", async () => {
      const response = await client.api.tenants.post({
        name: "Test Tenant",
        cpf: "00000000000",
      });

      expect(response.status).toBe(401);
    });

    test("should fail with duplicate CPF in same company", async () => {
      // Create first tenant
      await client.api.tenants.post(
        {
          name: "First Tenant",
          cpf: VALID_CPFS.duplicate,
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      // Try to create second with same CPF
      const response = await client.api.tenants.post(
        {
          name: "Second Tenant",
          cpf: VALID_CPFS.duplicate,
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(409);
    });

    test("should create tenant with emergency contact", async () => {
      const response = await client.api.tenants.post(
        {
          name: "Ana Costa",
          cpf: VALID_CPFS.ana,
          emergencyContact: "Pedro Costa",
          emergencyPhone: "11888888888",
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.data?.emergencyContact).toBe("Pedro Costa");
      expect(response.data?.data?.emergencyPhone).toBe("11888888888");
    });

    test("should fail with invalid CPF", async () => {
      const response = await client.api.tenants.post(
        {
          name: "Invalid CPF Tenant",
          cpf: "11111111111",
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(400);
    });

    test("should fail with duplicate email in same company", async () => {
      const duplicateEmail = "duplicate-tenant@example.com";

      // Create first tenant with email
      await client.api.tenants.post(
        {
          name: "First Tenant",
          cpf: VALID_CPFS.joao,
          email: duplicateEmail,
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      // Try to create second with same email
      const response = await client.api.tenants.post(
        {
          name: "Second Tenant",
          cpf: VALID_CPFS.maria,
          email: duplicateEmail,
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(409);
    });

    test("should fail with negative monthlyIncome", async () => {
      const response = await client.api.tenants.post(
        {
          name: "Negative Income Tenant",
          cpf: VALID_CPFS.joao,
          monthlyIncome: -1000,
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      // 422 = validação de schema, que já impede valores negativos
      expect(response.status).toBe(422);
    });
  });

  describe("GET /api/tenants", () => {
    beforeEach(async () => {
      await tenantRepository.create({
        companyId,
        name: "Tenant A",
        cpf: "11111111111",
        createdBy: ownerId,
      });
      await tenantRepository.create({
        companyId,
        name: "Tenant B",
        cpf: "22222222222",
        createdBy: brokerId,
      });
      await tenantRepository.create({
        companyId,
        name: "Tenant C",
        cpf: "33333333333",
        createdBy: brokerId,
      });
    });

    test("owner should list all tenants", async () => {
      const response = await client.api.tenants.get({
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(response.data?.data?.length).toBe(3);
    });

    test("broker should list only their own tenants", async () => {
      const response = await client.api.tenants.get({
        headers: { Authorization: `Bearer ${brokerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.data?.length).toBe(2);
    });

    test("should filter by search term", async () => {
      const response = await client.api.tenants.get({
        query: { search: "Tenant A" },
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.data?.length).toBe(1);
      expect(response.data?.data?.[0]?.name).toBe("Tenant A");
    });

    test("should paginate results", async () => {
      const response = await client.api.tenants.get({
        query: { limit: 2, offset: 0 },
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.data?.length).toBe(2);
      expect(response.data?.total).toBe(3);
    });
  });

  describe("GET /api/tenants/:id", () => {
    let tenantId: string;

    beforeEach(async () => {
      const tenant = await tenantRepository.create({
        companyId,
        name: "Test Tenant",
        cpf: "99999999999",
        email: "test@example.com",
        createdBy: brokerId,
      });
      tenantId = tenant.id;
    });

    test("should get tenant by id", async () => {
      const response = await client.api.tenants({ id: tenantId }).get({
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.data?.name).toBe("Test Tenant");
    });

    test("broker should get their own tenant", async () => {
      const response = await client.api.tenants({ id: tenantId }).get({
        headers: { Authorization: `Bearer ${brokerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.data?.name).toBe("Test Tenant");
    });

    test("should return 404 for non-existent id", async () => {
      const response = await client.api
        .tenants({
          id: "00000000-0000-0000-0000-000000000000",
        })
        .get({
          headers: { Authorization: `Bearer ${ownerToken}` },
        });

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/tenants/:id", () => {
    let tenantId: string;

    beforeEach(async () => {
      const tenant = await tenantRepository.create({
        companyId,
        name: "Original Name",
        cpf: "88888888888",
        createdBy: ownerId,
      });
      tenantId = tenant.id;
    });

    test("owner should update tenant", async () => {
      const response = await client.api.tenants({ id: tenantId }).patch(
        {
          name: "Updated Name",
          email: "updated@example.com",
          monthlyIncome: 600000,
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.data?.name).toBe("Updated Name");
      expect(response.data?.data?.email).toBe("updated@example.com");
      expect(response.data?.data?.monthlyIncome).toBe(600000);
    });

    test("manager should update tenant", async () => {
      const response = await client.api.tenants({ id: tenantId }).patch(
        {
          phone: "11888888888",
        },
        {
          headers: { Authorization: `Bearer ${managerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.data?.phone).toBe("11888888888");
    });

    test("should return 404 for non-existent id", async () => {
      const response = await client.api
        .tenants({
          id: "00000000-0000-0000-0000-000000000000",
        })
        .patch(
          { name: "Test" },
          {
            headers: { Authorization: `Bearer ${ownerToken}` },
          },
        );

      expect(response.status).toBe(404);
    });

    test("should fail when updating to negative monthlyIncome", async () => {
      const response = await client.api.tenants({ id: tenantId }).patch(
        {
          monthlyIncome: -5000,
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      // 422 = validação de schema, que já impede valores negativos
      expect(response.status).toBe(422);
    });
  });

  describe("DELETE /api/tenants/:id", () => {
    let tenantId: string;

    beforeEach(async () => {
      const tenant = await tenantRepository.create({
        companyId,
        name: "To Delete",
        cpf: "77777777777",
        createdBy: ownerId,
      });
      tenantId = tenant.id;
    });

    test("owner should delete tenant", async () => {
      const response = await client.api
        .tenants({ id: tenantId })
        .delete(undefined, {
          headers: { Authorization: `Bearer ${ownerToken}` },
        });

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);

      // Verify deletion
      const deleted = await tenantRepository.findById(tenantId);
      expect(deleted).toBeNull();
    });

    test("manager should delete tenant", async () => {
      const response = await client.api
        .tenants({ id: tenantId })
        .delete(undefined, {
          headers: { Authorization: `Bearer ${managerToken}` },
        });

      expect(response.status).toBe(200);
    });

    test("should return 404 for non-existent id", async () => {
      const response = await client.api
        .tenants({
          id: "00000000-0000-0000-0000-000000000000",
        })
        .delete(undefined, {
          headers: { Authorization: `Bearer ${ownerToken}` },
        });

      expect(response.status).toBe(404);
    });
  });

  describe("Cross-Company Isolation", () => {
    let tenantId: string;

    beforeEach(async () => {
      // Create a tenant in the first company
      const tenant = await tenantRepository.create({
        companyId,
        name: "Company A Tenant",
        cpf: "52998224725",
        email: "companya-tenant@example.com",
        createdBy: ownerId,
      });
      tenantId = tenant.id;
    });

    test("should not allow other company to view tenant (returns 404)", async () => {
      const response = await client.api.tenants({ id: tenantId }).get({
        headers: { Authorization: `Bearer ${otherOwnerToken}` },
      });

      // Should return 404 to prevent information disclosure
      expect(response.status).toBe(404);
    });

    test("should not allow other company to update tenant (returns 404)", async () => {
      const response = await client.api.tenants({ id: tenantId }).patch(
        { name: "Hacked Name" },
        {
          headers: { Authorization: `Bearer ${otherOwnerToken}` },
        },
      );

      // Should return 404 to prevent information disclosure
      expect(response.status).toBe(404);
    });

    test("should not allow other company to delete tenant (returns 404)", async () => {
      const response = await client.api
        .tenants({ id: tenantId })
        .delete(undefined, {
          headers: { Authorization: `Bearer ${otherOwnerToken}` },
        });

      // Should return 404 to prevent information disclosure
      expect(response.status).toBe(404);

      // Verify the tenant still exists
      const stillExists = await tenantRepository.findById(tenantId);
      expect(stillExists).not.toBeNull();
    });

    test("should not list tenants from other company", async () => {
      const response = await client.api.tenants.get({
        headers: { Authorization: `Bearer ${otherOwnerToken}` },
      });

      expect(response.status).toBe(200);
      // Should return empty array since other company has no tenants
      expect(response.data?.data?.length).toBe(0);
    });

    test("should allow same CPF in different companies", async () => {
      // The same CPF should be allowed in a different company
      const response = await client.api.tenants.post(
        {
          name: "Same CPF Different Company",
          cpf: "52998224725", // Same CPF as tenantId
        },
        {
          headers: { Authorization: `Bearer ${otherOwnerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
    });

    test("should allow same email in different companies", async () => {
      // The same email should be allowed in a different company
      const response = await client.api.tenants.post(
        {
          name: "Same Email Different Company",
          cpf: "01471737870", // Different CPF
          email: "companya-tenant@example.com", // Same email as tenantId
        },
        {
          headers: { Authorization: `Bearer ${otherOwnerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
    });
  });
});
