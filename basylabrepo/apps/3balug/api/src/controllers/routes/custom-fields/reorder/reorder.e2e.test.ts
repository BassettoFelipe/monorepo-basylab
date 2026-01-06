import { beforeEach, describe, expect, it } from "bun:test";
import { FIELD_TYPES } from "@/db/schema/custom-fields";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("POST /custom-fields/reorder - Reorder Custom Fields E2E", () => {
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
      const { status } = await client["custom-fields"].reorder.post({
        fieldIds: ["id1", "id2"],
      });

      expect(status).toBe(401);
    });

    it("should return 403 when BROKER tries to reorder fields", async () => {
      const { token, company } = await createUserWithSubscription("broker");

      const field1 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 1",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      const field2 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 2",
        type: FIELD_TYPES.TEXT,
        order: 1,
        isActive: true,
      });

      const { status } = await client["custom-fields"].reorder.post(
        {
          fieldIds: [field2.id, field1.id],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(403);
    });

    it("should return 403 when MANAGER tries to reorder fields", async () => {
      const { token, company } = await createUserWithSubscription("manager");

      const field1 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 1",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      const { status } = await client["custom-fields"].reorder.post(
        {
          fieldIds: [field1.id],
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

  describe("Successful Reorder", () => {
    it("should reorder fields successfully", async () => {
      const { token, company } = await createUserWithSubscription("owner");

      const field1 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 1",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      const field2 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 2",
        type: FIELD_TYPES.TEXT,
        order: 1,
        isActive: true,
      });

      const field3 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 3",
        type: FIELD_TYPES.TEXT,
        order: 2,
        isActive: true,
      });

      const { status, data } = await client["custom-fields"].reorder.post(
        {
          fieldIds: [field3.id, field1.id, field2.id],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.message).toBe("Campos reordenados com sucesso");

      const updatedField1 = await customFieldRepository.findById(field1.id);
      const updatedField2 = await customFieldRepository.findById(field2.id);
      const updatedField3 = await customFieldRepository.findById(field3.id);

      expect(updatedField3?.order).toBe(0);
      expect(updatedField1?.order).toBe(1);
      expect(updatedField2?.order).toBe(2);
    });

    it("should handle partial reorder (subset of fields)", async () => {
      const { token, company } = await createUserWithSubscription("owner");

      const field1 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 1",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      const field2 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 2",
        type: FIELD_TYPES.TEXT,
        order: 1,
        isActive: true,
      });

      const { status } = await client["custom-fields"].reorder.post(
        {
          fieldIds: [field2.id, field1.id],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);

      const updatedField1 = await customFieldRepository.findById(field1.id);
      const updatedField2 = await customFieldRepository.findById(field2.id);

      expect(updatedField2?.order).toBe(0);
      expect(updatedField1?.order).toBe(1);
    });

    it("should ignore fields from other companies", async () => {
      const { token, company } = await createUserWithSubscription("owner");

      const otherCompany = await companyRepository.create({
        name: "Other Company",
        email: generateTestEmail("other"),
      });

      const myField = await customFieldRepository.create({
        companyId: company.id,
        label: "Meu Campo",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      const otherField = await customFieldRepository.create({
        companyId: otherCompany.id,
        label: "Campo de Outro",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      const { status } = await client["custom-fields"].reorder.post(
        {
          fieldIds: [otherField.id, myField.id],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);

      const updatedOtherField = await customFieldRepository.findById(otherField.id);
      expect(updatedOtherField?.order).toBe(0);
    });
  });

  describe("Input Validation", () => {
    it("should return 422 when fieldIds is not an array", async () => {
      const { token } = await createUserWithSubscription("owner");

      const { status } = await client["custom-fields"].reorder.post(
        {
          fieldIds: "not-an-array" as any,
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
});
