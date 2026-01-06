import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("POST /tenants - Create Tenant E2E", () => {
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
      const { status } = await client.api.tenants.post({
        name: "João Silva",
        cpf: "12345678909",
        phone: "11999999999",
      });

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client.api.tenants.post(
        {
          name: "João Silva",
          cpf: "12345678909",
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

    it("should allow OWNER to create tenant", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client.api.tenants.post(
        {
          name: "João Silva",
          cpf: "12345678909",
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

      const { status } = await client.api.tenants.post(
        {
          name: "A",
          cpf: "12345678909",
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

    it("should return 422 when cpf is too short", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api.tenants.post(
        {
          name: "João Silva",
          cpf: "1234567890",
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

      const { status } = await client.api.tenants.post(
        {
          name: "João Silva",
          cpf: "12345678909",
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

      const { status } = await client.api.tenants.post(
        {
          name: "João Silva",
          cpf: "12345678909",
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

    it("should return 422 when state is not 2 characters", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client.api.tenants.post(
        {
          name: "João Silva",
          cpf: "12345678909",
          phone: "11999999999",
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
    it("should create a tenant with required fields only", async () => {
      const { token, company } = await createUserWithSubscription("owner");

      const { status, data } = await client.api.tenants.post(
        {
          name: "João Silva",
          cpf: "12345678909",
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
      expect(data?.message).toBe("Locatário criado com sucesso");
      expect(data?.data.name).toBe("João Silva");
      expect(data?.data.cpf).toBe("12345678909");
      expect(data?.data.phone).toBe("11999999999");
      expect(data?.data.companyId).toBe(company.id);
    });

    it("should create a tenant with all optional fields", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client.api.tenants.post(
        {
          name: "Maria Santos",
          cpf: "52998224725",
          phone: "11988888888",
          email: "maria@email.com",
          address: "Rua das Flores, 123",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234567",
          birthDate: "1990-05-15",
          monthlyIncome: 5000,
          employer: "Tech Company",
          emergencyContact: "Carlos Santos",
          emergencyPhone: "11977777777",
          notes: "Inquilina desde 2020",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.data.name).toBe("Maria Santos");
      expect(data?.data.email).toBe("maria@email.com");
      expect(data?.data.address).toBe("Rua das Flores, 123");
      expect(data?.data.city).toBe("São Paulo");
      expect(data?.data.state).toBe("SP");
      expect(data?.data.zipCode).toBe("01234567");
      expect(data?.data.monthlyIncome).toBe(5000);
      expect(data?.data.employer).toBe("Tech Company");
      expect(data?.data.emergencyContact).toBe("Carlos Santos");
      expect(data?.data.emergencyPhone).toBe("11977777777");
      expect(data?.data.notes).toBe("Inquilina desde 2020");
    });
  });
});
