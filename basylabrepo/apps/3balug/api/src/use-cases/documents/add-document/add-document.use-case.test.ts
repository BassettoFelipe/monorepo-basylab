import { beforeEach, describe, expect, test } from "bun:test";
import type { Company } from "@/db/schema/companies";
import { DOCUMENT_ENTITY_TYPES, DOCUMENT_TYPES } from "@/db/schema/documents";
import type { PropertyOwner } from "@/db/schema/property-owners";
import type { Tenant } from "@/db/schema/tenants";
import type { User } from "@/db/schema/users";
import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError } from "@/errors";
import {
  InMemoryCompanyRepository,
  InMemoryDocumentRepository,
  InMemoryPropertyOwnerRepository,
  InMemoryTenantRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { AddDocumentUseCase } from "./add-document.use-case";

describe("AddDocumentUseCase", () => {
  let useCase: AddDocumentUseCase;
  let documentRepository: InMemoryDocumentRepository;
  let propertyOwnerRepository: InMemoryPropertyOwnerRepository;
  let tenantRepository: InMemoryTenantRepository;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;

  let company: Company;
  let ownerUser: User;
  let managerUser: User;
  let brokerUser: User;
  let propertyOwner: PropertyOwner;
  let tenant: Tenant;

  beforeEach(async () => {
    // Setup repositories
    documentRepository = new InMemoryDocumentRepository();
    propertyOwnerRepository = new InMemoryPropertyOwnerRepository();
    tenantRepository = new InMemoryTenantRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    useCase = new AddDocumentUseCase(documentRepository, propertyOwnerRepository, tenantRepository);

    // Create test data
    company = await companyRepository.create({
      name: "Imobiliária Teste",
      cnpj: "12345678901234",
    });

    ownerUser = await userRepository.create({
      name: "Owner User",
      email: "owner@test.com",
      password: "hashed_password",
      role: USER_ROLES.OWNER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    managerUser = await userRepository.create({
      name: "Manager User",
      email: "manager@test.com",
      password: "hashed_password",
      role: USER_ROLES.MANAGER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    brokerUser = await userRepository.create({
      name: "Broker User",
      email: "broker@test.com",
      password: "hashed_password",
      role: USER_ROLES.BROKER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    propertyOwner = await propertyOwnerRepository.create({
      companyId: company.id,
      name: "Property Owner",
      email: "owner1@test.com",
      documentType: "cpf",
      document: "12345678901",
      createdBy: ownerUser.id,
    });

    tenant = await tenantRepository.create({
      companyId: company.id,
      name: "Tenant 1",
      email: "tenant1@test.com",
      cpf: "98765432100",
      createdBy: ownerUser.id,
    });
  });

  describe("Casos de Sucesso", () => {
    test("deve adicionar documento PDF para property owner", async () => {
      const result = await useCase.execute({
        entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
        entityId: propertyOwner.id,
        documentType: DOCUMENT_TYPES.RG,
        filename: "rg-123.pdf",
        originalName: "RG Frente.pdf",
        mimeType: "application/pdf",
        size: 1024 * 500, // 500KB
        url: "https://storage.example.com/documents/rg-123.pdf",
        description: "RG frente",
        user: ownerUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.entityType).toBe(DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER);
      expect(result.entityId).toBe(propertyOwner.id);
      expect(result.documentType).toBe(DOCUMENT_TYPES.RG);
      expect(result.filename).toBe("rg-123.pdf");
      expect(result.originalName).toBe("RG Frente.pdf");
      expect(result.mimeType).toBe("application/pdf");
      expect(result.size).toBe(1024 * 500);
      expect(result.url).toBe("https://storage.example.com/documents/rg-123.pdf");
      expect(result.description).toBe("RG frente");
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    test("deve adicionar documento imagem JPEG para tenant", async () => {
      const result = await useCase.execute({
        entityType: DOCUMENT_ENTITY_TYPES.TENANT,
        entityId: tenant.id,
        documentType: DOCUMENT_TYPES.CPF,
        filename: "cpf-456.jpg",
        originalName: "CPF.jpg",
        mimeType: "image/jpeg",
        size: 1024 * 300,
        url: "https://storage.example.com/documents/cpf-456.jpg",
        user: managerUser,
      });

      expect(result).toBeDefined();
      expect(result.entityType).toBe(DOCUMENT_ENTITY_TYPES.TENANT);
      expect(result.entityId).toBe(tenant.id);
      expect(result.documentType).toBe(DOCUMENT_TYPES.CPF);
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.description).toBe(null);
    });

    test("deve adicionar documento PNG", async () => {
      const result = await useCase.execute({
        entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
        entityId: propertyOwner.id,
        documentType: DOCUMENT_TYPES.COMPROVANTE_RESIDENCIA,
        filename: "comprovante.png",
        originalName: "Comprovante de Endereço.png",
        mimeType: "image/png",
        size: 1024 * 200,
        url: "https://storage.example.com/documents/comprovante.png",
        user: ownerUser,
      });

      expect(result.mimeType).toBe("image/png");
    });

    test("deve adicionar documento WEBP", async () => {
      const result = await useCase.execute({
        entityType: DOCUMENT_ENTITY_TYPES.TENANT,
        entityId: tenant.id,
        documentType: DOCUMENT_TYPES.CONTRATO_SOCIAL,
        filename: "contrato.webp",
        originalName: "Contrato Social.webp",
        mimeType: "image/webp",
        size: 1024 * 100,
        url: "https://storage.example.com/documents/contrato.webp",
        user: ownerUser,
      });

      expect(result.mimeType).toBe("image/webp");
    });

    test("deve permitir BROKER adicionar documento em property owner criado por ele", async () => {
      const brokerOwner = await propertyOwnerRepository.create({
        companyId: company.id,
        name: "Broker's Owner",
        email: "brokerowner@test.com",
        documentType: "cpf",
        document: "11122233344",
        createdBy: brokerUser.id,
      });

      const result = await useCase.execute({
        entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
        entityId: brokerOwner.id,
        documentType: DOCUMENT_TYPES.RG,
        filename: "rg.pdf",
        originalName: "RG.pdf",
        mimeType: "application/pdf",
        size: 1024 * 500,
        url: "https://storage.example.com/documents/rg.pdf",
        user: brokerUser,
      });

      expect(result).toBeDefined();
      expect(result.entityId).toBe(brokerOwner.id);
    });

    test("deve permitir BROKER adicionar documento em tenant criado por ele", async () => {
      const brokerTenant = await tenantRepository.create({
        companyId: company.id,
        name: "Broker's Tenant",
        email: "brokertenant@test.com",
        cpf: "55566677788",
        createdBy: brokerUser.id,
      });

      const result = await useCase.execute({
        entityType: DOCUMENT_ENTITY_TYPES.TENANT,
        entityId: brokerTenant.id,
        documentType: DOCUMENT_TYPES.CPF,
        filename: "cpf.pdf",
        originalName: "CPF.pdf",
        mimeType: "application/pdf",
        size: 1024 * 500,
        url: "https://storage.example.com/documents/cpf.pdf",
        user: brokerUser,
      });

      expect(result).toBeDefined();
      expect(result.entityId).toBe(brokerTenant.id);
    });

    test("deve adicionar múltiplos documentos diferentes para mesma entidade", async () => {
      const doc1 = await useCase.execute({
        entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
        entityId: propertyOwner.id,
        documentType: DOCUMENT_TYPES.RG,
        filename: "rg.pdf",
        originalName: "RG.pdf",
        mimeType: "application/pdf",
        size: 1024 * 500,
        url: "https://storage.example.com/documents/rg.pdf",
        user: ownerUser,
      });

      const doc2 = await useCase.execute({
        entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
        entityId: propertyOwner.id,
        documentType: DOCUMENT_TYPES.CPF,
        filename: "cpf.pdf",
        originalName: "CPF.pdf",
        mimeType: "application/pdf",
        size: 1024 * 500,
        url: "https://storage.example.com/documents/cpf.pdf",
        user: ownerUser,
      });

      expect(doc1.id).not.toBe(doc2.id);
      expect(doc1.entityId).toBe(doc2.entityId);
    });
  });

  describe("Validações de Permissão", () => {
    test("deve lançar erro para role não autorizada", async () => {
      const insuranceAnalyst = await userRepository.create({
        name: "Insurance Analyst",
        email: "analyst@test.com",
        password: "password",
        role: USER_ROLES.INSURANCE_ANALYST,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
          entityId: propertyOwner.id,
          documentType: DOCUMENT_TYPES.RG,
          filename: "rg.pdf",
          originalName: "RG.pdf",
          mimeType: "application/pdf",
          size: 1024 * 500,
          url: "https://storage.example.com/documents/rg.pdf",
          user: insuranceAnalyst,
        }),
      ).rejects.toThrow(new ForbiddenError("Voce nao tem permissao para adicionar documentos."));
    });

    test("deve lançar erro quando usuário não tem empresa vinculada", async () => {
      const userWithoutCompany = await userRepository.create({
        name: "No Company User",
        email: "nocompany@test.com",
        password: "password",
        role: USER_ROLES.OWNER,
        companyId: null,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
          entityId: propertyOwner.id,
          documentType: DOCUMENT_TYPES.RG,
          filename: "rg.pdf",
          originalName: "RG.pdf",
          mimeType: "application/pdf",
          size: 1024 * 500,
          url: "https://storage.example.com/documents/rg.pdf",
          user: userWithoutCompany,
        }),
      ).rejects.toThrow(new InternalServerError("Usuario sem empresa vinculada."));
    });

    test("deve lançar erro quando BROKER tenta adicionar documento em property owner de outro broker", async () => {
      await expect(
        useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
          entityId: propertyOwner.id, // Created by ownerUser
          documentType: DOCUMENT_TYPES.RG,
          filename: "rg.pdf",
          originalName: "RG.pdf",
          mimeType: "application/pdf",
          size: 1024 * 500,
          url: "https://storage.example.com/documents/rg.pdf",
          user: brokerUser,
        }),
      ).rejects.toThrow(
        new ForbiddenError(
          "Voce so pode adicionar documentos em proprietarios que voce cadastrou.",
        ),
      );
    });

    test("deve lançar erro quando BROKER tenta adicionar documento em tenant de outro broker", async () => {
      await expect(
        useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.TENANT,
          entityId: tenant.id, // Created by ownerUser
          documentType: DOCUMENT_TYPES.CPF,
          filename: "cpf.pdf",
          originalName: "CPF.pdf",
          mimeType: "application/pdf",
          size: 1024 * 500,
          url: "https://storage.example.com/documents/cpf.pdf",
          user: brokerUser,
        }),
      ).rejects.toThrow(
        new ForbiddenError("Voce so pode adicionar documentos em inquilinos que voce cadastrou."),
      );
    });
  });

  describe("Validações de Dados", () => {
    test("deve lançar erro para tipo de entidade inválido", async () => {
      await expect(
        useCase.execute({
          entityType: "invalid_entity" as any,
          entityId: propertyOwner.id,
          documentType: DOCUMENT_TYPES.RG,
          filename: "rg.pdf",
          originalName: "RG.pdf",
          mimeType: "application/pdf",
          size: 1024 * 500,
          url: "https://storage.example.com/documents/rg.pdf",
          user: ownerUser,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("deve lançar erro para tipo de documento inválido", async () => {
      await expect(
        useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
          entityId: propertyOwner.id,
          documentType: "invalid_doc_type" as any,
          filename: "doc.pdf",
          originalName: "Doc.pdf",
          mimeType: "application/pdf",
          size: 1024 * 500,
          url: "https://storage.example.com/documents/doc.pdf",
          user: ownerUser,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("deve lançar erro para tipo de arquivo não permitido", async () => {
      await expect(
        useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
          entityId: propertyOwner.id,
          documentType: DOCUMENT_TYPES.RG,
          filename: "rg.doc",
          originalName: "RG.doc",
          mimeType: "application/msword",
          size: 1024 * 500,
          url: "https://storage.example.com/documents/rg.doc",
          user: ownerUser,
        }),
      ).rejects.toThrow(
        new BadRequestError(
          "Tipo de arquivo nao permitido. Use: application/pdf, image/jpeg, image/png, image/webp.",
        ),
      );
    });

    test("deve lançar erro para arquivo maior que 10MB", async () => {
      await expect(
        useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
          entityId: propertyOwner.id,
          documentType: DOCUMENT_TYPES.RG,
          filename: "rg.pdf",
          originalName: "RG.pdf",
          mimeType: "application/pdf",
          size: 11 * 1024 * 1024, // 11MB
          url: "https://storage.example.com/documents/rg.pdf",
          user: ownerUser,
        }),
      ).rejects.toThrow(new BadRequestError("Arquivo muito grande. Tamanho maximo: 10MB."));
    });

    test("deve lançar erro quando property owner não existe", async () => {
      await expect(
        useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
          entityId: "non-existent-id",
          documentType: DOCUMENT_TYPES.RG,
          filename: "rg.pdf",
          originalName: "RG.pdf",
          mimeType: "application/pdf",
          size: 1024 * 500,
          url: "https://storage.example.com/documents/rg.pdf",
          user: ownerUser,
        }),
      ).rejects.toThrow(new NotFoundError("Proprietario nao encontrado."));
    });

    test("deve lançar erro quando tenant não existe", async () => {
      await expect(
        useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.TENANT,
          entityId: "non-existent-id",
          documentType: DOCUMENT_TYPES.CPF,
          filename: "cpf.pdf",
          originalName: "CPF.pdf",
          mimeType: "application/pdf",
          size: 1024 * 500,
          url: "https://storage.example.com/documents/cpf.pdf",
          user: ownerUser,
        }),
      ).rejects.toThrow(new NotFoundError("Inquilino nao encontrado."));
    });

    test("deve lançar erro quando atingir limite de 20 documentos por entidade", async () => {
      // Add 20 documents
      for (let i = 0; i < 20; i++) {
        await useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
          entityId: propertyOwner.id,
          documentType: DOCUMENT_TYPES.OUTROS,
          filename: `doc-${i}.pdf`,
          originalName: `Doc ${i}.pdf`,
          mimeType: "application/pdf",
          size: 1024 * 500,
          url: `https://storage.example.com/documents/doc-${i}.pdf`,
          user: ownerUser,
        });
      }

      // Try to add 21st document
      await expect(
        useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
          entityId: propertyOwner.id,
          documentType: DOCUMENT_TYPES.OUTROS,
          filename: "doc-21.pdf",
          originalName: "Doc 21.pdf",
          mimeType: "application/pdf",
          size: 1024 * 500,
          url: "https://storage.example.com/documents/doc-21.pdf",
          user: ownerUser,
        }),
      ).rejects.toThrow(new BadRequestError("Limite de 20 documentos por registro atingido."));
    });
  });

  describe("Isolamento por Empresa", () => {
    test("deve lançar erro quando property owner pertence a outra empresa", async () => {
      const company2 = await companyRepository.create({
        name: "Imobiliária 2",
        cnpj: "98765432109876",
      });

      const owner2 = await userRepository.create({
        name: "Owner 2",
        email: "owner2@test.com",
        password: "password",
        role: USER_ROLES.OWNER,
        companyId: company2.id,
        isActive: true,
        isEmailVerified: true,
      });

      const propertyOwner2 = await propertyOwnerRepository.create({
        companyId: company2.id,
        name: "Property Owner 2",
        email: "owner2data@test.com",
        documentType: "cpf",
        document: "99988877766",
        createdBy: owner2.id,
      });

      await expect(
        useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
          entityId: propertyOwner2.id,
          documentType: DOCUMENT_TYPES.RG,
          filename: "rg.pdf",
          originalName: "RG.pdf",
          mimeType: "application/pdf",
          size: 1024 * 500,
          url: "https://storage.example.com/documents/rg.pdf",
          user: ownerUser, // From company1
        }),
      ).rejects.toThrow(new ForbiddenError("Proprietario nao pertence a sua empresa."));
    });

    test("deve lançar erro quando tenant pertence a outra empresa", async () => {
      const company2 = await companyRepository.create({
        name: "Imobiliária 2",
        cnpj: "98765432109876",
      });

      const owner2 = await userRepository.create({
        name: "Owner 2",
        email: "owner2@test.com",
        password: "password",
        role: USER_ROLES.OWNER,
        companyId: company2.id,
        isActive: true,
        isEmailVerified: true,
      });

      const tenant2 = await tenantRepository.create({
        companyId: company2.id,
        name: "Tenant 2",
        email: "tenant2@test.com",
        cpf: "11122233344",
        createdBy: owner2.id,
      });

      await expect(
        useCase.execute({
          entityType: DOCUMENT_ENTITY_TYPES.TENANT,
          entityId: tenant2.id,
          documentType: DOCUMENT_TYPES.CPF,
          filename: "cpf.pdf",
          originalName: "CPF.pdf",
          mimeType: "application/pdf",
          size: 1024 * 500,
          url: "https://storage.example.com/documents/cpf.pdf",
          user: ownerUser, // From company1
        }),
      ).rejects.toThrow(new ForbiddenError("Inquilino nao pertence a sua empresa."));
    });
  });
});
