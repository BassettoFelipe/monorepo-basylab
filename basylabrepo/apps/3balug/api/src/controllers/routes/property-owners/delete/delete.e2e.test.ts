import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createAuthenticatedClient, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("DELETE /property-owners/:id - Delete Property Owner E2E", () => {
  const {
    client,
    userRepository,
    companyRepository,
    planRepository,
    subscriptionRepository,
    propertyOwnerRepository,
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

  async function createPropertyOwner(companyId: string, createdById: string) {
    return propertyOwnerRepository.create({
      companyId,
      name: "João Proprietário",
      documentType: "cpf",
      document: "12345678909",
      phone: "11999999999",
      createdBy: createdById,
    });
  }

  describe("Authentication & Authorization", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.api["property-owners"]({
        id: "00000000-0000-0000-0000-000000000001",
      }).delete();

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const authClient = createAuthenticatedClient("invalid-token");
      const { status } = await authClient.api["property-owners"]({
        id: "00000000-0000-0000-0000-000000000001",
      }).delete();

      expect(status).toBe(401);
    });

    it("should allow OWNER to delete property owner", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const propertyOwner = await createPropertyOwner(company.id, owner.id);

      const authClient = createAuthenticatedClient(token);
      const { status, data } = await authClient.api["property-owners"]({
        id: propertyOwner.id,
      }).delete();

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });
  });

  describe("Input Validation", () => {
    it("should return 422 when id is not a valid UUID", async () => {
      const { token } = await createUserWithSubscription("owner");

      const authClient = createAuthenticatedClient(token);
      const { status } = await authClient.api["property-owners"]({
        id: "invalid-uuid",
      }).delete();

      expect(status).toBe(422);
    });
  });

  describe("Successful Delete", () => {
    it("should delete property owner successfully", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const propertyOwner = await createPropertyOwner(company.id, owner.id);

      const authClient = createAuthenticatedClient(token);
      const { status, data } = await authClient.api["property-owners"]({
        id: propertyOwner.id,
      }).delete();

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.message).toBe("Proprietário excluído com sucesso.");

      // Verify property owner is actually deleted
      const deletedOwner = await propertyOwnerRepository.findById(propertyOwner.id);
      expect(deletedOwner).toBe(null);
    });
  });

  describe("Business Rules", () => {
    it("should not allow deleting property owner from another company", async () => {
      const { token } = await createUserWithSubscription("owner");

      // Create property owner in another company
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
      const propertyOwner = await createPropertyOwner(company2.id, owner2.id);

      const authClient = createAuthenticatedClient(token);
      const { status } = await authClient.api["property-owners"]({
        id: propertyOwner.id,
      }).delete();

      expect(status).not.toBe(200);
    });

    it("should return error for non-existent property owner", async () => {
      const { token } = await createUserWithSubscription("owner");

      const authClient = createAuthenticatedClient(token);
      const { status } = await authClient.api["property-owners"]({
        id: "00000000-0000-0000-0000-000000000999",
      }).delete();

      expect(status).not.toBe(200);
    });
  });
});
