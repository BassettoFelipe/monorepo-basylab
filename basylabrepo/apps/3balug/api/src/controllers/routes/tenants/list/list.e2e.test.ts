import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("GET /tenants - List Tenants E2E", () => {
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

  // Valid test CPFs
  const validCpfs = [
    "12345678909",
    "11144477735",
    "52998224725",
    "82324623040",
    "17614524077",
    "59419377090",
    "64423518010",
    "72934674027",
    "83768256058",
    "94512649008",
  ];
  let cpfIndex = 0;

  async function createTenant(companyId: string, createdById: string, name: string) {
    const cpf = validCpfs[cpfIndex % validCpfs.length];
    cpfIndex++;
    return tenantRepository.create({
      companyId,
      name,
      cpf,
      phone: "11999999999",
      createdBy: createdById,
    });
  }

  describe("Authentication & Authorization", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.api.tenants.get();

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client.api.tenants.get({
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(status).toBe(401);
    });

    it("should allow OWNER to list tenants", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client.api.tenants.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });
  });

  describe("Listing", () => {
    it("should return empty list when no tenants exist", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client.api.tenants.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.data).toEqual([]);
      expect(data?.total).toBe(0);
    });

    it("should return list of tenants", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createTenant(company.id, owner.id, "João Silva");
      await createTenant(company.id, owner.id, "Maria Santos");

      const { status, data } = await client.api.tenants.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.data.length).toBe(2);
      expect(data?.total).toBe(2);
    });

    it("should only return tenants from the same company", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createTenant(company.id, owner.id, "João Silva");

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
      await createTenant(company2.id, owner2.id, "Maria Santos");

      const { status, data } = await client.api.tenants.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].name).toBe("João Silva");
    });
  });

  describe("Search", () => {
    it("should filter tenants by search term", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createTenant(company.id, owner.id, "João Silva");
      await createTenant(company.id, owner.id, "Maria Santos");

      const { status, data } = await client.api.tenants.get({
        query: {
          search: "João",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].name).toBe("João Silva");
    });
  });

  describe("Pagination", () => {
    it("should respect limit parameter", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createTenant(company.id, owner.id, "Tenant 1");
      await createTenant(company.id, owner.id, "Tenant 2");
      await createTenant(company.id, owner.id, "Tenant 3");

      const { status, data } = await client.api.tenants.get({
        query: {
          limit: 2,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(2);
      expect(data?.total).toBe(3);
      expect(data?.limit).toBe(2);
    });

    it("should respect offset parameter", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createTenant(company.id, owner.id, "Tenant 1");
      await createTenant(company.id, owner.id, "Tenant 2");
      await createTenant(company.id, owner.id, "Tenant 3");

      const { status, data } = await client.api.tenants.get({
        query: {
          offset: 1,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(2);
      expect(data?.offset).toBe(1);
    });
  });
});
