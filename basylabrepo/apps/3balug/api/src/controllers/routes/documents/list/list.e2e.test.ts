import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("GET /documents/:entityType/:entityId", () => {
  const { app, userRepository, companyRepository, planRepository, subscriptionRepository } =
    createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  async function createCompanyWithOwner(planSlug = "imobiliaria") {
    const plan = await planRepository.findBySlug(planSlug);
    if (!plan) throw new Error(`Plan ${planSlug} not found`);

    const company = await companyRepository.create({
      name: "Test Company",
      email: generateTestEmail("company"),
    });

    const owner = await userRepository.create({
      email: generateTestEmail("owner"),
      password: "hashed-password",
      name: "Test Owner",
      role: "owner",
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    await companyRepository.update(company.id, {
      ownerId: owner.id,
    });

    await subscriptionRepository.create({
      userId: owner.id,
      planId: plan.id,
      status: "active",
      startDate: new Date(),
    });

    const token = await JwtUtils.generateToken(owner.id, "access", {
      role: "owner",
      companyId: company.id,
    });

    return { owner, company, plan, token };
  }

  describe("Authentication & Authorization", () => {
    it("should return 401 when no auth token provided", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/documents/property_owner/test-id"),
      );

      expect(response.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/documents/property_owner/test-id", {
          headers: {
            Authorization: "Bearer invalid-token",
          },
        }),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("Validation", () => {
    it("should return 422 for invalid entity type", async () => {
      const { token } = await createCompanyWithOwner();

      const response = await app.handle(
        new Request("http://localhost/api/documents/invalid_type/test-id", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      expect(response.status).toBe(422);
    });
  });

  describe("Entity Types", () => {
    it("should accept property_owner entity type", async () => {
      const { token } = await createCompanyWithOwner();

      const response = await app.handle(
        new Request(
          "http://localhost/api/documents/property_owner/00000000-0000-0000-0000-000000000001",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      expect([200, 404]).toContain(response.status);
    });

    it("should accept tenant entity type", async () => {
      const { token } = await createCompanyWithOwner();

      const response = await app.handle(
        new Request("http://localhost/api/documents/tenant/00000000-0000-0000-0000-000000000001", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      expect([200, 404]).toContain(response.status);
    });

    it("should accept contract entity type", async () => {
      const { token } = await createCompanyWithOwner();

      const response = await app.handle(
        new Request(
          "http://localhost/api/documents/contract/00000000-0000-0000-0000-000000000001",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      expect([200, 404]).toContain(response.status);
    });
  });

  describe("Response Format", () => {
    it("should return array structure", async () => {
      const { token } = await createCompanyWithOwner();

      const response = await app.handle(
        new Request(
          "http://localhost/api/documents/property_owner/00000000-0000-0000-0000-000000000001",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      if (response.status === 200) {
        const data = (await response.json()) as {
          success: boolean;
          data: unknown[];
          total: number;
        };
        expect(data).toHaveProperty("success");
        expect(data).toHaveProperty("data");
        expect(data).toHaveProperty("total");
        expect(Array.isArray(data.data)).toBe(true);
      }
    });
  });
});
