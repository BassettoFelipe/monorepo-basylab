import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("GET /properties/:id - Get Property E2E", () => {
  const {
    client,
    userRepository,
    companyRepository,
    planRepository,
    subscriptionRepository,
    propertyOwnerRepository,
    propertyRepository,
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

  async function createPropertyWithOwner(
    companyId: string,
    createdById: string,
    brokerId?: string,
  ) {
    const propertyOwner = await propertyOwnerRepository.create({
      companyId,
      name: "Property Owner",
      email: generateTestEmail("property-owner"),
      phone: "11999999999",
      document: "12345678901",
      createdBy: createdById,
    });

    const property = await propertyRepository.create({
      companyId,
      ownerId: propertyOwner.id,
      brokerId,
      title: "Apartamento Teste",
      type: "apartment",
      listingType: "rent",
      address: "Rua Teste, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234567",
      rentalPrice: 150000,
      createdBy: createdById,
    });

    return { propertyOwner, property };
  }

  describe("Authentication & Authorization", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.api
        .properties({ id: "00000000-0000-0000-0000-000000000001" })
        .get();

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client.api
        .properties({ id: "00000000-0000-0000-0000-000000000001" })
        .get({
          headers: {
            Authorization: "Bearer invalid-token",
          },
        });

      expect(status).toBe(401);
    });

    it("should allow OWNER to get property", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should allow MANAGER to get property", async () => {
      const { token, company, owner } = await createUserWithSubscription("manager");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should allow BROKER to get property", async () => {
      const { token, company, owner, user: broker } = await createUserWithSubscription("broker");
      // Broker must be assigned to the property to view it
      const { property } = await createPropertyWithOwner(company.id, owner.id, broker.id);

      const { status, data } = await client.api.properties({ id: property.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should allow INSURANCE_ANALYST to get property", async () => {
      const { token, company, owner } = await createUserWithSubscription("insurance_analyst");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).get({
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

      const { status } = await client.api.properties({ id: "invalid-uuid" }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(422);
    });
  });

  describe("Getting Property", () => {
    it("should return property with all details", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.data.id).toBe(property.id);
      expect(data?.data.title).toBe("Apartamento Teste");
      expect(data?.data.type).toBe("apartment");
      expect(data?.data.owner).toBeDefined();
      expect(data?.data.owner?.id).toBe(propertyOwner.id);
      expect(data?.data.owner?.name).toBe("Property Owner");
      expect(data?.data.photos).toBeDefined();
      expect(Array.isArray(data?.data.photos)).toBe(true);
    });

    it("should return property with broker info when assigned", async () => {
      const { token, company, owner, user } = await createUserWithSubscription("broker");
      const { property } = await createPropertyWithOwner(company.id, owner.id, user.id);

      const { status, data } = await client.api.properties({ id: property.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.broker).toBeDefined();
      expect(data?.data.broker?.id).toBe(user.id);
      expect(data?.data.broker?.name).toBe("broker User");
    });

    it("should return null broker when not assigned", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.broker).toBeNull();
    });
  });

  describe("Business Rules", () => {
    it("should not allow getting property from another company", async () => {
      const { token } = await createUserWithSubscription("owner");

      // Create property in another company
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

      const { property } = await createPropertyWithOwner(company2.id, owner2.id);

      const { status } = await client.api.properties({ id: property.id }).get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).not.toBe(200);
    });

    it("should return 404 for non-existent property", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api
        .properties({ id: "00000000-0000-0000-0000-000000000999" })
        .get({
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

      expect(status).not.toBe(200);
    });
  });
});
