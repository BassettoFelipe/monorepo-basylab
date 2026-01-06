import { beforeEach, describe, expect, test } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { ForbiddenError, InternalServerError, NotFoundError } from "@basylab/core/errors";
import type { Company } from "@/db/schema/companies";
import type { Contract } from "@/db/schema/contracts";
import { CONTRACT_STATUS } from "@/db/schema/contracts";
import type { Property } from "@/db/schema/properties";
import { LISTING_TYPES, PROPERTY_STATUS, PROPERTY_TYPES } from "@/db/schema/properties";
import type { PropertyOwner } from "@/db/schema/property-owners";
import type { Tenant } from "@/db/schema/tenants";
import type { User } from "@/db/schema/users";
import {
  InMemoryCompanyRepository,
  InMemoryContractRepository,
  InMemoryPropertyOwnerRepository,
  InMemoryPropertyRepository,
  InMemoryTenantRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { GetContractUseCase } from "./get-contract.use-case";

describe("GetContractUseCase", () => {
  let useCase: GetContractUseCase;
  let contractRepository: InMemoryContractRepository;
  let propertyRepository: InMemoryPropertyRepository;
  let propertyOwnerRepository: InMemoryPropertyOwnerRepository;
  let tenantRepository: InMemoryTenantRepository;
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
  let tenant: Tenant;
  let contract: Contract;

  beforeEach(async () => {
    contractRepository = new InMemoryContractRepository();
    propertyRepository = new InMemoryPropertyRepository();
    propertyOwnerRepository = new InMemoryPropertyOwnerRepository();
    tenantRepository = new InMemoryTenantRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    useCase = new GetContractUseCase(
      contractRepository,
      propertyRepository,
      propertyOwnerRepository,
      tenantRepository,
      userRepository,
    );

    // Create company
    company = await companyRepository.create({
      name: "Imobiliária Teste",
      ownerId: "temp-owner-id",
      email: "imob@test.com",
    });

    // Create users
    ownerUser = await userRepository.create({
      email: "owner@test.com",
      password: await PasswordUtils.hash("Test@123"),
      name: "Owner User",
      role: USER_ROLES.OWNER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    managerUser = await userRepository.create({
      email: "manager@test.com",
      password: await PasswordUtils.hash("Test@123"),
      name: "Manager User",
      role: USER_ROLES.MANAGER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    brokerUser = await userRepository.create({
      email: "broker@test.com",
      password: await PasswordUtils.hash("Test@123"),
      name: "Broker User",
      role: USER_ROLES.BROKER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    broker2User = await userRepository.create({
      email: "broker2@test.com",
      password: await PasswordUtils.hash("Test@123"),
      name: "Broker 2 User",
      role: USER_ROLES.BROKER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

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
      email: "joao@test.com",
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
      status: PROPERTY_STATUS.RENTED,
      rentalPrice: 150000,
      createdBy: brokerUser.id,
    });

    // Create tenant
    tenant = await tenantRepository.create({
      companyId: company.id,
      name: "Maria Santos",
      cpf: "98765432100",
      email: "maria@test.com",
      createdBy: brokerUser.id,
    });

    // Create contract
    contract = await contractRepository.create({
      companyId: company.id,
      propertyId: property.id,
      ownerId: propertyOwner.id,
      tenantId: tenant.id,
      brokerId: brokerUser.id,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      rentalAmount: 150000,
      paymentDay: 5,
      depositAmount: 300000,
      notes: "Contrato de teste",
      status: CONTRACT_STATUS.ACTIVE,
      createdBy: brokerUser.id,
    });
  });

  describe("Validações de Permissão", () => {
    test("deve permitir owner visualizar qualquer contrato", async () => {
      const result = await useCase.execute({
        id: contract.id,
        requestedBy: ownerUser,
      });

      expect(result.id).toBe(contract.id);
    });

    test("deve permitir manager visualizar qualquer contrato", async () => {
      const result = await useCase.execute({
        id: contract.id,
        requestedBy: managerUser,
      });

      expect(result.id).toBe(contract.id);
    });

    test("deve permitir insurance analyst visualizar qualquer contrato", async () => {
      const result = await useCase.execute({
        id: contract.id,
        requestedBy: insuranceAnalystUser,
      });

      expect(result.id).toBe(contract.id);
    });

    test("deve permitir broker visualizar seu próprio contrato", async () => {
      const result = await useCase.execute({
        id: contract.id,
        requestedBy: brokerUser,
      });

      expect(result.id).toBe(contract.id);
      expect(result.broker?.id).toBe(brokerUser.id);
    });

    test("deve lançar erro quando broker tenta visualizar contrato de outro broker", async () => {
      await expect(
        useCase.execute({
          id: contract.id,
          requestedBy: broker2User,
        }),
      ).rejects.toThrow(
        new ForbiddenError("Você só pode visualizar contratos dos quais é responsável."),
      );
    });

    test("deve lançar erro quando usuário não tem permissão", async () => {
      const invalidUser = await userRepository.create({
        email: "invalid@test.com",
        password: await PasswordUtils.hash("Test@123"),
        name: "Invalid Role User",
        role: "invalid_role" as any,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          id: contract.id,
          requestedBy: invalidUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para visualizar contratos."));
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
          id: contract.id,
          requestedBy: userWithoutCompany,
        }),
      ).rejects.toThrow(new InternalServerError("Usuário sem empresa vinculada."));
    });
  });

  describe("Validações de Contrato", () => {
    test("deve lançar erro quando contrato não existe", async () => {
      await expect(
        useCase.execute({
          id: "non-existent-id",
          requestedBy: ownerUser,
        }),
      ).rejects.toThrow(new NotFoundError("Contrato não encontrado."));
    });

    test("deve lançar erro quando contrato é de outra empresa", async () => {
      const otherContract = await contractRepository.create({
        companyId: "other-company-id",
        propertyId: "other-property-id",
        ownerId: "other-owner-id",
        tenantId: "other-tenant-id",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        rentalAmount: 100000,
        paymentDay: 5,
        createdBy: "other-user-id",
      });

      await expect(
        useCase.execute({
          id: otherContract.id,
          requestedBy: ownerUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para acessar este contrato."));
    });
  });

  describe("Retorno de Dados", () => {
    test("deve retornar todos os campos do contrato", async () => {
      const result = await useCase.execute({
        id: contract.id,
        requestedBy: ownerUser,
      });

      expect(result.id).toBe(contract.id);
      expect(result.propertyId).toBe(property.id);
      expect(result.ownerId).toBe(propertyOwner.id);
      expect(result.tenantId).toBe(tenant.id);
      expect(result.rentalAmount).toBe(150000);
      expect(result.notes).toBe("Contrato de teste");
      expect(result.status).toBe(CONTRACT_STATUS.ACTIVE);
    });

    test("deve retornar dados do imóvel", async () => {
      const result = await useCase.execute({
        id: contract.id,
        requestedBy: ownerUser,
      });

      expect(result.property).toBeDefined();
      expect(result.property?.id).toBe(property.id);
      expect(result.property?.title).toBe("Apartamento Centro");
    });

    test("deve retornar dados do proprietário", async () => {
      const result = await useCase.execute({
        id: contract.id,
        requestedBy: ownerUser,
      });

      expect(result.owner).toBeDefined();
      expect(result.owner?.id).toBe(propertyOwner.id);
      expect(result.owner?.name).toBe("João Silva");
    });

    test("deve retornar dados do locatário", async () => {
      const result = await useCase.execute({
        id: contract.id,
        requestedBy: ownerUser,
      });

      expect(result.tenant).toBeDefined();
      expect(result.tenant?.id).toBe(tenant.id);
      expect(result.tenant?.name).toBe("Maria Santos");
    });

    test("deve retornar dados do corretor", async () => {
      const result = await useCase.execute({
        id: contract.id,
        requestedBy: ownerUser,
      });

      expect(result.broker).toBeDefined();
      expect(result.broker?.id).toBe(brokerUser.id);
      expect(result.broker?.name).toBe("Broker User");
      expect(result.broker?.email).toBe("broker@test.com");
    });

    test("deve retornar broker como null quando não existe", async () => {
      // Criar contrato sem broker
      const contractWithoutBroker = await contractRepository.create({
        companyId: company.id,
        propertyId: property.id,
        ownerId: propertyOwner.id,
        tenantId: tenant.id,
        brokerId: null,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        rentalAmount: 160000,
        paymentDay: 10,
        createdBy: ownerUser.id,
      });

      const result = await useCase.execute({
        id: contractWithoutBroker.id,
        requestedBy: ownerUser,
      });

      expect(result.broker).toBeNull();
    });
  });
});
