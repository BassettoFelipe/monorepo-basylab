import { beforeEach, describe, expect, test } from "bun:test";
import type { Company } from "@/db/schema/companies";
import type { Property } from "@/db/schema/properties";
import { LISTING_TYPES, PROPERTY_STATUS, PROPERTY_TYPES } from "@/db/schema/properties";
import type { PropertyOwner } from "@/db/schema/property-owners";
import type { User } from "@/db/schema/users";
import { ForbiddenError, InternalServerError, NotFoundError } from "@/errors";
import {
  InMemoryCompanyRepository,
  InMemoryPropertyOwnerRepository,
  InMemoryPropertyPhotoRepository,
  InMemoryPropertyRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { CryptoUtils } from "@/utils/crypto.utils";
import { GetPropertyUseCase } from "./get-property.use-case";

describe("GetPropertyUseCase", () => {
  let useCase: GetPropertyUseCase;
  let propertyRepository: InMemoryPropertyRepository;
  let propertyOwnerRepository: InMemoryPropertyOwnerRepository;
  let propertyPhotoRepository: InMemoryPropertyPhotoRepository;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;

  let ownerUser: User;
  let managerUser: User;
  let brokerUser: User;
  let broker2User: User;
  let insuranceAnalystUser: User;
  let company: Company;
  let propertyOwner: PropertyOwner;
  let property: Property;

  beforeEach(async () => {
    propertyRepository = new InMemoryPropertyRepository();
    propertyOwnerRepository = new InMemoryPropertyOwnerRepository();
    propertyPhotoRepository = new InMemoryPropertyPhotoRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    useCase = new GetPropertyUseCase(
      propertyRepository,
      propertyOwnerRepository,
      propertyPhotoRepository,
      userRepository,
    );

    // Create company
    company = await companyRepository.create({
      name: "Imobiliária Teste",
      ownerId: "temp-owner-id",
      email: "imob@test.com",
    });

    // Create users in repository
    ownerUser = await userRepository.create({
      email: "owner@test.com",
      password: await CryptoUtils.hashPassword("Test@123"),
      name: "Owner User",
      role: USER_ROLES.OWNER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    managerUser = await userRepository.create({
      email: "manager@test.com",
      password: await CryptoUtils.hashPassword("Test@123"),
      name: "Manager User",
      role: USER_ROLES.MANAGER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    brokerUser = await userRepository.create({
      email: "broker@test.com",
      password: await CryptoUtils.hashPassword("Test@123"),
      name: "Broker User",
      role: USER_ROLES.BROKER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    broker2User = await userRepository.create({
      email: "broker2@test.com",
      password: await CryptoUtils.hashPassword("Test@123"),
      name: "Broker 2 User",
      role: USER_ROLES.BROKER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    insuranceAnalystUser = await userRepository.create({
      email: "analyst@test.com",
      password: await CryptoUtils.hashPassword("Test@123"),
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
      email: "joao@test.com",
      phone: "11999999999",
      createdBy: ownerUser.id,
    });

    // Create property
    property = await propertyRepository.create({
      companyId: company.id,
      ownerId: propertyOwner.id,
      brokerId: brokerUser.id,
      title: "Apartamento Centro",
      description: "Belo apartamento no centro",
      type: PROPERTY_TYPES.APARTMENT,
      listingType: LISTING_TYPES.RENT,
      status: PROPERTY_STATUS.AVAILABLE,
      address: "Rua Teste, 123",
      city: "São Paulo",
      state: "SP",
      rentalPrice: 150000,
      bedrooms: 2,
      bathrooms: 1,
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
    test("deve permitir owner visualizar qualquer imóvel", async () => {
      const result = await useCase.execute({
        id: property.id,
        requestedBy: ownerUser,
      });

      expect(result.id).toBe(property.id);
      expect(result.title).toBe("Apartamento Centro");
    });

    test("deve permitir manager visualizar qualquer imóvel", async () => {
      const result = await useCase.execute({
        id: property.id,
        requestedBy: managerUser,
      });

      expect(result.id).toBe(property.id);
    });

    test("deve permitir insurance analyst visualizar qualquer imóvel", async () => {
      const result = await useCase.execute({
        id: property.id,
        requestedBy: insuranceAnalystUser,
      });

      expect(result.id).toBe(property.id);
    });

    test("deve permitir broker visualizar seu próprio imóvel", async () => {
      const result = await useCase.execute({
        id: property.id,
        requestedBy: brokerUser,
      });

      expect(result.id).toBe(property.id);
      expect(result.broker?.id).toBe(brokerUser.id);
    });

    test("deve lançar erro quando broker tenta visualizar imóvel de outro broker", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          requestedBy: broker2User,
        }),
      ).rejects.toThrow(
        new ForbiddenError("Você só pode visualizar imóveis dos quais é responsável."),
      );
    });

    test("deve lançar erro quando usuário não tem permissão", async () => {
      const invalidUser = await userRepository.create({
        email: "invalid@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Invalid Role User",
        role: "invalid_role" as any,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          id: property.id,
          requestedBy: invalidUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para visualizar imóveis."));
    });

    test("deve lançar erro quando usuário não tem empresa vinculada", async () => {
      const userWithoutCompany = await userRepository.create({
        email: "nocompany@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "No Company User",
        role: USER_ROLES.OWNER,
        companyId: null,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          id: property.id,
          requestedBy: userWithoutCompany,
        }),
      ).rejects.toThrow(new InternalServerError("Usuário sem empresa vinculada."));
    });
  });

  describe("Validações de Imóvel", () => {
    test("deve lançar erro quando imóvel não existe", async () => {
      await expect(
        useCase.execute({
          id: "non-existent-id",
          requestedBy: ownerUser,
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
          requestedBy: ownerUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para acessar este imóvel."));
    });
  });

  describe("Retorno de Dados", () => {
    test("deve retornar todos os campos do imóvel", async () => {
      const result = await useCase.execute({
        id: property.id,
        requestedBy: ownerUser,
      });

      expect(result.id).toBe(property.id);
      expect(result.ownerId).toBe(propertyOwner.id);
      expect(result.title).toBe("Apartamento Centro");
      expect(result.description).toBe("Belo apartamento no centro");
      expect(result.type).toBe(PROPERTY_TYPES.APARTMENT);
      expect(result.listingType).toBe(LISTING_TYPES.RENT);
      expect(result.status).toBe(PROPERTY_STATUS.AVAILABLE);
      expect(result.address).toBe("Rua Teste, 123");
      expect(result.city).toBe("São Paulo");
      expect(result.state).toBe("SP");
      expect(result.rentalPrice).toBe(150000);
      expect(result.bedrooms).toBe(2);
      expect(result.bathrooms).toBe(1);
    });

    test("deve retornar dados do proprietário", async () => {
      const result = await useCase.execute({
        id: property.id,
        requestedBy: ownerUser,
      });

      expect(result.owner).toBeDefined();
      expect(result.owner?.id).toBe(propertyOwner.id);
      expect(result.owner?.name).toBe("João Silva");
      expect(result.owner?.document).toBe("12345678901");
    });

    test("deve retornar dados do corretor", async () => {
      const result = await useCase.execute({
        id: property.id,
        requestedBy: ownerUser,
      });

      expect(result.broker).toBeDefined();
      expect(result.broker?.id).toBe(brokerUser.id);
      expect(result.broker?.name).toBe("Broker User");
      expect(result.broker?.email).toBe("broker@test.com");
    });

    test("deve retornar broker como null quando não existe", async () => {
      // Criar imóvel sem broker
      const propertyWithoutBroker = await propertyRepository.create({
        companyId: company.id,
        ownerId: propertyOwner.id,
        brokerId: null,
        title: "Imóvel sem Broker",
        type: PROPERTY_TYPES.HOUSE,
        listingType: LISTING_TYPES.SALE,
        status: PROPERTY_STATUS.AVAILABLE,
        salePrice: 50000000,
        createdBy: ownerUser.id,
      });

      const result = await useCase.execute({
        id: propertyWithoutBroker.id,
        requestedBy: ownerUser,
      });

      expect(result.broker).toBeNull();
    });

    test("deve retornar fotos do imóvel", async () => {
      const result = await useCase.execute({
        id: property.id,
        requestedBy: ownerUser,
      });

      expect(result.photos).toBeDefined();
      expect(result.photos).toHaveLength(2);
      expect(result.photos[0].isPrimary).toBe(true);
      expect(result.photos[0].url).toContain("photo1.jpg");
      expect(result.photos[1].isPrimary).toBe(false);
    });

    test("deve retornar array vazio quando não há fotos", async () => {
      // Criar imóvel sem fotos
      const propertyWithoutPhotos = await propertyRepository.create({
        companyId: company.id,
        ownerId: propertyOwner.id,
        title: "Imóvel sem Fotos",
        type: PROPERTY_TYPES.LAND,
        listingType: LISTING_TYPES.SALE,
        status: PROPERTY_STATUS.AVAILABLE,
        salePrice: 30000000,
        createdBy: ownerUser.id,
      });

      const result = await useCase.execute({
        id: propertyWithoutPhotos.id,
        requestedBy: ownerUser,
      });

      expect(result.photos).toEqual([]);
    });
  });
});
