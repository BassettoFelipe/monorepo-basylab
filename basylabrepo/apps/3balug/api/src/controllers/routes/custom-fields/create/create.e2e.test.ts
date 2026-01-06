import { beforeEach, describe, expect, it } from "bun:test";
import { FIELD_TYPES } from "@/db/schema/custom-fields";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("POST /custom-fields - Create Custom Field E2E", () => {
  const {
    client,
    userRepository,
    companyRepository,
    planRepository,
    subscriptionRepository,
    customFieldRepository,
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

  describe("Authentication & Authorization", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client["custom-fields"].post({
        label: "Test Field",
        type: FIELD_TYPES.TEXT,
      });

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client["custom-fields"].post(
        {
          label: "Test Field",
          type: FIELD_TYPES.TEXT,
        },
        {
          headers: {
            Authorization: "Bearer invalid-token",
          },
        },
      );

      expect(status).toBe(401);
    });

    it("should return 403 when BROKER tries to create field", async () => {
      const { token } = await createUserWithSubscription("broker");

      const { status } = await client["custom-fields"].post(
        {
          label: "Test Field",
          type: FIELD_TYPES.TEXT,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(403);
    });

    it("should return 403 when MANAGER tries to create field", async () => {
      const { token } = await createUserWithSubscription("manager");

      const { status } = await client["custom-fields"].post(
        {
          label: "Test Field",
          type: FIELD_TYPES.TEXT,
        },
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
    it("should return 422 when label is too short", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client["custom-fields"].post(
        {
          label: "A",
          type: FIELD_TYPES.TEXT,
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

      const { status } = await client["custom-fields"].post(
        {
          label: "Test Field",
          type: "invalid_type" as any,
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
    it("should create a simple text field", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client["custom-fields"].post(
        {
          label: "Nome Completo",
          type: FIELD_TYPES.TEXT,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.message).toBe("Campo criado com sucesso");
      expect(data?.data.label).toBe("Nome Completo");
      expect(data?.data.type).toBe(FIELD_TYPES.TEXT);
      expect(data?.data.isActive).toBe(true);
    });

    it("should create a required field with placeholder and help text", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client["custom-fields"].post(
        {
          label: "Email Secundário",
          type: FIELD_TYPES.EMAIL,
          placeholder: "email@exemplo.com",
          helpText: "Informe um email alternativo para contato",
          isRequired: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.data.label).toBe("Email Secundário");
      expect(data?.data.type).toBe(FIELD_TYPES.EMAIL);
      expect(data?.data.placeholder).toBe("email@exemplo.com");
      expect(data?.data.helpText).toBe("Informe um email alternativo para contato");
      expect(data?.data.isRequired).toBe(true);
    });

    it("should create a select field with options", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client["custom-fields"].post(
        {
          label: "Estado Civil",
          type: FIELD_TYPES.SELECT,
          options: ["Solteiro", "Casado", "Divorciado", "Viúvo"],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.data.type).toBe(FIELD_TYPES.SELECT);
      expect(data?.data.options).toEqual(["Solteiro", "Casado", "Divorciado", "Viúvo"]);
    });

    it("should create a number field with validation", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client["custom-fields"].post(
        {
          label: "Idade",
          type: FIELD_TYPES.NUMBER,
          validation: {
            min: 18,
            max: 120,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.data.type).toBe(FIELD_TYPES.NUMBER);
      expect(data?.data.validation).toEqual({ min: 18, max: 120 });
    });

    it("should create a file field with config", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client["custom-fields"].post(
        {
          label: "Documento",
          type: FIELD_TYPES.FILE,
          fileConfig: {
            maxFileSize: 5,
            maxFiles: 3,
            allowedTypes: ["application/pdf", "image/*"],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.data.type).toBe(FIELD_TYPES.FILE);
      expect(data?.data.fileConfig).toEqual({
        maxFileSize: 5,
        maxFiles: 3,
        allowedTypes: ["application/pdf", "image/*"],
      });
    });

    it("should create checkbox field with allowMultiple", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status, data } = await client["custom-fields"].post(
        {
          label: "Interesses",
          type: FIELD_TYPES.CHECKBOX,
          options: ["Aluguel", "Venda", "Temporada"],
          allowMultiple: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.data.type).toBe(FIELD_TYPES.CHECKBOX);
      expect(data?.data.allowMultiple).toBe(true);
    });
  });

  describe("Plan Feature Check", () => {
    it("should return 403 when plan does not have custom fields feature", async () => {
      const { token } = await createUserWithSubscription("owner", "basico");

      const { status } = await client["custom-fields"].post(
        {
          label: "Test Field",
          type: FIELD_TYPES.TEXT,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(403);
    });
  });

  describe("Field Ordering", () => {
    it("should auto-increment order for new fields", async () => {
      const { token, company } = await createUserWithSubscription("owner");

      await customFieldRepository.create({
        companyId: company.id,
        label: "Primeiro",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      const { data } = await client["custom-fields"].post(
        {
          label: "Segundo",
          type: FIELD_TYPES.TEXT,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(data?.data.order).toBeGreaterThan(0);
    });
  });
});
