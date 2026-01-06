import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createAuthenticatedClient, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("DELETE /users/:id/permanent", () => {
  const { client, userRepository, companyRepository, planRepository, subscriptionRepository } =
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
      const { status } = await client.api
        .users({ id: "00000000-0000-0000-0000-000000000001" })
        .permanent.delete();

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const authClient = createAuthenticatedClient("invalid-token");
      const { status } = await authClient.api
        .users({ id: "00000000-0000-0000-0000-000000000001" })
        .permanent.delete();

      expect(status).toBe(401);
    });

    it("should return 403 when BROKER tries to delete user", async () => {
      const { company } = await createCompanyWithOwner();

      const broker = await userRepository.create({
        email: generateTestEmail("broker"),
        password: "hashed-password",
        name: "Broker User",
        role: "broker",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const targetUser = await userRepository.create({
        email: generateTestEmail("target"),
        password: "hashed-password",
        name: "Target User",
        role: "broker",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const brokerToken = await JwtUtils.generateToken(broker.id, "access", {
        role: "broker",
        companyId: company.id,
      });

      const authClient = createAuthenticatedClient(brokerToken);
      const { status } = await authClient.api.users({ id: targetUser.id }).permanent.delete();

      expect(status).toBe(403);
    });

    it("should return 403 when MANAGER tries to delete user", async () => {
      const { company } = await createCompanyWithOwner("house");

      const manager = await userRepository.create({
        email: generateTestEmail("manager"),
        password: "hashed-password",
        name: "Manager User",
        role: "manager",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const targetUser = await userRepository.create({
        email: generateTestEmail("target"),
        password: "hashed-password",
        name: "Target User",
        role: "broker",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const managerToken = await JwtUtils.generateToken(manager.id, "access", {
        role: "manager",
        companyId: company.id,
      });

      const authClient = createAuthenticatedClient(managerToken);
      const { status } = await authClient.api.users({ id: targetUser.id }).permanent.delete();

      expect(status).toBe(403);
    });
  });

  describe("Business Rules", () => {
    it("should delete user permanently when OWNER", async () => {
      const { token, company } = await createCompanyWithOwner();

      const targetUser = await userRepository.create({
        email: generateTestEmail("target"),
        password: "hashed-password",
        name: "Target User",
        role: "broker",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const authClient = createAuthenticatedClient(token);
      const { status, data } = await authClient.api.users({ id: targetUser.id }).permanent.delete();

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.data.id).toBe(targetUser.id);
      expect(data?.data.email).toBe(targetUser.email);

      const deletedUser = await userRepository.findById(targetUser.id);
      expect(deletedUser).toBeNull();
    });

    it("should return 404 when user does not exist", async () => {
      const { token } = await createCompanyWithOwner();

      const authClient = createAuthenticatedClient(token);
      const { status, error } = await authClient.api
        .users({ id: "00000000-0000-0000-0000-000000000999" })
        .permanent.delete();

      expect(status).toBe(404);
      expect((error?.value as { type: string }).type).toBe("NOT_FOUND");
    });

    it("should return 403 when trying to delete user from another company", async () => {
      const { token } = await createCompanyWithOwner();

      const otherCompany = await companyRepository.create({
        name: "Other Company",
        email: generateTestEmail("other-company"),
      });

      const otherUser = await userRepository.create({
        email: generateTestEmail("other-user"),
        password: "hashed-password",
        name: "Other User",
        role: "broker",
        companyId: otherCompany.id,
        isActive: true,
        isEmailVerified: true,
      });

      const authClient = createAuthenticatedClient(token);
      const { status, error } = await authClient.api.users({ id: otherUser.id }).permanent.delete();

      expect(status).toBe(403);
      expect((error?.value as { type: string }).type).toBe("FORBIDDEN");
    });

    it("should return 403 when trying to delete owner", async () => {
      const { token, company } = await createCompanyWithOwner();

      const anotherOwner = await userRepository.create({
        email: generateTestEmail("another-owner"),
        password: "hashed-password",
        name: "Another Owner",
        role: "owner",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const authClient = createAuthenticatedClient(token);
      const { status, error } = await authClient.api
        .users({ id: anotherOwner.id })
        .permanent.delete();

      expect(status).toBe(403);
      expect((error?.value as { type: string }).type).toBe("FORBIDDEN");
    });

    it("should return 403 when trying to delete self (owner cannot be deleted)", async () => {
      const { token, owner } = await createCompanyWithOwner();

      const authClient = createAuthenticatedClient(token);
      const { status, error } = await authClient.api.users({ id: owner.id }).permanent.delete();

      // Owner trying to delete self returns 403 because owners cannot be deleted
      expect(status).toBe(403);
      expect((error?.value as { type: string }).type).toBe("FORBIDDEN");
    });

    it("should delete manager successfully", async () => {
      const { token, company } = await createCompanyWithOwner("house");

      const manager = await userRepository.create({
        email: generateTestEmail("manager-to-delete"),
        password: "hashed-password",
        name: "Manager To Delete",
        role: "manager",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const authClient = createAuthenticatedClient(token);
      const { status, data } = await authClient.api.users({ id: manager.id }).permanent.delete();

      expect(status).toBe(200);
      expect(data?.success).toBe(true);

      const deletedManager = await userRepository.findById(manager.id);
      expect(deletedManager).toBeNull();
    });
  });

  describe("Input Validation", () => {
    it("should return 422 for invalid user id format", async () => {
      const { token } = await createCompanyWithOwner();

      const authClient = createAuthenticatedClient(token);
      const { status } = await authClient.api.users({ id: "invalid-uuid" }).permanent.delete();

      expect(status).toBe(422);
    });
  });

  describe("Response Format", () => {
    it("should return consistent response format", async () => {
      const { token, company } = await createCompanyWithOwner();

      const targetUser = await userRepository.create({
        email: generateTestEmail("format-test"),
        password: "hashed-password",
        name: "Format Test User",
        role: "broker",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const authClient = createAuthenticatedClient(token);
      const { data } = await authClient.api.users({ id: targetUser.id }).permanent.delete();

      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("data");
      expect(data?.data).toHaveProperty("id");
      expect(data?.data).toHaveProperty("email");
      expect(data?.data).toHaveProperty("name");
      expect(typeof data?.success).toBe("boolean");
      expect(typeof data?.message).toBe("string");
    });
  });
});
