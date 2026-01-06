import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("GET /tenants/:id - Get Tenant E2E", () => {
  const {
    client,
    userRepository,
    companyRepository,
    planRepository,
    subscriptionRepository,
    tenantRepository,
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

  async function createTenant(companyId: string, createdById: string) {
    return tenantRepository.create({
      companyId,
      name: "João Silva",
      cpf: "12345678909",
      phone: "11999999999",
      email: "joao@email.com",
      createdBy: createdById,
    });
  }

  describe("Authentication & Authorization", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.api
        .tenants({ id: "00000000-0000-0000-0000-000000000001" })
        .get();

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client.api
        .tenants({ id: "00000000-0000-0000-0000-000000000001" })
        .get({
          headers: {
            Authorization: "Bearer invalid-token",
          },
        });

      expect(status).toBe(401);
    });

    it("should allow OWNER to get tenant", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const tenant = await createTenant(company.id, owner.id);

      const { status, data } = await client.api.tenants({ id: tenant.id }).get({
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

      const { status } = await client.api.tenants({ id: "invalid-uuid" }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(422);
    });
  });

  describe("Successful Get", () => {
    it("should return tenant details", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const tenant = await createTenant(company.id, owner.id);

      const { status, data } = await client.api.tenants({ id: tenant.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.data.id).toBe(tenant.id);
      expect(data?.data.name).toBe("João Silva");
      expect(data?.data.cpf).toBe("12345678909");
      expect(data?.data.phone).toBe("11999999999");
      expect(data?.data.email).toBe("joao@email.com");
      expect(data?.data.companyId).toBe(company.id);
    });
  });

  describe("Business Rules", () => {
    it("should not allow getting tenant from another company", async () => {
      const { token } = await createUserWithSubscription("owner");

      // Create tenant in another company
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
      const tenant = await createTenant(company2.id, owner2.id);

      const { status } = await client.api.tenants({ id: tenant.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).not.toBe(200);
    });

    it("should return error for non-existent tenant", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api
        .tenants({ id: "00000000-0000-0000-0000-000000000999" })
        .get({
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

      expect(status).not.toBe(200);
    });
  });
});
