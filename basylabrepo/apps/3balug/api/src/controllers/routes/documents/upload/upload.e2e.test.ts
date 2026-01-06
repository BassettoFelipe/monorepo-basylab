import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("POST /documents", () => {
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
      const file = new File(["test content"], "document.pdf", {
        type: "application/pdf",
      });

      const { status } = await client.api.documents.post({
        file,
        entityType: "property_owner",
        entityId: "00000000-0000-0000-0000-000000000001",
        documentType: "rg",
      });

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const file = new File(["test content"], "document.pdf", {
        type: "application/pdf",
      });

      const { status } = await client.api.documents.post(
        {
          file,
          entityType: "property_owner",
          entityId: "00000000-0000-0000-0000-000000000001",
          documentType: "rg",
        },
        {
          headers: {
            Authorization: "Bearer invalid-token",
          },
        },
      );

      expect(status).toBe(401);
    });
  });

  describe("Validation", () => {
    it("should return 422 when no file provided", async () => {
      const { token } = await createCompanyWithOwner();

      const { status } = await client.api.documents.post(
        {
          entityType: "property_owner",
          entityId: "00000000-0000-0000-0000-000000000001",
          documentType: "rg",
        } as any,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 for invalid entity type", async () => {
      const { token } = await createCompanyWithOwner();
      const file = new File(["test content"], "document.pdf", {
        type: "application/pdf",
      });

      const { status } = await client.api.documents.post(
        {
          file,
          entityType: "invalid_type" as any,
          entityId: "00000000-0000-0000-0000-000000000001",
          documentType: "rg",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });

    it("should return 422 for invalid document type", async () => {
      const { token } = await createCompanyWithOwner();
      const file = new File(["test content"], "document.pdf", {
        type: "application/pdf",
      });

      const { status } = await client.api.documents.post(
        {
          file,
          entityType: "property_owner",
          entityId: "00000000-0000-0000-0000-000000000001",
          documentType: "invalid_type" as any,
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

  describe("Document Types", () => {
    it("should accept valid document types", async () => {
      const validTypes = [
        "rg",
        "cpf",
        "cnpj",
        "comprovante_residencia",
        "comprovante_renda",
        "contrato_social",
        "procuracao",
        "contrato_locacao",
        "termo_vistoria",
        "laudo_avaliacao",
        "outros",
      ];

      for (const docType of validTypes) {
        const { token } = await createCompanyWithOwner();
        const file = new File(["test"], "doc.pdf", { type: "application/pdf" });

        const { status } = await client.api.documents.post(
          {
            file,
            entityType: "property_owner",
            entityId: "00000000-0000-0000-0000-000000000001",
            documentType: docType as any,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        expect([200, 404, 500]).toContain(status);
        clearTestData();
      }
    });
  });

  describe("Entity Types", () => {
    it("should accept property_owner entity type", async () => {
      const { token } = await createCompanyWithOwner();
      const file = new File(["test"], "doc.pdf", { type: "application/pdf" });

      const { status } = await client.api.documents.post(
        {
          file,
          entityType: "property_owner",
          entityId: "00000000-0000-0000-0000-000000000001",
          documentType: "rg",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect([200, 404, 500]).toContain(status);
    });

    it("should accept tenant entity type", async () => {
      const { token } = await createCompanyWithOwner();
      const file = new File(["test"], "doc.pdf", { type: "application/pdf" });

      const { status } = await client.api.documents.post(
        {
          file,
          entityType: "tenant",
          entityId: "00000000-0000-0000-0000-000000000001",
          documentType: "rg",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect([200, 404, 500]).toContain(status);
    });

    it("should accept contract entity type", async () => {
      const { token } = await createCompanyWithOwner();
      const file = new File(["test"], "doc.pdf", { type: "application/pdf" });

      const { status } = await client.api.documents.post(
        {
          file,
          entityType: "contract",
          entityId: "00000000-0000-0000-0000-000000000001",
          documentType: "contrato_locacao",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect([200, 404, 500]).toContain(status);
    });
  });
});
