import { beforeEach, describe, expect, it } from "bun:test";
import { CONTRACT_STATUS } from "@/db/schema/contracts";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("GET /contracts - List Contracts E2E", () => {
  const {
    client,
    userRepository,
    companyRepository,
    planRepository,
    subscriptionRepository,
    propertyRepository,
    propertyOwnerRepository,
    tenantRepository,
    contractRepository,
  } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  async function createUserWithSubscription(role: string, planSlug = "house") {
    const plan = await planRepository.findBySlug(planSlug);
    if (!plan) throw new Error("Plan not found");

    const company = await companyRepository.create({
      name: "Test Company",
      email: generateTestEmail("company"),
    });

    const owner = await userRepository.create({
      email: generateTestEmail("owner"),
      password: "hashed-password",
      name: "Owner User",
      role: "owner",
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    await companyRepository.update(company.id, { ownerId: owner.id });

    await subscriptionRepository.create({
      userId: owner.id,
      planId: plan.id,
      status: "active",
      startDate: new Date(),
    });

    let user = owner;
    if (role !== "owner") {
      user = await userRepository.create({
        email: generateTestEmail(role),
        password: "hashed-password",
        name: `${role} User`,
        role,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
        createdBy: owner.id,
      });
    }

    const token = await JwtUtils.generateToken(user.id, "access", {
      role: user.role,
      companyId: company.id,
    });

    return { user, owner, company, plan, token };
  }

  async function createPropertyWithOwner(companyId: string, ownerId: string) {
    const propertyOwner = await propertyOwnerRepository.create({
      companyId,
      name: "Property Owner",
      email: generateTestEmail("property-owner"),
      phone: "11999999999",
      document: "12345678901",
      createdBy: ownerId,
    });

    const property = await propertyRepository.create({
      companyId,
      ownerId: propertyOwner.id,
      title: "Apartamento Teste",
      type: "apartment",
      address: "Rua Teste, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234567",
      rentalPrice: 150000,
      createdBy: ownerId,
    });

    return { propertyOwner, property };
  }

  async function createTenant(companyId: string, createdById: string) {
    return tenantRepository.create({
      companyId,
      name: "Test Tenant",
      email: generateTestEmail("tenant"),
      phone: "11888888888",
      cpf: "98765432100",
      createdBy: createdById,
    });
  }

  async function createContract(
    companyId: string,
    propertyId: string,
    ownerId: string,
    tenantId: string,
    createdById: string,
    overrides: Partial<{
      status: string;
      rentalAmount: number;
      paymentDay: number;
    }> = {},
  ) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    return contractRepository.create({
      companyId,
      propertyId,
      ownerId,
      tenantId,
      startDate,
      endDate,
      rentalAmount: overrides.rentalAmount ?? 150000,
      paymentDay: overrides.paymentDay ?? 5,
      status: overrides.status ?? CONTRACT_STATUS.ACTIVE,
      createdBy: createdById,
    });
  }

  describe("Authentication & Authorization", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.api.contracts.get();

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client.api.contracts.get({
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(status).toBe(401);
    });

    it("should allow OWNER to list contracts", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client.api.contracts.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should allow MANAGER to list contracts", async () => {
      const { token } = await createUserWithSubscription("manager");

      const { status, data } = await client.api.contracts.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should allow BROKER to list contracts", async () => {
      const { token } = await createUserWithSubscription("broker");

      const { status, data } = await client.api.contracts.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });
  });

  describe("Successful Listing", () => {
    it("should return empty list when no contracts exist", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client.api.contracts.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.data).toEqual([]);
      expect(data?.pagination.total).toBe(0);
      expect(data?.pagination.totalPages).toBe(0);
    });

    it("should return list of contracts", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant = await createTenant(company.id, owner.id);

      await createContract(company.id, property.id, propertyOwner.id, tenant.id, owner.id);
      await createContract(company.id, property.id, propertyOwner.id, tenant.id, owner.id);

      const { status, data } = await client.api.contracts.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.data.length).toBe(2);
      expect(data?.pagination.total).toBe(2);
    });

    it("should return contracts with all fields", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant = await createTenant(company.id, owner.id);

      await createContract(company.id, property.id, propertyOwner.id, tenant.id, owner.id, {
        rentalAmount: 200000,
        paymentDay: 10,
      });

      const { status, data } = await client.api.contracts.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBeGreaterThan(0);
      expect(data?.data[0]).toHaveProperty("id");
      expect(data?.data[0]).toHaveProperty("propertyId");
      expect(data?.data[0]).toHaveProperty("ownerId");
      expect(data?.data[0]).toHaveProperty("tenantId");
      expect(data?.data[0]).toHaveProperty("startDate");
      expect(data?.data[0]).toHaveProperty("endDate");
      expect(data?.data[0]).toHaveProperty("rentalAmount");
      expect(data?.data[0]).toHaveProperty("paymentDay");
      expect(data?.data[0]).toHaveProperty("status");
      // Campos não retornados pela API: companyId, createdAt, updatedAt
    });
  });

  describe("Pagination", () => {
    it("should paginate results correctly", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant = await createTenant(company.id, owner.id);

      // Create 15 contracts
      for (let i = 0; i < 15; i++) {
        await createContract(company.id, property.id, propertyOwner.id, tenant.id, owner.id);
      }

      const { status, data } = await client.api.contracts.get({
        query: {
          page: 1,
          limit: 10,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(10);
      expect(data?.pagination.page).toBe(1);
      expect(data?.pagination.limit).toBe(10);
      expect(data?.pagination.total).toBe(15);
      expect(data?.pagination.totalPages).toBe(2);
    });

    it("should return second page correctly", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant = await createTenant(company.id, owner.id);

      // Create 15 contracts
      for (let i = 0; i < 15; i++) {
        await createContract(company.id, property.id, propertyOwner.id, tenant.id, owner.id);
      }

      const { status, data } = await client.api.contracts.get({
        query: {
          page: 2,
          limit: 10,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(5);
      expect(data?.pagination.page).toBe(2);
    });

    it("should respect custom limit", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant = await createTenant(company.id, owner.id);

      for (let i = 0; i < 10; i++) {
        await createContract(company.id, property.id, propertyOwner.id, tenant.id, owner.id);
      }

      const { status, data } = await client.api.contracts.get({
        query: {
          limit: 5,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(5);
      expect(data?.pagination.limit).toBe(5);
    });
  });

  describe("Filters", () => {
    it("should filter by status", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant = await createTenant(company.id, owner.id);

      await createContract(company.id, property.id, propertyOwner.id, tenant.id, owner.id, {
        status: CONTRACT_STATUS.ACTIVE,
      });
      await createContract(company.id, property.id, propertyOwner.id, tenant.id, owner.id, {
        status: CONTRACT_STATUS.TERMINATED,
      });
      await createContract(company.id, property.id, propertyOwner.id, tenant.id, owner.id, {
        status: CONTRACT_STATUS.ACTIVE,
      });

      const { status, data } = await client.api.contracts.get({
        query: {
          status: CONTRACT_STATUS.ACTIVE,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(2);
      expect(data?.data.every((c) => c.status === CONTRACT_STATUS.ACTIVE)).toBe(true);
    });

    it("should filter by propertyId", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property: property1, propertyOwner } = await createPropertyWithOwner(
        company.id,
        owner.id,
      );
      const property2 = await propertyRepository.create({
        companyId: company.id,
        ownerId: propertyOwner.id,
        title: "Casa Teste",
        type: "house",
        address: "Rua Outra, 456",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234568",
        rentalPrice: 200000,
        createdBy: owner.id,
      });
      const tenant = await createTenant(company.id, owner.id);

      await createContract(company.id, property1.id, propertyOwner.id, tenant.id, owner.id);
      await createContract(company.id, property2.id, propertyOwner.id, tenant.id, owner.id);
      await createContract(company.id, property1.id, propertyOwner.id, tenant.id, owner.id);

      const { status, data } = await client.api.contracts.get({
        query: {
          propertyId: property1.id,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(2);
      expect(data?.data.every((c) => c.propertyId === property1.id)).toBe(true);
    });

    it("should filter by tenantId", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant1 = await createTenant(company.id, owner.id);
      const tenant2 = await tenantRepository.create({
        companyId: company.id,
        name: "Another Tenant",
        email: generateTestEmail("tenant2"),
        phone: "11777777777",
        cpf: "11111111111",
        createdBy: owner.id,
      });

      await createContract(company.id, property.id, propertyOwner.id, tenant1.id, owner.id);
      await createContract(company.id, property.id, propertyOwner.id, tenant2.id, owner.id);

      const { status, data } = await client.api.contracts.get({
        query: {
          tenantId: tenant1.id,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].tenantId).toBe(tenant1.id);
    });

    it("should filter by ownerId", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property: property1, propertyOwner: propertyOwner1 } = await createPropertyWithOwner(
        company.id,
        owner.id,
      );

      const propertyOwner2 = await propertyOwnerRepository.create({
        companyId: company.id,
        name: "Another Owner",
        email: generateTestEmail("property-owner2"),
        phone: "11666666666",
        document: "22222222222",
        createdBy: owner.id,
      });
      const property2 = await propertyRepository.create({
        companyId: company.id,
        ownerId: propertyOwner2.id,
        title: "Casa Nova",
        type: "house",
        address: "Rua Nova, 789",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234569",
        rentalPrice: 300000,
        createdBy: owner.id,
      });

      const tenant = await createTenant(company.id, owner.id);

      await createContract(company.id, property1.id, propertyOwner1.id, tenant.id, owner.id);
      await createContract(company.id, property2.id, propertyOwner2.id, tenant.id, owner.id);

      const { status, data } = await client.api.contracts.get({
        query: {
          ownerId: propertyOwner1.id,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].ownerId).toBe(propertyOwner1.id);
    });

    it("should combine multiple filters", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant = await createTenant(company.id, owner.id);

      await createContract(company.id, property.id, propertyOwner.id, tenant.id, owner.id, {
        status: CONTRACT_STATUS.ACTIVE,
      });
      await createContract(company.id, property.id, propertyOwner.id, tenant.id, owner.id, {
        status: CONTRACT_STATUS.TERMINATED,
      });

      const { status, data } = await client.api.contracts.get({
        query: {
          propertyId: property.id,
          status: CONTRACT_STATUS.ACTIVE,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].status).toBe(CONTRACT_STATUS.ACTIVE);
      expect(data?.data[0].propertyId).toBe(property.id);
    });
  });

  describe("Company Isolation", () => {
    it("should only list contracts from the same company", async () => {
      const { token, company: company1, owner: owner1 } = await createUserWithSubscription("owner");
      const { property: property1, propertyOwner: propertyOwner1 } = await createPropertyWithOwner(
        company1.id,
        owner1.id,
      );
      const tenant1 = await createTenant(company1.id, owner1.id);

      // Create another company with contract
      const company2 = await companyRepository.create({
        name: "Other Company",
        email: generateTestEmail("company2"),
      });
      const owner2 = await userRepository.create({
        email: generateTestEmail("owner2"),
        password: "hashed-password",
        name: "Owner 2",
        role: "owner",
        companyId: company2.id,
        isActive: true,
        isEmailVerified: true,
      });
      const { property: property2, propertyOwner: propertyOwner2 } = await createPropertyWithOwner(
        company2.id,
        owner2.id,
      );
      const tenant2 = await createTenant(company2.id, owner2.id);

      // Create contracts in both companies
      await createContract(company1.id, property1.id, propertyOwner1.id, tenant1.id, owner1.id);
      await createContract(company2.id, property2.id, propertyOwner2.id, tenant2.id, owner2.id);

      const { status, data } = await client.api.contracts.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].propertyId).toBe(property1.id);
    });
  });
});
