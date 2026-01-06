import { beforeEach, describe, expect, test } from "bun:test";
import { PasswordUtils, RandomUtils } from "@basylab/core/crypto";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "@basylab/core/errors";
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
import { UpdateContractUseCase } from "./update-contract.use-case";

describe("UpdateContractUseCase", () => {
  let useCase: UpdateContractUseCase;
  let contractRepository: InMemoryContractRepository;
  let propertyRepository: InMemoryPropertyRepository;
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
  let tenant: Tenant;
  let tenant2: Tenant;
  let contract: Contract;

  beforeEach(async () => {
    contractRepository = new InMemoryContractRepository();
    propertyRepository = new InMemoryPropertyRepository();
    propertyOwnerRepository = new InMemoryPropertyOwnerRepository();
    tenantRepository = new InMemoryTenantRepository();
    companyRepository = new InMemoryCompanyRepository();
    userRepository = new InMemoryUserRepository();

    useCase = new UpdateContractUseCase(contractRepository, tenantRepository);

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
      status: PROPERTY_STATUS.RENTED,
      rentalPrice: 150000,
      createdBy: brokerUser.id,
    });

    // Create tenants
    tenant = await tenantRepository.create({
      companyId: company.id,
      name: "Maria Santos",
      cpf: "98765432100",
      createdBy: ownerUser.id,
    });

    tenant2 = await tenantRepository.create({
      companyId: company.id,
      name: "Carlos Oliveira",
      cpf: "11122233344",
      createdBy: ownerUser.id,
    });

    // Create active contract
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
      notes: "Contrato original",
      status: CONTRACT_STATUS.ACTIVE,
      createdBy: ownerUser.id,
    });
  });

  describe("Validações de Permissão", () => {
    test("deve permitir owner atualizar contrato", async () => {
      const result = await useCase.execute({
        id: contract.id,
        rentalAmount: 160000,
        updatedBy: ownerUser,
      });

      expect(result.rentalAmount).toBe(160000);
    });

    test("deve permitir manager atualizar contrato", async () => {
      const result = await useCase.execute({
        id: contract.id,
        rentalAmount: 170000,
        updatedBy: managerUser,
      });

      expect(result.rentalAmount).toBe(170000);
    });

    test("deve lançar erro quando broker tenta atualizar contrato", async () => {
      await expect(
        useCase.execute({
          id: contract.id,
          rentalAmount: 160000,
          updatedBy: brokerUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para editar contratos."));
    });

    test("deve lançar erro quando insurance analyst tenta atualizar contrato", async () => {
      await expect(
        useCase.execute({
          id: contract.id,
          rentalAmount: 160000,
          updatedBy: insuranceAnalystUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para editar contratos."));
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
          rentalAmount: 160000,
          updatedBy: userWithoutCompany,
        }),
      ).rejects.toThrow(new InternalServerError("Usuário sem empresa vinculada."));
    });
  });

  describe("Validações de Contrato", () => {
    test("deve lançar erro quando contrato não existe", async () => {
      await expect(
        useCase.execute({
          id: "non-existent-id",
          rentalAmount: 160000,
          updatedBy: ownerUser,
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
          rentalAmount: 160000,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para editar este contrato."));
    });

    test("deve lançar erro quando contrato não está ativo", async () => {
      // Encerrar contrato
      await contractRepository.update(contract.id, {
        status: CONTRACT_STATUS.TERMINATED,
      });

      await expect(
        useCase.execute({
          id: contract.id,
          rentalAmount: 160000,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new BadRequestError("Apenas contratos ativos podem ser editados."));
    });
  });

  describe("Atualizações de Campos", () => {
    test("deve atualizar valor do aluguel", async () => {
      const result = await useCase.execute({
        id: contract.id,
        rentalAmount: 200000,
        updatedBy: ownerUser,
      });

      expect(result.rentalAmount).toBe(200000);
    });

    test("deve lançar erro quando valor do aluguel é zero", async () => {
      await expect(
        useCase.execute({
          id: contract.id,
          rentalAmount: 0,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new BadRequestError("O valor do aluguel deve ser maior que zero."));
    });

    test("deve lançar erro quando valor do aluguel é negativo", async () => {
      await expect(
        useCase.execute({
          id: contract.id,
          rentalAmount: -100,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new BadRequestError("O valor do aluguel deve ser maior que zero."));
    });

    test("deve atualizar dia de pagamento", async () => {
      const result = await useCase.execute({
        id: contract.id,
        paymentDay: 15,
        updatedBy: ownerUser,
      });

      expect(result.paymentDay).toBe(15);
    });

    test("deve lançar erro quando dia de pagamento é menor que 1", async () => {
      await expect(
        useCase.execute({
          id: contract.id,
          paymentDay: 0,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new BadRequestError("O dia de pagamento deve estar entre 1 e 31."));
    });

    test("deve lançar erro quando dia de pagamento é maior que 31", async () => {
      await expect(
        useCase.execute({
          id: contract.id,
          paymentDay: 32,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new BadRequestError("O dia de pagamento deve estar entre 1 e 31."));
    });

    test("deve atualizar valor do depósito", async () => {
      const result = await useCase.execute({
        id: contract.id,
        depositAmount: 400000,
        updatedBy: ownerUser,
      });

      expect(result.depositAmount).toBe(400000);
    });

    test("deve permitir remover depósito", async () => {
      const result = await useCase.execute({
        id: contract.id,
        depositAmount: null,
        updatedBy: ownerUser,
      });

      expect(result.depositAmount).toBeNull();
    });

    test("deve atualizar notas", async () => {
      const result = await useCase.execute({
        id: contract.id,
        notes: "Notas atualizadas",
        updatedBy: ownerUser,
      });

      expect(result.notes).toBe("Notas atualizadas");
    });

    test("deve permitir limpar notas", async () => {
      const result = await useCase.execute({
        id: contract.id,
        notes: null,
        updatedBy: ownerUser,
      });

      expect(result.notes).toBeNull();
    });

    test("deve atualizar brokerId", async () => {
      const newBrokerId = RandomUtils.generateUUID();

      const result = await useCase.execute({
        id: contract.id,
        brokerId: newBrokerId,
        updatedBy: ownerUser,
      });

      expect(result.brokerId).toBe(newBrokerId);
    });

    test("deve permitir remover brokerId", async () => {
      const result = await useCase.execute({
        id: contract.id,
        brokerId: null,
        updatedBy: ownerUser,
      });

      expect(result.brokerId).toBeNull();
    });
  });

  describe("Validações de Datas", () => {
    test("deve atualizar data de término", async () => {
      const newEndDate = new Date("2025-06-30");

      const result = await useCase.execute({
        id: contract.id,
        endDate: newEndDate,
        updatedBy: ownerUser,
      });

      expect(result.endDate).toEqual(newEndDate);
    });

    test("deve atualizar data de início", async () => {
      const newStartDate = new Date("2023-12-01");

      const result = await useCase.execute({
        id: contract.id,
        startDate: newStartDate,
        updatedBy: ownerUser,
      });

      expect(result.startDate).toEqual(newStartDate);
    });

    test("deve lançar erro quando data de início é posterior à data de término", async () => {
      await expect(
        useCase.execute({
          id: contract.id,
          startDate: new Date("2025-01-01"),
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(
        new BadRequestError("A data de início deve ser anterior à data de término."),
      );
    });

    test("deve lançar erro quando data de término é anterior à data de início", async () => {
      await expect(
        useCase.execute({
          id: contract.id,
          endDate: new Date("2023-01-01"),
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(
        new BadRequestError("A data de início deve ser anterior à data de término."),
      );
    });

    test("deve permitir atualizar ambas as datas corretamente", async () => {
      const newStartDate = new Date("2024-06-01");
      const newEndDate = new Date("2025-05-31");

      const result = await useCase.execute({
        id: contract.id,
        startDate: newStartDate,
        endDate: newEndDate,
        updatedBy: ownerUser,
      });

      expect(result.startDate).toEqual(newStartDate);
      expect(result.endDate).toEqual(newEndDate);
    });
  });

  describe("Validações de Locatário", () => {
    test("deve permitir alterar locatário", async () => {
      const result = await useCase.execute({
        id: contract.id,
        tenantId: tenant2.id,
        updatedBy: ownerUser,
      });

      expect(result.tenantId).toBe(tenant2.id);
    });

    test("deve lançar erro quando novo locatário não existe", async () => {
      await expect(
        useCase.execute({
          id: contract.id,
          tenantId: "non-existent-tenant-id",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new NotFoundError("Locatário não encontrado."));
    });

    test("deve lançar erro quando novo locatário é de outra empresa", async () => {
      const otherTenant = await tenantRepository.create({
        companyId: "other-company-id",
        name: "Outro Locatário",
        cpf: "55566677788",
        createdBy: "other-user-id",
      });

      await expect(
        useCase.execute({
          id: contract.id,
          tenantId: otherTenant.id,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Locatário não pertence à sua empresa."));
    });
  });

  describe("Comportamento sem Alterações", () => {
    test("deve retornar contrato inalterado quando não há dados para atualizar", async () => {
      const result = await useCase.execute({
        id: contract.id,
        updatedBy: ownerUser,
      });

      expect(result.id).toBe(contract.id);
      expect(result.rentalAmount).toBe(contract.rentalAmount);
    });
  });

  describe("Múltiplas Atualizações", () => {
    test("deve atualizar múltiplos campos simultaneamente", async () => {
      const newEndDate = new Date("2025-12-31");

      const result = await useCase.execute({
        id: contract.id,
        rentalAmount: 180000,
        paymentDay: 10,
        depositAmount: 360000,
        endDate: newEndDate,
        notes: "Contrato renovado",
        updatedBy: ownerUser,
      });

      expect(result.rentalAmount).toBe(180000);
      expect(result.paymentDay).toBe(10);
      expect(result.depositAmount).toBe(360000);
      expect(result.endDate).toEqual(newEndDate);
      expect(result.notes).toBe("Contrato renovado");
    });
  });
});
