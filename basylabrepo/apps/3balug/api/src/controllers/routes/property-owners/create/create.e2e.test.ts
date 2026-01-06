import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("POST /property-owners - Create Property Owner E2E", () => {
  const { client, userRepository, companyRepository, planRepository, subscriptionRepository } =
    createTestApp();

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

  describe("Authentication & Authorization", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.api["property-owners"].post({
        name: "João Proprietário",
        documentType: "cpf",
        document: "12345678909",
        phone: "11999999999",
      });

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client.api["property-owners"].post(
        {
          name: "João Proprietário",
          documentType: "cpf",
          document: "12345678909",
          phone: "11999999999",
        },
        {
          headers: {
            Authorization: "Bearer invalid-token",
          },
        },
      );

      expect(status).toBe(401);
    });

    it("should allow OWNER to create property owner", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client.api["property-owners"].post(
        {
          name: "João Proprietário",
          documentType: "cpf",
          document: "12345678909",
          phone: "11999999999",
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
    it("should return 422 when name is too short", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api["property-owners"].post(
        {
          name: "A",
          documentType: "cpf",
          document: "12345678909",
          phone: "11999999999",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 when document is too short", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api["property-owners"].post(
        {
          name: "João Proprietário",
          documentType: "cpf",
          document: "1234567890",
          phone: "11999999999",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 when phone is too short", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api["property-owners"].post(
        {
          name: "João Proprietário",
          documentType: "cpf",
          document: "12345678909",
          phone: "123456789",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 when email is invalid", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api["property-owners"].post(
        {
          name: "João Proprietário",
          documentType: "cpf",
          document: "12345678909",
          phone: "11999999999",
          email: "invalid-email",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 when documentType is invalid", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api["property-owners"].post(
        {
          name: "João Proprietário",
          documentType: "invalid" as "cpf",
          document: "12345678909",
          phone: "11999999999",
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
    it("should create a property owner with CPF", async () => {
      const { token, company } = await createUserWithSubscription("owner");

      const { status, data } = await client.api["property-owners"].post(
        {
          name: "João Proprietário",
          documentType: "cpf",
          document: "12345678909",
          phone: "11999999999",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.message).toBe("Proprietário criado com sucesso");
      expect(data?.data.name).toBe("João Proprietário");
      expect(data?.data.documentType).toBe("cpf");
      expect(data?.data.document).toBe("12345678909");
      expect(data?.data.companyId).toBe(company.id);
    });

    it("should create a property owner with CNPJ", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client.api["property-owners"].post(
        {
          name: "Empresa Proprietária LTDA",
          documentType: "cnpj",
          document: "11222333000181",
          phone: "11999999999",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.data.documentType).toBe("cnpj");
      expect(data?.data.document).toBe("11222333000181");
    });

    it("should create a property owner with all optional fields", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client.api["property-owners"].post(
        {
          name: "Maria Proprietária",
          documentType: "cpf",
          document: "52998224725",
          phone: "11988888888",
          email: "maria@email.com",
          address: "Rua das Flores, 123",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234567",
          birthDate: "1985-03-20",
          notes: "Proprietária desde 2015",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.data.name).toBe("Maria Proprietária");
      expect(data?.data.email).toBe("maria@email.com");
      expect(data?.data.address).toBe("Rua das Flores, 123");
      expect(data?.data.city).toBe("São Paulo");
      expect(data?.data.state).toBe("SP");
      expect(data?.data.notes).toBe("Proprietária desde 2015");
    });
  });
});
