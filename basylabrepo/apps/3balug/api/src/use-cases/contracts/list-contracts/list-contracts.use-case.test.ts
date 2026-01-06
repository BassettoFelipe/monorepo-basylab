import { beforeEach, describe, expect, test } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { ForbiddenError, InternalServerError } from "@basylab/core/errors";
import type { Company } from "@/db/schema/companies";
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
import { ListContractsUseCase } from "./list-contracts.use-case";

describe("ListContractsUseCase", () => {
  let useCase: ListContractsUseCase;
  let contractRepository: InMemoryContractRepository;
  let propertyRepository: InMemoryPropertyRepository;
  let propertyOwnerRepository: InMemoryPropertyOwnerRepository;
  let tenantRepository: InMemoryTenantRepository;
  let companyRepository: InMemoryCompanyRepository;
  let userRepository: InMemoryUserRepository;

  let ownerUser: User;
  let managerUser: User;
  let brokerUser: User;
  let broker2User: User;
  let insuranceAnalystUser: User;
  let company: Company;
  let propertyOwner: PropertyOwner;
  let property: Property;
  let property2: Property;
  let tenant: Tenant;
  let tenant2: Tenant;

  beforeEach(async () => {
    contractRepository = new InMemoryContractRepository();
    propertyRepository = new InMemoryPropertyRepository();
    propertyOwnerRepository = new InMemoryPropertyOwnerRepository();
    tenantRepository = new InMemoryTenantRepository();
    companyRepository = new InMemoryCompanyRepository();
    userRepository = new InMemoryUserRepository();

    useCase = new ListContractsUseCase(contractRepository);

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

    // Create other users
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
      createdBy: ownerUser.id,
    });

    // Create properties
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

    property2 = await propertyRepository.create({
      companyId: company.id,
      ownerId: propertyOwner.id,
      brokerId: broker2User.id,
      title: "Casa Jardins",
      type: PROPERTY_TYPES.HOUSE,
      listingType: LISTING_TYPES.RENT,
      status: PROPERTY_STATUS.RENTED,
      rentalPrice: 250000,
      createdBy: broker2User.id,
    });

    // Create tenants
    tenant = await tenantRepository.create({
      companyId: company.id,
      name: "Maria Santos",
      cpf: "98765432100",
      createdBy: brokerUser.id,
    });

    tenant2 = await tenantRepository.create({
      companyId: company.id,
      name: "Carlos Oliveira",
      cpf: "11122233344",
      createdBy: broker2User.id,
    });

    // Create contracts
    await contractRepository.create({
      companyId: company.id,
      propertyId: property.id,
      ownerId: propertyOwner.id,
      tenantId: tenant.id,
      brokerId: brokerUser.id,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      rentalAmount: 150000,
      paymentDay: 5,
      status: CONTRACT_STATUS.ACTIVE,
      createdBy: brokerUser.id,
    });

    await contractRepository.create({
      companyId: company.id,
      propertyId: property2.id,
      ownerId: propertyOwner.id,
      tenantId: tenant2.id,
      brokerId: broker2User.id,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2025-05-31"),
      rentalAmount: 250000,
      paymentDay: 10,
      status: CONTRACT_STATUS.ACTIVE,
      createdBy: broker2User.id,
    });

    await contractRepository.create({
      companyId: company.id,
      propertyId: property.id,
      ownerId: propertyOwner.id,
      tenantId: tenant.id,
      brokerId: brokerUser.id,
      startDate: new Date("2023-01-01"),
      endDate: new Date("2023-12-31"),
      rentalAmount: 140000,
      paymentDay: 5,
      status: CONTRACT_STATUS.TERMINATED,
      createdBy: brokerUser.id,
    });
  });

  describe("Validações de Permissão", () => {
    test("deve permitir owner listar todos os contratos", async () => {
      const result = await useCase.execute({
        requestedBy: ownerUser,
      });

      expect(result.total).toBe(3);
      expect(result.data).toHaveLength(3);
    });

    test("deve permitir manager listar todos os contratos", async () => {
      const result = await useCase.execute({
        requestedBy: managerUser,
      });

      expect(result.total).toBe(3);
    });

    test("deve permitir insurance analyst listar todos os contratos", async () => {
      const result = await useCase.execute({
        requestedBy: insuranceAnalystUser,
      });

      expect(result.total).toBe(3);
    });

    test("deve permitir broker listar apenas seus contratos", async () => {
      const result = await useCase.execute({
        requestedBy: brokerUser,
      });

      // Broker 1 tem 2 contratos (1 ativo + 1 terminado)
      expect(result.total).toBe(2);
      expect(result.data.every((c) => c.brokerId === brokerUser.id)).toBe(true);
    });

    test("deve lançar erro quando usuário não tem permissão", async () => {
      const invalidUser = await userRepository.create({
        email: "invalid@test.com",
        password: await PasswordUtils.hash("Test@123"),
        name: "Invalid User",
        role: "invalid_role" as typeof USER_ROLES.OWNER,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(useCase.execute({ requestedBy: invalidUser })).rejects.toThrow(
        new ForbiddenError("Você não tem permissão para listar contratos."),
      );
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

      await expect(useCase.execute({ requestedBy: userWithoutCompany })).rejects.toThrow(
        new InternalServerError("Usuário sem empresa vinculada."),
      );
    });
  });

  describe("Filtros", () => {
    test("deve filtrar por propertyId", async () => {
      const result = await useCase.execute({
        propertyId: property.id,
        requestedBy: ownerUser,
      });

      expect(result.total).toBe(2); // 1 ativo + 1 terminado no mesmo imóvel
      expect(result.data.every((c) => c.propertyId === property.id)).toBe(true);
    });

    test("deve filtrar por tenantId", async () => {
      const result = await useCase.execute({
        tenantId: tenant.id,
        requestedBy: ownerUser,
      });

      expect(result.total).toBe(2);
      expect(result.data.every((c) => c.tenantId === tenant.id)).toBe(true);
    });

    test("deve filtrar por status", async () => {
      const result = await useCase.execute({
        status: CONTRACT_STATUS.ACTIVE,
        requestedBy: ownerUser,
      });

      expect(result.total).toBe(2);
      expect(result.data.every((c) => c.status === CONTRACT_STATUS.ACTIVE)).toBe(true);
    });

    test("deve filtrar por status terminated", async () => {
      const result = await useCase.execute({
        status: CONTRACT_STATUS.TERMINATED,
        requestedBy: ownerUser,
      });

      expect(result.total).toBe(1);
      expect(result.data[0].status).toBe(CONTRACT_STATUS.TERMINATED);
    });

    test("deve combinar múltiplos filtros", async () => {
      const result = await useCase.execute({
        propertyId: property.id,
        status: CONTRACT_STATUS.ACTIVE,
        requestedBy: ownerUser,
      });

      expect(result.total).toBe(1);
    });
  });

  describe("Paginação", () => {
    test("deve respeitar limit padrão de 20", async () => {
      const result = await useCase.execute({
        requestedBy: ownerUser,
      });

      expect(result.limit).toBe(20);
    });

    test("deve respeitar limit customizado", async () => {
      const result = await useCase.execute({
        limit: 2,
        requestedBy: ownerUser,
      });

      expect(result.limit).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
    });

    test("deve respeitar offset", async () => {
      const result = await useCase.execute({
        limit: 2,
        offset: 2,
        requestedBy: ownerUser,
      });

      expect(result.offset).toBe(2);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(3);
    });
  });

  describe("Isolamento por Empresa", () => {
    test("não deve retornar contratos de outras empresas", async () => {
      // Criar contrato em outra empresa
      await contractRepository.create({
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

      const result = await useCase.execute({
        requestedBy: ownerUser,
      });

      expect(result.total).toBe(3);
      expect(result.data.every((c) => c.propertyId)).toBeTruthy();
    });
  });

  describe("Retorno de Dados", () => {
    test("deve retornar estrutura correta", async () => {
      const result = await useCase.execute({
        requestedBy: ownerUser,
      });

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("limit");
      expect(result).toHaveProperty("offset");
      expect(Array.isArray(result.data)).toBe(true);
    });

    test("deve retornar todos os campos do contrato", async () => {
      const result = await useCase.execute({
        status: CONTRACT_STATUS.ACTIVE,
        requestedBy: ownerUser,
      });

      const contract = result.data[0];
      expect(contract).toHaveProperty("id");
      expect(contract).toHaveProperty("propertyId");
      expect(contract).toHaveProperty("ownerId");
      expect(contract).toHaveProperty("tenantId");
      expect(contract).toHaveProperty("brokerId");
      expect(contract).toHaveProperty("startDate");
      expect(contract).toHaveProperty("endDate");
      expect(contract).toHaveProperty("rentalAmount");
      expect(contract).toHaveProperty("paymentDay");
      expect(contract).toHaveProperty("status");
    });
  });
});
