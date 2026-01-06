import { beforeEach, describe, expect, it } from "bun:test";
import { CONTRACT_STATUS } from "@/db/schema/contracts";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("GET /contracts/:id - Get Contract E2E", () => {
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
      brokerId: string;
      depositAmount: number;
      notes: string;
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
      rentalAmount: 150000,
      paymentDay: 5,
      status: CONTRACT_STATUS.ACTIVE,
      createdBy: createdById,
      ...overrides,
    });
  }

  describe("Authentication & Authorization", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.api
        .contracts({ id: "00000000-0000-0000-0000-000000000001" })
        .get();

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client.api
        .contracts({ id: "00000000-0000-0000-0000-000000000001" })
        .get({
          headers: {
            Authorization: "Bearer invalid-token",
          },
        });

      expect(status).toBe(401);
    });

    it("should allow OWNER to get contract", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant = await createTenant(company.id, owner.id);
      const contract = await createContract(
        company.id,
        property.id,
        propertyOwner.id,
        tenant.id,
        owner.id,
      );

      const { status, data } = await client.api.contracts({ id: contract.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should allow MANAGER to get contract", async () => {
      const { token, company, owner } = await createUserWithSubscription("manager");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant = await createTenant(company.id, owner.id);
      const contract = await createContract(
        company.id,
        property.id,
        propertyOwner.id,
        tenant.id,
        owner.id,
      );

      const { status, data } = await client.api.contracts({ id: contract.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should allow BROKER to get contract", async () => {
      const { token, company, owner, user: broker } = await createUserWithSubscription("broker");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant = await createTenant(company.id, owner.id);
      // Criar contrato com o broker como responsável
      const contract = await createContract(
        company.id,
        property.id,
        propertyOwner.id,
        tenant.id,
        owner.id,
        { brokerId: broker.id },
      );

      const { status, data } = await client.api.contracts({ id: contract.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });
  });

  describe("Input Validation", () => {
    it("should return 422 when id is not a valid UUID", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api.contracts({ id: "invalid-uuid" }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(422);
    });
  });

  describe("Successful Get", () => {
    it("should return contract with all fields", async () => {
      const { token, company, owner, user } = await createUserWithSubscription("broker");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant = await createTenant(company.id, owner.id);
      const contract = await createContract(
        company.id,
        property.id,
        propertyOwner.id,
        tenant.id,
        owner.id,
        {
          brokerId: user.id,
          depositAmount: 300000,
          notes: "Contrato de teste",
        },
      );

      const { status, data } = await client.api.contracts({ id: contract.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.data.id).toBe(contract.id);
      expect(data?.data.companyId).toBe(company.id);
      expect(data?.data.propertyId).toBe(property.id);
      expect(data?.data.ownerId).toBe(propertyOwner.id);
      expect(data?.data.tenantId).toBe(tenant.id);
      expect(data?.data.brokerId).toBe(user.id);
      expect(data?.data.rentalAmount).toBe(150000);
      expect(data?.data.paymentDay).toBe(5);
      expect(data?.data.depositAmount).toBe(300000);
      expect(data?.data.status).toBe(CONTRACT_STATUS.ACTIVE);
      expect(data?.data.notes).toBe("Contrato de teste");
      expect(data?.data).toHaveProperty("startDate");
      expect(data?.data).toHaveProperty("endDate");
      expect(data?.data).toHaveProperty("createdAt");
      expect(data?.data).toHaveProperty("updatedAt");
    });

    it("should return contract with null optional fields", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);
      const tenant = await createTenant(company.id, owner.id);
      const contract = await createContract(
        company.id,
        property.id,
        propertyOwner.id,
        tenant.id,
        owner.id,
      );

      const { status, data } = await client.api.contracts({ id: contract.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.brokerId).toBeNull();
      expect(data?.data.depositAmount).toBeNull();
      expect(data?.data.notes).toBeNull();
      expect(data?.data.terminatedAt).toBeNull();
      expect(data?.data.terminationReason).toBeNull();
    });
  });

  describe("Error Cases", () => {
    it("should return error when contract does not exist", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api
        .contracts({ id: "00000000-0000-0000-0000-000000000999" })
        .get({
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

      expect(status).not.toBe(200);
    });

    it("should not allow access to contract from another company", async () => {
      const { token } = await createUserWithSubscription("owner");

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
      const { property, propertyOwner } = await createPropertyWithOwner(company2.id, owner2.id);
      const tenant = await createTenant(company2.id, owner2.id);
      const contract = await createContract(
        company2.id,
        property.id,
        propertyOwner.id,
        tenant.id,
        owner2.id,
      );

      const { status } = await client.api.contracts({ id: contract.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).not.toBe(200);
    });
  });
});
