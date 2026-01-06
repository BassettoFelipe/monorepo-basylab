import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("PATCH /properties/:id - Update Property E2E", () => {
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

  async function createPropertyWithOwner(companyId: string, createdById: string) {
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
      title: "Apartamento Original",
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
        .patch({
          title: "Novo Título",
        });

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client.api
        .properties({ id: "00000000-0000-0000-0000-000000000001" })
        .patch(
          { title: "Novo Título" },
          {
            headers: {
              Authorization: "Bearer invalid-token",
            },
          },
        );

      expect(status).toBe(401);
    });

    it("should allow OWNER to update property", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).patch(
        { title: "Apartamento Atualizado" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should allow MANAGER to update property", async () => {
      const { token, company, owner } = await createUserWithSubscription("manager");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).patch(
        { title: "Apartamento Atualizado" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should allow BROKER to update property", async () => {
      const { token, company, owner, user: broker } = await createUserWithSubscription("broker");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      // Broker must be assigned to the property to update it
      await propertyRepository.update(property.id, { brokerId: broker.id });

      const { status, data } = await client.api.properties({ id: property.id }).patch(
        { title: "Apartamento Atualizado" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should not allow INSURANCE_ANALYST to update property", async () => {
      const { token, company, owner } = await createUserWithSubscription("insurance_analyst");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status } = await client.api.properties({ id: property.id }).patch(
        { title: "Apartamento Atualizado" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(403);
    });
  });

  describe("Input Validation", () => {
    it("should return 422 when id is not a valid UUID", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api.properties({ id: "invalid-uuid" }).patch(
        { title: "Novo Título" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 when title is too short", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status } = await client.api.properties({ id: property.id }).patch(
        { title: "AB" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 when type is invalid", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status } = await client.api.properties({ id: property.id }).patch(
        { type: "invalid" as "apartment" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 when status is invalid", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status } = await client.api.properties({ id: property.id }).patch(
        { status: "invalid" as "available" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });
  });

  describe("Successful Update", () => {
    it("should update property title", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).patch(
        { title: "Apartamento Renovado" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.message).toBe("Imóvel atualizado com sucesso");
      expect(data?.data.title).toBe("Apartamento Renovado");
    });

    it("should update property status", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).patch(
        { status: "rented" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.data.status).toBe("rented");
    });

    it("should update property type", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).patch(
        { type: "house" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.data.type).toBe("house");
    });

    it("should update property prices", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).patch(
        {
          rentalPrice: 200000,
          salePrice: 50000000,
          iptuPrice: 30000,
          condoFee: 50000,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.data.rentalPrice).toBe(200000);
      expect(data?.data.salePrice).toBe(50000000);
      expect(data?.data.iptuPrice).toBe(30000);
      expect(data?.data.condoFee).toBe(50000);
    });

    it("should update property features", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).patch(
        {
          features: {
            hasPool: true,
            hasGym: true,
            hasSecurity: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.data.features).toEqual({
        hasPool: true,
        hasGym: true,
        hasSecurity: true,
      });
    });

    it("should update multiple fields at once", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      const { status, data } = await client.api.properties({ id: property.id }).patch(
        {
          title: "Apartamento Premium",
          description: "Descrição atualizada",
          bedrooms: 3,
          bathrooms: 2,
          parkingSpaces: 2,
          area: 100,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.data.title).toBe("Apartamento Premium");
      expect(data?.data.description).toBe("Descrição atualizada");
      expect(data?.data.bedrooms).toBe(3);
      expect(data?.data.bathrooms).toBe(2);
      expect(data?.data.parkingSpaces).toBe(2);
      expect(data?.data.area).toBe(100);
    });

    it("should allow setting optional fields to null", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      // First set a description
      await client.api.properties({ id: property.id }).patch(
        { description: "Descrição inicial" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Then set it to null
      const { status, data } = await client.api.properties({ id: property.id }).patch(
        { description: null },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.data.description).toBeNull();
    });
  });

  describe("Business Rules", () => {
    it("should not allow updating property from another company", async () => {
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

      const { status } = await client.api.properties({ id: property.id }).patch(
        { title: "Tentativa de Atualização" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).not.toBe(200);
    });

    it("should return error for non-existent property", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api
        .properties({ id: "00000000-0000-0000-0000-000000000999" })
        .patch(
          { title: "Novo Título" },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

      expect(status).not.toBe(200);
    });

    it("should persist updates in repository", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const { property } = await createPropertyWithOwner(company.id, owner.id);

      await client.api.properties({ id: property.id }).patch(
        { title: "Apartamento Persistido" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const updatedProperty = await propertyRepository.findById(property.id);
      expect(updatedProperty?.title).toBe("Apartamento Persistido");
    });
  });
});
