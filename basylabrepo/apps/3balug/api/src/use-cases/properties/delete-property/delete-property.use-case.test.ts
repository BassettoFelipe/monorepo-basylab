import { beforeEach, describe, expect, test } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "@basylab/core/errors";
import type { Company } from "@/db/schema/companies";
import type { Property } from "@/db/schema/properties";
import { LISTING_TYPES, PROPERTY_STATUS, PROPERTY_TYPES } from "@/db/schema/properties";
import type { PropertyOwner } from "@/db/schema/property-owners";
import type { User } from "@/db/schema/users";
import {
  InMemoryCompanyRepository,
  InMemoryContractRepository,
  InMemoryPropertyOwnerRepository,
  InMemoryPropertyPhotoRepository,
  InMemoryPropertyRepository,
  InMemoryTenantRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { DeletePropertyUseCase } from "./delete-property.use-case";

describe("DeletePropertyUseCase", () => {
  let useCase: DeletePropertyUseCase;
  let propertyRepository: InMemoryPropertyRepository;
  let contractRepository: InMemoryContractRepository;
  let propertyPhotoRepository: InMemoryPropertyPhotoRepository;
  let propertyOwnerRepository: InMemoryPropertyOwnerRepository;
  let tenantRepository: InMemoryTenantRepository;
  let companyRepository: InMemoryCompanyRepository;
  let userRepository: InMemoryUserRepository;

  let ownerUser: User;
  let managerUser: User;
  let brokerUser: User;
  let insuranceAnalystUser: User;
  let company: Company;
  let propertyOwner: PropertyOwner;
  let property: Property;

  beforeEach(async () => {
    propertyRepository = new InMemoryPropertyRepository();
    contractRepository = new InMemoryContractRepository();
    propertyPhotoRepository = new InMemoryPropertyPhotoRepository();
    propertyOwnerRepository = new InMemoryPropertyOwnerRepository();
    tenantRepository = new InMemoryTenantRepository();
    companyRepository = new InMemoryCompanyRepository();
    userRepository = new InMemoryUserRepository();

    // Configure repository relationships
    propertyRepository.setPhotoRepository(propertyPhotoRepository);

    useCase = new DeletePropertyUseCase(
      propertyRepository,
      contractRepository,
      propertyPhotoRepository,
    );

    // Create company
    company = await companyRepository.create({
      name: "Imobiliária Teste",
      ownerId: "temp-owner-id",
      email: "imob@test.com",
    });

    // Create owner user
    ownerUser = await userRepository.create({
      email: "owner@test.com",
      password: await PasswordUtils.hash("Test@123"),
      name: "Owner User",
      role: USER_ROLES.OWNER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    // Create manager user
    managerUser = await userRepository.create({
      email: "manager@test.com",
      password: await PasswordUtils.hash("Test@123"),
      name: "Manager User",
      role: USER_ROLES.MANAGER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    // Create broker user
    brokerUser = await userRepository.create({
      email: "broker@test.com",
      password: await PasswordUtils.hash("Test@123"),
      name: "Broker User",
      role: USER_ROLES.BROKER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    // Create insurance analyst user
    insuranceAnalystUser = await userRepository.create({
      email: "analyst@test.com",
      password: await PasswordUtils.hash("Test@123"),
      name: "Analyst User",
      role: USER_ROLES.INSURANCE_ANALYST,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    // Create property owner
    propertyOwner = await propertyOwnerRepository.create({
      companyId: company.id,
      name: "João Silva",
      documentType: "cpf",
      document: "12345678901",
      createdBy: ownerUser.id,
    });

    // Create property
    property = await propertyRepository.create({
      companyId: company.id,
      ownerId: propertyOwner.id,
      brokerId: brokerUser.id,
      title: "Apartamento Centro",
      type: PROPERTY_TYPES.APARTMENT,
      listingType: LISTING_TYPES.RENT,
      status: PROPERTY_STATUS.AVAILABLE,
      rentalPrice: 150000,
      createdBy: brokerUser.id,
    });

    // Create some photos
    await propertyPhotoRepository.create({
      propertyId: property.id,
      filename: "photo1.jpg",
      originalName: "foto1.jpg",
      mimeType: "image/jpeg",
      size: 1024,
      url: "/uploads/photo1.jpg",
      order: 0,
      isPrimary: true,
      uploadedBy: brokerUser.id,
    });

    await propertyPhotoRepository.create({
      propertyId: property.id,
      filename: "photo2.jpg",
      originalName: "foto2.jpg",
      mimeType: "image/jpeg",
      size: 2048,
      url: "/uploads/photo2.jpg",
      order: 1,
      isPrimary: false,
      uploadedBy: brokerUser.id,
    });
  });

  describe("Validações de Permissão", () => {
    test("deve permitir owner excluir imóvel", async () => {
      const result = await useCase.execute({
        id: property.id,
        deletedBy: ownerUser,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Imóvel excluído com sucesso.");

      // Verificar se foi realmente excluído
      const deletedProperty = await propertyRepository.findById(property.id);
      expect(deletedProperty).toBeNull();
    });

    test("deve permitir manager excluir imóvel", async () => {
      const result = await useCase.execute({
        id: property.id,
        deletedBy: managerUser,
      });

      expect(result.success).toBe(true);
    });

    test("deve lançar erro quando broker tenta excluir imóvel", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          deletedBy: brokerUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para excluir imóveis."));
    });

    test("deve lançar erro quando insurance analyst tenta excluir imóvel", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          deletedBy: insuranceAnalystUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para excluir imóveis."));
    });

    test("deve lançar erro quando usuário não tem empresa vinculada", async () => {
      const userWithoutCompany = await userRepository.create({
        email: "nocompany@test.com",
        password: await PasswordUtils.hash("Test@123"),
        name: "No Company User",
        role: USER_ROLES.OWNER,
        companyId: null,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          id: property.id,
          deletedBy: userWithoutCompany,
        }),
      ).rejects.toThrow(new InternalServerError("Usuário sem empresa vinculada."));
    });
  });

  describe("Validações de Imóvel", () => {
    test("deve lançar erro quando imóvel não existe", async () => {
      await expect(
        useCase.execute({
          id: "non-existent-id",
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(new NotFoundError("Imóvel não encontrado."));
    });

    test("deve lançar erro quando imóvel é de outra empresa", async () => {
      // Criar imóvel de outra empresa
      const otherProperty = await propertyRepository.create({
        companyId: "other-company-id",
        ownerId: "other-owner-id",
        title: "Imóvel Outra Empresa",
        type: PROPERTY_TYPES.APARTMENT,
        listingType: LISTING_TYPES.RENT,
        status: PROPERTY_STATUS.AVAILABLE,
        rentalPrice: 100000,
        createdBy: "other-user-id",
      });

      await expect(
        useCase.execute({
          id: otherProperty.id,
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para excluir este imóvel."));
    });
  });

  describe("Validações de Contratos", () => {
    test("deve lançar erro quando há contratos vinculados", async () => {
      // Criar um locatário
      const tenant = await tenantRepository.create({
        companyId: company.id,
        name: "Maria Santos",
        cpf: "98765432100",
        createdBy: ownerUser.id,
      });

      // Criar um contrato para o imóvel
      await contractRepository.create({
        companyId: company.id,
        propertyId: property.id,
        ownerId: propertyOwner.id,
        tenantId: tenant.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        rentalAmount: 150000,
        paymentDay: 5,
        createdBy: ownerUser.id,
      });

      await expect(
        useCase.execute({
          id: property.id,
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(
        new BadRequestError(
          "Não é possível excluir este imóvel. Existem 1 contrato(s) vinculado(s).",
        ),
      );
    });

    test("deve lançar erro quando há múltiplos contratos vinculados", async () => {
      // Criar locatários
      const tenant1 = await tenantRepository.create({
        companyId: company.id,
        name: "Maria Santos",
        cpf: "98765432100",
        createdBy: ownerUser.id,
      });

      const tenant2 = await tenantRepository.create({
        companyId: company.id,
        name: "Carlos Oliveira",
        cpf: "11122233344",
        createdBy: ownerUser.id,
      });

      // Criar contratos
      await contractRepository.create({
        companyId: company.id,
        propertyId: property.id,
        ownerId: propertyOwner.id,
        tenantId: tenant1.id,
        startDate: new Date("2023-01-01"),
        endDate: new Date("2023-12-31"),
        rentalAmount: 150000,
        paymentDay: 5,
        status: "terminated",
        createdBy: ownerUser.id,
      });

      await contractRepository.create({
        companyId: company.id,
        propertyId: property.id,
        ownerId: propertyOwner.id,
        tenantId: tenant2.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        rentalAmount: 160000,
        paymentDay: 5,
        status: "active",
        createdBy: ownerUser.id,
      });

      await expect(
        useCase.execute({
          id: property.id,
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(
        new BadRequestError(
          "Não é possível excluir este imóvel. Existem 2 contrato(s) vinculado(s).",
        ),
      );
    });
  });

  describe("Exclusão de Fotos", () => {
    test("deve excluir fotos junto com o imóvel", async () => {
      // Verificar que existem fotos antes
      const photosBefore = await propertyPhotoRepository.findByPropertyId(property.id);
      expect(photosBefore).toHaveLength(2);

      // Excluir imóvel
      await useCase.execute({
        id: property.id,
        deletedBy: ownerUser,
      });

      // Verificar que as fotos foram excluídas
      const photosAfter = await propertyPhotoRepository.findByPropertyId(property.id);
      expect(photosAfter).toHaveLength(0);
    });
  });

  describe("Exclusão com Sucesso", () => {
    test("deve excluir imóvel sem contratos", async () => {
      const result = await useCase.execute({
        id: property.id,
        deletedBy: ownerUser,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Imóvel excluído com sucesso.");

      // Verificar que o imóvel não existe mais
      const deletedProperty = await propertyRepository.findById(property.id);
      expect(deletedProperty).toBeNull();
    });

    test("deve excluir imóvel sem fotos", async () => {
      // Criar imóvel sem fotos
      const propertyWithoutPhotos = await propertyRepository.create({
        companyId: company.id,
        ownerId: propertyOwner.id,
        title: "Terreno",
        type: PROPERTY_TYPES.LAND,
        listingType: LISTING_TYPES.SALE,
        status: PROPERTY_STATUS.AVAILABLE,
        salePrice: 30000000,
        createdBy: ownerUser.id,
      });

      const result = await useCase.execute({
        id: propertyWithoutPhotos.id,
        deletedBy: ownerUser,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Múltiplas Exclusões", () => {
    test("deve excluir múltiplos imóveis em sequência", async () => {
      // Criar mais imóveis
      const property2 = await propertyRepository.create({
        companyId: company.id,
        ownerId: propertyOwner.id,
        title: "Casa",
        type: PROPERTY_TYPES.HOUSE,
        listingType: LISTING_TYPES.SALE,
        status: PROPERTY_STATUS.AVAILABLE,
        salePrice: 50000000,
        createdBy: ownerUser.id,
      });

      const property3 = await propertyRepository.create({
        companyId: company.id,
        ownerId: propertyOwner.id,
        title: "Terreno",
        type: PROPERTY_TYPES.LAND,
        listingType: LISTING_TYPES.SALE,
        status: PROPERTY_STATUS.AVAILABLE,
        salePrice: 30000000,
        createdBy: ownerUser.id,
      });

      // Excluir todos
      await useCase.execute({ id: property.id, deletedBy: ownerUser });
      await useCase.execute({ id: property2.id, deletedBy: ownerUser });
      await useCase.execute({ id: property3.id, deletedBy: ownerUser });

      // Verificar que todos foram excluídos
      const properties = await propertyRepository.findByCompanyId(company.id);
      expect(properties).toHaveLength(0);
    });
  });
});
