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
  InMemoryPropertyOwnerRepository,
  InMemoryPropertyRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { UpdatePropertyUseCase } from "./update-property.use-case";

describe("UpdatePropertyUseCase", () => {
  let useCase: UpdatePropertyUseCase;
  let propertyRepository: InMemoryPropertyRepository;
  let propertyOwnerRepository: InMemoryPropertyOwnerRepository;
  let companyRepository: InMemoryCompanyRepository;
  let userRepository: InMemoryUserRepository;

  let ownerUser: User;
  let managerUser: User;
  let brokerUser: User;
  let broker2User: User;
  let insuranceAnalystUser: User;
  let company: Company;
  let propertyOwner: PropertyOwner;
  let propertyOwner2: PropertyOwner;
  let property: Property;

  beforeEach(async () => {
    propertyRepository = new InMemoryPropertyRepository();
    propertyOwnerRepository = new InMemoryPropertyOwnerRepository();
    companyRepository = new InMemoryCompanyRepository();
    userRepository = new InMemoryUserRepository();

    useCase = new UpdatePropertyUseCase(propertyRepository, propertyOwnerRepository);

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

    // Create second broker user
    broker2User = await userRepository.create({
      email: "broker2@test.com",
      password: await PasswordUtils.hash("Test@123"),
      name: "Broker 2 User",
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

    // Create property owners
    propertyOwner = await propertyOwnerRepository.create({
      companyId: company.id,
      name: "João Silva",
      documentType: "cpf",
      document: "12345678901",
      createdBy: ownerUser.id,
    });

    propertyOwner2 = await propertyOwnerRepository.create({
      companyId: company.id,
      name: "Maria Santos",
      documentType: "cpf",
      document: "98765432100",
      createdBy: ownerUser.id,
    });

    // Create property
    property = await propertyRepository.create({
      companyId: company.id,
      ownerId: propertyOwner.id,
      brokerId: brokerUser.id,
      title: "Apartamento Centro",
      description: "Belo apartamento",
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
  });

  describe("Validações de Permissão", () => {
    test("deve permitir owner atualizar qualquer imóvel", async () => {
      const result = await useCase.execute({
        id: property.id,
        title: "Apartamento Atualizado",
        updatedBy: ownerUser,
      });

      expect(result.title).toBe("Apartamento Atualizado");
    });

    test("deve permitir manager atualizar qualquer imóvel", async () => {
      const result = await useCase.execute({
        id: property.id,
        title: "Apartamento por Manager",
        updatedBy: managerUser,
      });

      expect(result.title).toBe("Apartamento por Manager");
    });

    test("deve permitir broker atualizar seu próprio imóvel", async () => {
      const result = await useCase.execute({
        id: property.id,
        title: "Apartamento pelo Broker",
        updatedBy: brokerUser,
      });

      expect(result.title).toBe("Apartamento pelo Broker");
    });

    test("deve lançar erro quando broker tenta atualizar imóvel de outro broker", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          title: "Tentativa",
          updatedBy: broker2User,
        }),
      ).rejects.toThrow(new ForbiddenError("Você só pode editar imóveis dos quais é responsável."));
    });

    test("deve lançar erro quando insurance analyst tenta atualizar imóvel", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          title: "Tentativa",
          updatedBy: insuranceAnalystUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para editar imóveis."));
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
          title: "Tentativa",
          updatedBy: userWithoutCompany,
        }),
      ).rejects.toThrow(new InternalServerError("Usuário sem empresa vinculada."));
    });
  });

  describe("Validações de Imóvel", () => {
    test("deve lançar erro quando imóvel não existe", async () => {
      await expect(
        useCase.execute({
          id: "non-existent-id",
          title: "Tentativa",
          updatedBy: ownerUser,
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
          title: "Tentativa",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para editar este imóvel."));
    });
  });

  describe("Atualizações de Campos", () => {
    test("deve atualizar título", async () => {
      const result = await useCase.execute({
        id: property.id,
        title: "  Novo Título  ",
        updatedBy: ownerUser,
      });

      expect(result.title).toBe("Novo Título");
    });

    test("deve atualizar descrição", async () => {
      const result = await useCase.execute({
        id: property.id,
        description: "Nova descrição detalhada",
        updatedBy: ownerUser,
      });

      expect(result.description).toBe("Nova descrição detalhada");
    });

    test("deve permitir limpar descrição", async () => {
      const result = await useCase.execute({
        id: property.id,
        description: null,
        updatedBy: ownerUser,
      });

      expect(result.description).toBeNull();
    });

    test("deve atualizar tipo de imóvel", async () => {
      const result = await useCase.execute({
        id: property.id,
        type: PROPERTY_TYPES.HOUSE,
        updatedBy: ownerUser,
      });

      expect(result.type).toBe(PROPERTY_TYPES.HOUSE);
    });

    test("deve lançar erro para tipo de imóvel inválido", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          type: "invalid_type" as any,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("deve atualizar tipo de anúncio", async () => {
      const result = await useCase.execute({
        id: property.id,
        listingType: LISTING_TYPES.BOTH,
        salePrice: 40000000,
        updatedBy: ownerUser,
      });

      expect(result.listingType).toBe(LISTING_TYPES.BOTH);
    });

    test("deve lançar erro para tipo de anúncio inválido", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          listingType: "invalid_listing" as any,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("deve atualizar status", async () => {
      const result = await useCase.execute({
        id: property.id,
        status: PROPERTY_STATUS.MAINTENANCE,
        updatedBy: ownerUser,
      });

      expect(result.status).toBe(PROPERTY_STATUS.MAINTENANCE);
    });

    test("deve lançar erro para status inválido", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          status: "invalid_status" as any,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("deve permitir owner marcar como vendido", async () => {
      // Primeiro mudar para venda
      await propertyRepository.update(property.id, {
        listingType: LISTING_TYPES.SALE,
        salePrice: 50000000,
      });

      const result = await useCase.execute({
        id: property.id,
        status: PROPERTY_STATUS.SOLD,
        updatedBy: ownerUser,
      });

      expect(result.status).toBe(PROPERTY_STATUS.SOLD);
    });

    test("deve lançar erro quando broker tenta marcar como vendido", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          status: PROPERTY_STATUS.SOLD,
          updatedBy: brokerUser,
        }),
      ).rejects.toThrow(
        new ForbiddenError("Apenas proprietários e gerentes podem marcar imóveis como vendidos."),
      );
    });

    test("deve atualizar endereço", async () => {
      const result = await useCase.execute({
        id: property.id,
        address: "Av. Paulista, 1000",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "sp",
        zipCode: "01310-100",
        updatedBy: ownerUser,
      });

      expect(result.address).toBe("Av. Paulista, 1000");
      expect(result.neighborhood).toBe("Bela Vista");
      expect(result.city).toBe("São Paulo");
      expect(result.state).toBe("SP");
      expect(result.zipCode).toBe("01310100");
    });

    test("deve lançar erro para CEP inválido", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          zipCode: "12345",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new BadRequestError("CEP inválido. Deve conter 8 dígitos."));
    });

    test("deve atualizar características", async () => {
      const result = await useCase.execute({
        id: property.id,
        bedrooms: 3,
        bathrooms: 2,
        parkingSpaces: 1,
        area: 100,
        updatedBy: ownerUser,
      });

      expect(result.bedrooms).toBe(3);
      expect(result.bathrooms).toBe(2);
      expect(result.parkingSpaces).toBe(1);
      expect(result.area).toBe(100);
    });

    test("deve atualizar preços", async () => {
      const result = await useCase.execute({
        id: property.id,
        rentalPrice: 200000,
        iptuPrice: 50000,
        condoFee: 100000,
        updatedBy: ownerUser,
      });

      expect(result.rentalPrice).toBe(200000);
      expect(result.iptuPrice).toBe(50000);
      expect(result.condoFee).toBe(100000);
    });

    test("deve atualizar features", async () => {
      const result = await useCase.execute({
        id: property.id,
        features: {
          hasPool: true,
          hasGym: true,
          hasSecurity: true,
        },
        updatedBy: ownerUser,
      });

      expect(result.features).toEqual({
        hasPool: true,
        hasGym: true,
        hasSecurity: true,
      });
    });
  });

  describe("Validações de Proprietário", () => {
    test("deve permitir alterar proprietário", async () => {
      const result = await useCase.execute({
        id: property.id,
        ownerId: propertyOwner2.id,
        updatedBy: ownerUser,
      });

      expect(result.ownerId).toBe(propertyOwner2.id);
    });

    test("deve lançar erro quando novo proprietário não existe", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          ownerId: "non-existent-owner-id",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new NotFoundError("Proprietário não encontrado."));
    });

    test("deve lançar erro quando novo proprietário é de outra empresa", async () => {
      const otherOwner = await propertyOwnerRepository.create({
        companyId: "other-company-id",
        name: "Outro Proprietário",
        documentType: "cpf",
        document: "11111111111",
        createdBy: "other-user-id",
      });

      await expect(
        useCase.execute({
          id: property.id,
          ownerId: otherOwner.id,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Proprietário não pertence à sua empresa."));
    });
  });

  describe("Validações de Broker", () => {
    test("deve permitir owner alterar brokerId", async () => {
      const result = await useCase.execute({
        id: property.id,
        brokerId: broker2User.id,
        updatedBy: ownerUser,
      });

      expect(result.brokerId).toBe(broker2User.id);
    });

    test("deve permitir manager alterar brokerId", async () => {
      const result = await useCase.execute({
        id: property.id,
        brokerId: null,
        updatedBy: managerUser,
      });

      expect(result.brokerId).toBeNull();
    });

    test("deve lançar erro quando broker tenta alterar brokerId", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          brokerId: broker2User.id,
          updatedBy: brokerUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não pode alterar o corretor responsável."));
    });
  });

  describe("Validações de Preço", () => {
    test("deve exigir rentalPrice para locação", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          rentalPrice: 0,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(
        new BadRequestError("Valor de locação é obrigatório para imóveis de locação."),
      );
    });

    test("deve exigir salePrice quando muda para venda", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          listingType: LISTING_TYPES.SALE,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new BadRequestError("Valor de venda é obrigatório para imóveis à venda."));
    });

    test("deve exigir ambos preços quando muda para both", async () => {
      await expect(
        useCase.execute({
          id: property.id,
          listingType: LISTING_TYPES.BOTH,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new BadRequestError("Valor de venda é obrigatório para imóveis à venda."));
    });

    test("deve permitir atualizar preços corretamente para both", async () => {
      const result = await useCase.execute({
        id: property.id,
        listingType: LISTING_TYPES.BOTH,
        rentalPrice: 200000,
        salePrice: 50000000,
        updatedBy: ownerUser,
      });

      expect(result.listingType).toBe(LISTING_TYPES.BOTH);
      expect(result.rentalPrice).toBe(200000);
      expect(result.salePrice).toBe(50000000);
    });
  });

  describe("Comportamento sem Alterações", () => {
    test("deve retornar imóvel inalterado quando não há dados para atualizar", async () => {
      const result = await useCase.execute({
        id: property.id,
        updatedBy: ownerUser,
      });

      expect(result.id).toBe(property.id);
      expect(result.title).toBe(property.title);
    });
  });

  describe("Múltiplas Atualizações", () => {
    test("deve atualizar múltiplos campos simultaneamente", async () => {
      const result = await useCase.execute({
        id: property.id,
        title: "Título Atualizado",
        description: "Descrição atualizada",
        bedrooms: 4,
        bathrooms: 3,
        rentalPrice: 300000,
        features: { hasPool: true },
        updatedBy: ownerUser,
      });

      expect(result.title).toBe("Título Atualizado");
      expect(result.description).toBe("Descrição atualizada");
      expect(result.bedrooms).toBe(4);
      expect(result.bathrooms).toBe(3);
      expect(result.rentalPrice).toBe(300000);
      expect(result.features).toEqual({ hasPool: true });
    });
  });
});
