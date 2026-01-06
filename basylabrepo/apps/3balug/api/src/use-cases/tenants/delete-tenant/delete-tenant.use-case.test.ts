import { beforeEach, describe, expect, test } from "bun:test";
import type { Company } from "@/db/schema/companies";
import type { Tenant } from "@/db/schema/tenants";
import type { User } from "@/db/schema/users";
import { BadRequestError, InternalServerError, NotFoundError } from "@/errors";
import {
  InMemoryCompanyRepository,
  InMemoryContractRepository,
  InMemoryTenantRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { CryptoUtils } from "@/utils/crypto.utils";
import { DeleteTenantUseCase } from "./delete-tenant.use-case";

describe("DeleteTenantUseCase", () => {
  let useCase: DeleteTenantUseCase;
  let tenantRepository: InMemoryTenantRepository;
  let contractRepository: InMemoryContractRepository;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;

  let ownerUser: User;
  let company: Company;
  let existingTenant: Tenant;

  beforeEach(async () => {
    // Setup repositories
    tenantRepository = new InMemoryTenantRepository();
    contractRepository = new InMemoryContractRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    // Create use case
    useCase = new DeleteTenantUseCase(tenantRepository, contractRepository);

    // Create owner user
    ownerUser = await userRepository.create({
      email: "owner@test.com",
      password: await CryptoUtils.hashPassword("Test@123"),
      name: "Owner User",
      role: USER_ROLES.OWNER,
      isActive: true,
      isEmailVerified: true,
    });

    // Create company
    company = await companyRepository.create({
      name: "Test Company",
      ownerId: ownerUser.id,
      email: "owner@test.com",
    });

    // Link owner to company
    ownerUser = (await userRepository.update(ownerUser.id, {
      companyId: company.id,
    })) as User;

    // Create existing tenant
    existingTenant = await tenantRepository.create({
      name: "João Silva",
      cpf: "81105850439",
      email: "joao@example.com",
      companyId: company.id,
      createdBy: ownerUser.id,
    });
  });

  describe("Caso de Sucesso", () => {
    test("deve excluir locatário sem contratos vinculados", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        deletedBy: ownerUser,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Locatário excluído com sucesso.");

      // Verificar que foi realmente excluído
      const deletedTenant = await tenantRepository.findById(existingTenant.id);
      expect(deletedTenant).toBeNull();
    });

    test("deve retornar mensagem de sucesso após exclusão", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        deletedBy: ownerUser,
      });

      expect(result).toEqual({
        success: true,
        message: "Locatário excluído com sucesso.",
      });
    });
  });

  describe("Validações de Erro", () => {
    test("deve lançar erro se usuário não tem empresa vinculada", async () => {
      const userWithoutCompany = await userRepository.create({
        email: "orphan@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Orphan User",
        role: USER_ROLES.OWNER,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          id: existingTenant.id,
          deletedBy: userWithoutCompany,
        }),
      ).rejects.toThrow(new InternalServerError("Usuário sem empresa vinculada."));
    });

    test("deve lançar erro se locatário não existe", async () => {
      await expect(
        useCase.execute({
          id: "non-existent-id",
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(new NotFoundError("Locatário não encontrado."));
    });

    test("deve lançar erro se locatário pertence a outra empresa", async () => {
      // Criar outra empresa
      const otherOwner = await userRepository.create({
        email: "other@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Other Owner",
        role: USER_ROLES.OWNER,
        isActive: true,
        isEmailVerified: true,
      });

      const otherCompany = await companyRepository.create({
        name: "Other Company",
        ownerId: otherOwner.id,
        email: "other@test.com",
      });

      const updatedOtherOwner = (await userRepository.update(otherOwner.id, {
        companyId: otherCompany.id,
      })) as User;

      await expect(
        useCase.execute({
          id: existingTenant.id,
          deletedBy: updatedOtherOwner,
        }),
      ).rejects.toThrow(new NotFoundError("Locatário não encontrado."));
    });
  });

  describe("Validação de Contratos Ativos", () => {
    test("deve lançar erro se existem contratos ativos vinculados", async () => {
      // Simular que existem 2 contratos ativos
      // O método countActiveByTenantId será chamado e deve retornar > 0
      // Precisamos criar contratos ativos no repository
      const property = {
        id: "property-id",
        companyId: company.id,
        address: "Test Address",
        city: "Test City",
        state: "TS",
        zipCode: "12345678",
        bedrooms: 2,
        bathrooms: 1,
        parkingSpaces: 1,
        area: 100,
        rent: 1000,
        createdBy: ownerUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Criar contrato ativo
      await contractRepository.create({
        companyId: company.id,
        propertyId: property.id,
        tenantId: existingTenant.id,
        ownerId: "owner-id",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-01-01"),
        rentalAmount: 1000,
        paymentDay: 10,
        status: "active",
        createdBy: ownerUser.id,
      });

      await expect(
        useCase.execute({
          id: existingTenant.id,
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(
        new BadRequestError(
          "Não é possível excluir este locatário. Existem 1 contrato(s) ativo(s) vinculado(s).",
        ),
      );

      // Verificar que o locatário NÃO foi excluído
      const tenant = await tenantRepository.findById(existingTenant.id);
      expect(tenant).not.toBeNull();
    });

    test("deve incluir a quantidade correta de contratos ativos na mensagem de erro", async () => {
      const property = {
        id: "property-id",
        companyId: company.id,
        address: "Test Address",
        city: "Test City",
        state: "TS",
        zipCode: "12345678",
        bedrooms: 2,
        bathrooms: 1,
        parkingSpaces: 1,
        area: 100,
        rent: 1000,
        createdBy: ownerUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Criar 3 contratos ativos
      await contractRepository.create({
        companyId: company.id,
        propertyId: property.id,
        tenantId: existingTenant.id,
        ownerId: "owner-id-1",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-01-01"),
        rentalAmount: 1000,
        paymentDay: 10,
        status: "active",
        createdBy: ownerUser.id,
      });

      await contractRepository.create({
        companyId: company.id,
        propertyId: property.id,
        tenantId: existingTenant.id,
        ownerId: "owner-id-2",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-01-01"),
        rentalAmount: 1000,
        paymentDay: 10,
        status: "active",
        createdBy: ownerUser.id,
      });

      await contractRepository.create({
        companyId: company.id,
        propertyId: property.id,
        tenantId: existingTenant.id,
        ownerId: "owner-id-3",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-01-01"),
        rentalAmount: 1000,
        paymentDay: 10,
        status: "active",
        createdBy: ownerUser.id,
      });

      await expect(
        useCase.execute({
          id: existingTenant.id,
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(
        new BadRequestError(
          "Não é possível excluir este locatário. Existem 3 contrato(s) ativo(s) vinculado(s).",
        ),
      );
    });
  });

  describe("Validação de Contratos no Histórico", () => {
    test("deve lançar erro se existem contratos finalizados (histórico)", async () => {
      const property = {
        id: "property-id",
        companyId: company.id,
        address: "Test Address",
        city: "Test City",
        state: "TS",
        zipCode: "12345678",
        bedrooms: 2,
        bathrooms: 1,
        parkingSpaces: 1,
        area: 100,
        rent: 1000,
        createdBy: ownerUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Criar contrato finalizado (não ativo, mas existe no histórico)
      await contractRepository.create({
        companyId: company.id,
        propertyId: property.id,
        tenantId: existingTenant.id,
        ownerId: "owner-id",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2024-01-01"),
        rentalAmount: 1000,
        paymentDay: 10,
        status: "completed",
        createdBy: ownerUser.id,
      });

      await expect(
        useCase.execute({
          id: existingTenant.id,
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(
        new BadRequestError(
          "Não é possível excluir este locatário. Existem 1 contrato(s) vinculado(s) no histórico.",
        ),
      );

      // Verificar que o locatário NÃO foi excluído
      const tenant = await tenantRepository.findById(existingTenant.id);
      expect(tenant).not.toBeNull();
    });

    test("deve verificar histórico mesmo quando não há contratos ativos", async () => {
      const property = {
        id: "property-id",
        companyId: company.id,
        address: "Test Address",
        city: "Test City",
        state: "TS",
        zipCode: "12345678",
        bedrooms: 2,
        bathrooms: 1,
        parkingSpaces: 1,
        area: 100,
        rent: 1000,
        createdBy: ownerUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Criar apenas contrato cancelado (não ativo)
      await contractRepository.create({
        companyId: company.id,
        propertyId: property.id,
        tenantId: existingTenant.id,
        ownerId: "owner-id",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2024-01-01"),
        rentalAmount: 1000,
        paymentDay: 10,
        status: "cancelled",
        createdBy: ownerUser.id,
      });

      await expect(
        useCase.execute({
          id: existingTenant.id,
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(
        new BadRequestError(
          "Não é possível excluir este locatário. Existem 1 contrato(s) vinculado(s) no histórico.",
        ),
      );
    });

    test("deve incluir a quantidade correta de contratos no histórico na mensagem de erro", async () => {
      const property = {
        id: "property-id",
        companyId: company.id,
        address: "Test Address",
        city: "Test City",
        state: "TS",
        zipCode: "12345678",
        bedrooms: 2,
        bathrooms: 1,
        parkingSpaces: 1,
        area: 100,
        rent: 1000,
        createdBy: ownerUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Criar 2 contratos no histórico
      await contractRepository.create({
        companyId: company.id,
        propertyId: property.id,
        tenantId: existingTenant.id,
        ownerId: "owner-id-1",
        startDate: new Date("2022-01-01"),
        endDate: new Date("2023-01-01"),
        rentalAmount: 1000,
        paymentDay: 10,
        status: "completed",
        createdBy: ownerUser.id,
      });

      await contractRepository.create({
        companyId: company.id,
        propertyId: property.id,
        tenantId: existingTenant.id,
        ownerId: "owner-id-2",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2024-01-01"),
        rentalAmount: 1000,
        paymentDay: 10,
        status: "cancelled",
        createdBy: ownerUser.id,
      });

      await expect(
        useCase.execute({
          id: existingTenant.id,
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(
        new BadRequestError(
          "Não é possível excluir este locatário. Existem 2 contrato(s) vinculado(s) no histórico.",
        ),
      );
    });
  });

  describe("Isolamento por Empresa", () => {
    test("não deve considerar contratos de outras empresas", async () => {
      // Criar outra empresa
      const otherOwner = await userRepository.create({
        email: "other@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Other Owner",
        role: USER_ROLES.OWNER,
        isActive: true,
        isEmailVerified: true,
      });

      const otherCompany = await companyRepository.create({
        name: "Other Company",
        ownerId: otherOwner.id,
        email: "other@test.com",
      });

      const updatedOtherOwner = (await userRepository.update(otherOwner.id, {
        companyId: otherCompany.id,
      })) as User;

      // Criar locatário na outra empresa com mesmo ID (simulação)
      const otherTenant = await tenantRepository.create({
        name: "Tenant from Other Company",
        cpf: "99690852981",
        companyId: otherCompany.id,
        createdBy: updatedOtherOwner.id,
      });

      const property = {
        id: "property-id",
        companyId: otherCompany.id,
        address: "Test Address",
        city: "Test City",
        state: "TS",
        zipCode: "12345678",
        bedrooms: 2,
        bathrooms: 1,
        parkingSpaces: 1,
        area: 100,
        rent: 1000,
        createdBy: updatedOtherOwner.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Criar contrato ativo na outra empresa
      await contractRepository.create({
        companyId: otherCompany.id,
        propertyId: property.id,
        tenantId: otherTenant.id,
        ownerId: updatedOtherOwner.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-01-01"),
        rentalAmount: 1000,
        paymentDay: 10,
        status: "active",
        createdBy: updatedOtherOwner.id,
      });

      // Deve conseguir excluir locatário da primeira empresa (sem contratos)
      const result = await useCase.execute({
        id: existingTenant.id,
        deletedBy: ownerUser,
      });

      expect(result.success).toBe(true);
    });
  });
});
