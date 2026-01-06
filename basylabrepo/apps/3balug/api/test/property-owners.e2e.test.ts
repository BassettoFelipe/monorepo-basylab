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
  propertyOwnerRepository,
  subscriptionRepository,
  planRepository,
} = createTestApp();

describe("Property Owners E2E", () => {
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

    // Update company with actual owner
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
    propertyOwnerRepository.clear();
  });

  describe("POST /api/property-owners", () => {
    // CPFs válidos para teste
    const VALID_CPFS = {
      joao: "52998224725",
      maria: "01471737870",
      carlos: "45317828791",
      duplicate: "74682489070",
    };
    // CNPJ válido para teste
    const VALID_CNPJ = "11222333000181";

    test("owner should create a property owner successfully", async () => {
      const response = await client.api["property-owners"].post(
        {
          name: "João Silva",
          document: VALID_CPFS.joao,
          documentType: "cpf",
          email: "joao@example.com",
          phone: "11999999999",
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(response.data?.data?.name).toBe("João Silva");
      expect(response.data?.data?.document).toBe(VALID_CPFS.joao);
    });

    test("manager should create a property owner successfully", async () => {
      const response = await client.api["property-owners"].post(
        {
          name: "Maria Santos",
          document: VALID_CPFS.maria,
          documentType: "cpf",
          email: "maria@example.com",
        },
        {
          headers: { Authorization: `Bearer ${managerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
    });

    test("broker should create a property owner successfully", async () => {
      const response = await client.api["property-owners"].post(
        {
          name: "Carlos Oliveira",
          document: VALID_CPFS.carlos,
          documentType: "cpf",
        },
        {
          headers: { Authorization: `Bearer ${brokerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
    });

    test("should fail without authentication", async () => {
      const response = await client.api["property-owners"].post({
        name: "Test Owner",
        document: "00000000000",
        documentType: "cpf",
      });

      expect(response.status).toBe(401);
    });

    test("should fail with duplicate document in same company", async () => {
      // Create first owner
      await client.api["property-owners"].post(
        {
          name: "First Owner",
          document: VALID_CPFS.duplicate,
          documentType: "cpf",
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      // Try to create second with same document
      const response = await client.api["property-owners"].post(
        {
          name: "Second Owner",
          document: VALID_CPFS.duplicate,
          documentType: "cpf",
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(409);
    });

    test("should create owner with CNPJ", async () => {
      const response = await client.api["property-owners"].post(
        {
          name: "Empresa LTDA",
          document: VALID_CNPJ,
          documentType: "cnpj",
          email: "empresa@example.com",
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.data?.documentType).toBe("cnpj");
    });

    test("should fail with invalid CPF", async () => {
      const response = await client.api["property-owners"].post(
        {
          name: "Invalid CPF Owner",
          document: "11111111111",
          documentType: "cpf",
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(400);
    });

    test("should fail with invalid CNPJ", async () => {
      const response = await client.api["property-owners"].post(
        {
          name: "Invalid CNPJ Owner",
          document: "11111111111111",
          documentType: "cnpj",
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(400);
    });

    test("should fail with duplicate email in same company", async () => {
      const duplicateEmail = "duplicate@example.com";

      // Create first owner with email
      await client.api["property-owners"].post(
        {
          name: "First Owner",
          document: VALID_CPFS.joao,
          documentType: "cpf",
          email: duplicateEmail,
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      // Try to create second with same email
      const response = await client.api["property-owners"].post(
        {
          name: "Second Owner",
          document: VALID_CPFS.maria,
          documentType: "cpf",
          email: duplicateEmail,
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(409);
    });
  });

  describe("GET /api/property-owners", () => {
    beforeEach(async () => {
      // Create some test owners
      await propertyOwnerRepository.create({
        companyId,
        name: "Owner A",
        document: "11111111111",
        documentType: "cpf",
        createdBy: ownerId,
      });
      await propertyOwnerRepository.create({
        companyId,
        name: "Owner B",
        document: "22222222222",
        documentType: "cpf",
        createdBy: brokerId,
      });
      await propertyOwnerRepository.create({
        companyId,
        name: "Owner C",
        document: "33333333333",
        documentType: "cpf",
        createdBy: brokerId,
      });
    });

    test("owner should list all property owners", async () => {
      const response = await client.api["property-owners"].get({
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(response.data?.data?.length).toBe(3);
    });

    test("broker should list only their own property owners", async () => {
      const response = await client.api["property-owners"].get({
        headers: { Authorization: `Bearer ${brokerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.data?.length).toBe(2);
    });

    test("should filter by search term", async () => {
      const response = await client.api["property-owners"].get({
        query: { search: "Owner A" },
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.data?.length).toBe(1);
      expect(response.data?.data?.[0]?.name).toBe("Owner A");
    });

    test("should paginate results", async () => {
      const response = await client.api["property-owners"].get({
        query: { limit: 2, offset: 0 },
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.data?.length).toBe(2);
      expect(response.data?.total).toBe(3);
    });
  });

  describe("GET /api/property-owners/:id", () => {
    let propertyOwnerId: string;

    beforeEach(async () => {
      const owner = await propertyOwnerRepository.create({
        companyId,
        name: "Test Owner",
        document: "99999999999",
        documentType: "cpf",
        email: "test@example.com",
        createdBy: brokerId,
      });
      propertyOwnerId = owner.id;
    });

    test("should get property owner by id", async () => {
      const response = await client.api["property-owners"]({
        id: propertyOwnerId,
      }).get({
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.data?.name).toBe("Test Owner");
    });

    test("broker should get their own property owner", async () => {
      const response = await client.api["property-owners"]({
        id: propertyOwnerId,
      }).get({
        headers: { Authorization: `Bearer ${brokerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.data?.name).toBe("Test Owner");
    });

    test("should return 404 for non-existent id", async () => {
      const response = await client.api["property-owners"]({
        id: "00000000-0000-0000-0000-000000000000",
      }).get({
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/property-owners/:id", () => {
    let propertyOwnerId: string;

    beforeEach(async () => {
      const owner = await propertyOwnerRepository.create({
        companyId,
        name: "Original Name",
        document: "88888888888",
        documentType: "cpf",
        createdBy: ownerId,
      });
      propertyOwnerId = owner.id;
    });

    test("owner should update property owner", async () => {
      const response = await client.api["property-owners"]({
        id: propertyOwnerId,
      }).patch(
        {
          name: "Updated Name",
          email: "updated@example.com",
        },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data?.data?.name).toBe("Updated Name");
      expect(response.data?.data?.email).toBe("updated@example.com");
    });

    test("manager should update property owner", async () => {
      const response = await client.api["property-owners"]({
        id: propertyOwnerId,
      }).patch(
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
      const response = await client.api["property-owners"]({
        id: "00000000-0000-0000-0000-000000000000",
      }).patch(
        { name: "Test" },
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
        },
      );

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/property-owners/:id", () => {
    let propertyOwnerId: string;

    beforeEach(async () => {
      const owner = await propertyOwnerRepository.create({
        companyId,
        name: "To Delete",
        document: "77777777777",
        documentType: "cpf",
        createdBy: ownerId,
      });
      propertyOwnerId = owner.id;
    });

    test("owner should delete property owner", async () => {
      const response = await client.api["property-owners"]({
        id: propertyOwnerId,
      }).delete(undefined, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);

      // Verify deletion
      const deleted = await propertyOwnerRepository.findById(propertyOwnerId);
      expect(deleted).toBeNull();
    });

    test("manager should delete property owner", async () => {
      const response = await client.api["property-owners"]({
        id: propertyOwnerId,
      }).delete(undefined, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });

      expect(response.status).toBe(200);
    });

    test("should return 404 for non-existent id", async () => {
      const response = await client.api["property-owners"]({
        id: "00000000-0000-0000-0000-000000000000",
      }).delete(undefined, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("Cross-Company Isolation", () => {
    let propertyOwnerId: string;

    beforeEach(async () => {
      // Create a property owner in the first company
      const owner = await propertyOwnerRepository.create({
        companyId,
        name: "Company A Owner",
        document: "52998224725",
        documentType: "cpf",
        email: "companya@example.com",
        createdBy: ownerId,
      });
      propertyOwnerId = owner.id;
    });

    test("should not allow other company to view property owner (returns 404)", async () => {
      const response = await client.api["property-owners"]({
        id: propertyOwnerId,
      }).get({
        headers: { Authorization: `Bearer ${otherOwnerToken}` },
      });

      // Should return 404 to prevent information disclosure
      expect(response.status).toBe(404);
    });

    test("should not allow other company to update property owner (returns 404)", async () => {
      const response = await client.api["property-owners"]({
        id: propertyOwnerId,
      }).patch(
        { name: "Hacked Name" },
        {
          headers: { Authorization: `Bearer ${otherOwnerToken}` },
        },
      );

      // Should return 404 to prevent information disclosure
      expect(response.status).toBe(404);
    });

    test("should not allow other company to delete property owner (returns 404)", async () => {
      const response = await client.api["property-owners"]({
        id: propertyOwnerId,
      }).delete(undefined, {
        headers: { Authorization: `Bearer ${otherOwnerToken}` },
      });

      // Should return 404 to prevent information disclosure
      expect(response.status).toBe(404);

      // Verify the property owner still exists
      const stillExists =
        await propertyOwnerRepository.findById(propertyOwnerId);
      expect(stillExists).not.toBeNull();
    });

    test("should not list property owners from other company", async () => {
      const response = await client.api["property-owners"].get({
        headers: { Authorization: `Bearer ${otherOwnerToken}` },
      });

      expect(response.status).toBe(200);
      // Should return empty array since other company has no property owners
      expect(response.data?.data?.length).toBe(0);
    });

    test("should allow same document in different companies", async () => {
      // The same CPF should be allowed in a different company
      const response = await client.api["property-owners"].post(
        {
          name: "Same CPF Different Company",
          document: "52998224725", // Same CPF as propertyOwnerId
          documentType: "cpf",
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
