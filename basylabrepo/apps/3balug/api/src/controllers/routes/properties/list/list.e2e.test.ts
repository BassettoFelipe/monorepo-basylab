import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("GET /properties - List Properties E2E", () => {
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
    propertyData: Partial<{
      title: string;
      type: string;
      listingType: string;
      city: string;
      rentalPrice: number;
      salePrice: number;
      bedrooms: number;
      status: string;
    }> = {},
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
      title: propertyData.title || "Apartamento Teste",
      type: propertyData.type || "apartment",
      listingType: propertyData.listingType || "rent",
      address: "Rua Teste, 123",
      city: propertyData.city || "São Paulo",
      state: "SP",
      zipCode: "01234567",
      rentalPrice: propertyData.rentalPrice,
      salePrice: propertyData.salePrice,
      bedrooms: propertyData.bedrooms,
      status: propertyData.status || "available",
      createdBy: createdById,
    });

    return { propertyOwner, property };
  }

  describe("Authentication & Authorization", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.api.properties.get();

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client.api.properties.get({
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(status).toBe(401);
    });

    it("should allow OWNER to list properties", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client.api.properties.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should allow MANAGER to list properties", async () => {
      const { token } = await createUserWithSubscription("manager");

      const { status, data } = await client.api.properties.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should allow BROKER to list properties", async () => {
      const { token } = await createUserWithSubscription("broker");

      const { status, data } = await client.api.properties.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });

    it("should allow INSURANCE_ANALYST to list properties", async () => {
      const { token } = await createUserWithSubscription("insurance_analyst");

      const { status, data } = await client.api.properties.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });
  });

  describe("Listing Properties", () => {
    it("should return empty list when no properties exist", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client.api.properties.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.data).toEqual([]);
      expect(data?.total).toBe(0);
    });

    it("should return properties from user company only", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Meu Apartamento",
      });

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
      await createPropertyWithOwner(company2.id, owner2.id, {
        title: "Outro Apartamento",
      });

      const { status, data } = await client.api.properties.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].title).toBe("Meu Apartamento");
    });

    it("should return all properties for company", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Apartamento 1",
      });
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Apartamento 2",
      });
      await createPropertyWithOwner(company.id, owner.id, { title: "Casa 1" });

      const { status, data } = await client.api.properties.get({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(3);
      expect(data?.total).toBe(3);
    });
  });

  describe("Filtering", () => {
    it("should filter by type", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Apartamento",
        type: "apartment",
      });
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Casa",
        type: "house",
      });

      const { status, data } = await client.api.properties.get({
        query: { type: "apartment" },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].type).toBe("apartment");
    });

    it("should filter by listingType", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Aluguel",
        listingType: "rent",
      });
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Venda",
        listingType: "sale",
      });

      const { status, data } = await client.api.properties.get({
        query: { listingType: "rent" },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].listingType).toBe("rent");
    });

    it("should filter by city", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createPropertyWithOwner(company.id, owner.id, {
        title: "SP",
        city: "São Paulo",
      });
      await createPropertyWithOwner(company.id, owner.id, {
        title: "RJ",
        city: "Rio de Janeiro",
      });

      const { status, data } = await client.api.properties.get({
        query: { city: "São Paulo" },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].city).toBe("São Paulo");
    });

    it("should filter by status", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Disponível",
        status: "available",
      });
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Alugado",
        status: "rented",
      });

      const { status, data } = await client.api.properties.get({
        query: { status: "available" },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].status).toBe("available");
    });

    it("should filter by rental price range", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Barato",
        rentalPrice: 100000,
      });
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Médio",
        rentalPrice: 200000,
      });
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Caro",
        rentalPrice: 500000,
      });

      const { status, data } = await client.api.properties.get({
        query: { minRentalPrice: 150000, maxRentalPrice: 300000 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].title).toBe("Médio");
    });

    it("should filter by bedrooms range", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createPropertyWithOwner(company.id, owner.id, {
        title: "1 quarto",
        bedrooms: 1,
      });
      await createPropertyWithOwner(company.id, owner.id, {
        title: "3 quartos",
        bedrooms: 3,
      });
      await createPropertyWithOwner(company.id, owner.id, {
        title: "5 quartos",
        bedrooms: 5,
      });

      const { status, data } = await client.api.properties.get({
        query: { minBedrooms: 2, maxBedrooms: 4 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].title).toBe("3 quartos");
    });

    it("should search by text", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Apartamento Centro",
      });
      await createPropertyWithOwner(company.id, owner.id, {
        title: "Casa Praia",
      });

      const { status, data } = await client.api.properties.get({
        query: { search: "Centro" },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(1);
      expect(data?.data[0].title).toBe("Apartamento Centro");
    });
  });

  describe("Pagination", () => {
    it("should paginate results with limit", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      for (let i = 1; i <= 5; i++) {
        await createPropertyWithOwner(company.id, owner.id, {
          title: `Apartamento ${i}`,
        });
      }

      const { status, data } = await client.api.properties.get({
        query: { limit: 2 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(2);
      expect(data?.total).toBe(5);
      expect(data?.limit).toBe(2);
    });

    it("should paginate results with offset", async () => {
      const { token, company, owner } = await createUserWithSubscription("owner");
      for (let i = 1; i <= 5; i++) {
        await createPropertyWithOwner(company.id, owner.id, {
          title: `Apartamento ${i}`,
        });
      }

      const { status, data } = await client.api.properties.get({
        query: { limit: 2, offset: 2 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(200);
      expect(data?.data.length).toBe(2);
      expect(data?.offset).toBe(2);
    });
  });
});
