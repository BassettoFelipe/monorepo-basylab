import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("POST /properties - Create Property E2E", () => {
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
      name: "Property Owner",
      email: generateTestEmail("property-owner"),
      phone: "11999999999",
      document: "12345678901",
      createdBy: createdById,
    });
  }

  describe("Authentication & Authorization", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.api.properties.post({
        ownerId: "00000000-0000-0000-0000-000000000001",
        title: "Apartamento Teste",
        type: "apartment",
        listingType: "rent",
        address: "Rua Teste, 123",
        city: "São Paulo",
        state: "SP",
      });

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client.api.properties.post(
        {
          ownerId: "00000000-0000-0000-0000-000000000001",
          title: "Apartamento Teste",
          type: "apartment",
          listingType: "rent",
          address: "Rua Teste, 123",
          city: "São Paulo",
          state: "SP",
        },
        {
          headers: {
            Authorization: "Bearer invalid-token",
          },
        },
      );

      expect(status).toBe(401);
    });

    it("should allow OWNER to create property", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const propertyOwner = await createPropertyOwner(company.id, owner.id);

      const { status, data } = await client.api.properties.post(
        {
          ownerId: propertyOwner.id,
          title: "Apartamento Teste",
          type: "apartment",
          listingType: "rent",
          address: "Rua Teste, 123",
          city: "São Paulo",
          state: "SP",
          rentalPrice: 150000,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });
  });

  describe("Input Validation", () => {
    it("should return 422 when ownerId is not a valid UUID", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api.properties.post(
        {
          ownerId: "invalid-uuid",
          title: "Apartamento Teste",
          type: "apartment",
          listingType: "rent",
          address: "Rua Teste, 123",
          city: "São Paulo",
          state: "SP",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 when title is too short", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api.properties.post(
        {
          ownerId: "00000000-0000-0000-0000-000000000001",
          title: "AB",
          type: "apartment",
          listingType: "rent",
          address: "Rua Teste, 123",
          city: "São Paulo",
          state: "SP",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 when type is invalid", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api.properties.post(
        {
          ownerId: "00000000-0000-0000-0000-000000000001",
          title: "Apartamento Teste",
          type: "invalid" as "apartment",
          listingType: "rent",
          address: "Rua Teste, 123",
          city: "São Paulo",
          state: "SP",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 when listingType is invalid", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api.properties.post(
        {
          ownerId: "00000000-0000-0000-0000-000000000001",
          title: "Apartamento Teste",
          type: "apartment",
          listingType: "invalid" as "rent",
          address: "Rua Teste, 123",
          city: "São Paulo",
          state: "SP",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 when state is not 2 characters", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api.properties.post(
        {
          ownerId: "00000000-0000-0000-0000-000000000001",
          title: "Apartamento Teste",
          type: "apartment",
          listingType: "rent",
          address: "Rua Teste, 123",
          city: "São Paulo",
          state: "São Paulo",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });
  });

  describe("Successful Creation", () => {
    it("should create a property with required fields only", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const propertyOwner = await createPropertyOwner(company.id, owner.id);

      const { status, data } = await client.api.properties.post(
        {
          ownerId: propertyOwner.id,
          title: "Apartamento Centro",
          type: "apartment",
          listingType: "rent",
          address: "Rua Teste, 123",
          city: "São Paulo",
          state: "SP",
          rentalPrice: 150000,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.message).toBe("Imóvel criado com sucesso");
      expect(data?.data.title).toBe("Apartamento Centro");
      expect(data?.data.type).toBe("apartment");
      expect(data?.data.listingType).toBe("rent");
      expect(data?.data.status).toBe("available");
      expect(data?.data.ownerId).toBe(propertyOwner.id);
      expect(data?.data.companyId).toBe(company.id);
    });

    it("should create a property with all optional fields", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const propertyOwner = await createPropertyOwner(company.id, owner.id);

      const { status, data } = await client.api.properties.post(
        {
          ownerId: propertyOwner.id,
          title: "Apartamento Luxo",
          description: "Apartamento de alto padrão com vista para o mar",
          type: "apartment",
          listingType: "both",
          address: "Av. Beira Mar, 500",
          neighborhood: "Praia Grande",
          city: "Santos",
          state: "SP",
          zipCode: "11050000",
          bedrooms: 3,
          bathrooms: 2,
          parkingSpaces: 2,
          area: 120,
          rentalPrice: 500000,
          salePrice: 120000000,
          iptuPrice: 50000,
          condoFee: 100000,
          features: {
            hasPool: true,
            hasGym: true,
            hasBalcony: true,
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
      expect(data?.success).toBe(true);
      expect(data?.data.description).toBe("Apartamento de alto padrão com vista para o mar");
      expect(data?.data.neighborhood).toBe("Praia Grande");
      expect(data?.data.bedrooms).toBe(3);
      expect(data?.data.bathrooms).toBe(2);
      expect(data?.data.parkingSpaces).toBe(2);
      expect(data?.data.area).toBe(120);
      expect(data?.data.rentalPrice).toBe(500000);
      expect(data?.data.salePrice).toBe(120000000);
      expect(data?.data.features).toEqual({
        hasPool: true,
        hasGym: true,
        hasBalcony: true,
        hasSecurity: true,
      });
    });

    it("should create properties of all types", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      const propertyOwner = await createPropertyOwner(company.id, owner.id);

      const types = ["house", "apartment", "land", "commercial", "rural"] as const;

      for (const type of types) {
        const { status, data } = await client.api.properties.post(
          {
            ownerId: propertyOwner.id,
            title: `Imóvel tipo ${type}`,
            type,
            listingType: "rent",
            address: "Rua Teste, 123",
            city: "São Paulo",
            state: "SP",
            rentalPrice: 150000,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        expect(status).toBe(200);
        expect(data?.data.type).toBe(type);
      }
    });
  });

  describe("Business Rules", () => {
    it("should not allow creating property for owner from another company", async () => {
      const { token } = await createUserWithSubscription("owner");

      // Create another company with property owner
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

      const { status } = await client.api.properties.post(
        {
          ownerId: propertyOwner.id,
          title: "Apartamento Teste",
          type: "apartment",
          listingType: "rent",
          address: "Rua Teste, 123",
          city: "São Paulo",
          state: "SP",
          rentalPrice: 150000,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).not.toBe(200);
    });

    it("should not allow creating property for non-existent owner", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api.properties.post(
        {
          ownerId: "00000000-0000-0000-0000-000000000999",
          title: "Apartamento Teste",
          type: "apartment",
          listingType: "rent",
          address: "Rua Teste, 123",
          city: "São Paulo",
          state: "SP",
          rentalPrice: 150000,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).not.toBe(200);
    });
  });
});
