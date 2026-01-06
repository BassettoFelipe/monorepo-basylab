import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("DELETE /documents/:id", () => {
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
        new Request("http://localhost/api/documents/00000000-0000-0000-0000-000000000001", {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/documents/00000000-0000-0000-0000-000000000001", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer invalid-token",
          },
        }),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("Validation", () => {
    it("should return 422 for invalid document id format", async () => {
      const { token } = await createCompanyWithOwner();

      const response = await app.handle(
        new Request("http://localhost/api/documents/invalid-uuid", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      expect(response.status).toBe(422);
    });
  });

  describe("Business Rules", () => {
    it("should return 404 when document does not exist", async () => {
      const { token } = await createCompanyWithOwner();

      const response = await app.handle(
        new Request("http://localhost/api/documents/00000000-0000-0000-0000-000000000999", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      expect(response.status).toBe(404);
      const data = (await response.json()) as { type: string };
      expect(data.type).toBe("NOT_FOUND");
    });
  });

  describe("Response Format", () => {
    it("should return consistent error format", async () => {
      const { token } = await createCompanyWithOwner();

      const response = await app.handle(
        new Request("http://localhost/api/documents/00000000-0000-0000-0000-000000000999", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      const error = await response.json();
      expect(error).toHaveProperty("type");
      expect(error).toHaveProperty("message");
    });
  });
});
