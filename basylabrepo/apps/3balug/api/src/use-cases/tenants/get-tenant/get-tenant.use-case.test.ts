import { beforeEach, describe, expect, test } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { ForbiddenError, InternalServerError, NotFoundError } from "@basylab/core/errors";
import type { Company } from "@/db/schema/companies";
import type { Tenant } from "@/db/schema/tenants";
import type { User } from "@/db/schema/users";
import {
  InMemoryCompanyRepository,
  InMemoryTenantRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { GetTenantUseCase } from "./get-tenant.use-case";

describe("GetTenantUseCase", () => {
  let useCase: GetTenantUseCase;
  let tenantRepository: InMemoryTenantRepository;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;

  let ownerUser: User;
  let managerUser: User;
  let brokerUser: User;
  let insuranceAnalystUser: User;
  let company: Company;
  let existingTenant: Tenant;

  beforeEach(async () => {
    // Setup repositories
    tenantRepository = new InMemoryTenantRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    // Create use case
    useCase = new GetTenantUseCase(tenantRepository);

    // Create owner user
    ownerUser = await userRepository.create({
      email: "owner@test.com",
      password: await PasswordUtils.hash("Test@123"),
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

    // Create existing tenant
    existingTenant = await tenantRepository.create({
      name: "João Silva",
      cpf: "81105850439",
      email: "joao@example.com",
      phone: "11999999999",
      address: "Rua Teste, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234567",
      birthDate: "1990-01-01",
      monthlyIncome: 5000,
      employer: "Empresa Teste",
      emergencyContact: "Maria Silva",
      emergencyPhone: "11988888888",
      notes: "Cliente VIP",
      companyId: company.id,
      createdBy: ownerUser.id,
    });
  });

  describe("Caso de Sucesso", () => {
    test("OWNER deve conseguir buscar locatário", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        requestedBy: ownerUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(existingTenant.id);
      expect(result.name).toBe("João Silva");
      expect(result.email).toBe("joao@example.com");
      expect(result.phone).toBe("11999999999");
      expect(result.address).toBe("Rua Teste, 123");
      expect(result.city).toBe("São Paulo");
      expect(result.state).toBe("SP");
      expect(result.zipCode).toBe("01234567");
      expect(result.birthDate).toBe("1990-01-01");
      expect(result.monthlyIncome).toBe(5000);
      expect(result.notes).toBe("Cliente VIP");
    });

    test("MANAGER deve conseguir buscar locatário", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        requestedBy: managerUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(existingTenant.id);
      expect(result.name).toBe("João Silva");
    });

    test("INSURANCE_ANALYST deve conseguir buscar locatário", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        requestedBy: insuranceAnalystUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(existingTenant.id);
      expect(result.name).toBe("João Silva");
    });

    test("BROKER deve conseguir buscar locatário que ele criou", async () => {
      // Criar locatário pelo broker
      const brokerTenant = await tenantRepository.create({
        name: "Cliente do Broker",
        cpf: "78864706720",
        companyId: company.id,
        createdBy: brokerUser.id,
      });

      const result = await useCase.execute({
        id: brokerTenant.id,
        requestedBy: brokerUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(brokerTenant.id);
      expect(result.name).toBe("Cliente do Broker");
    });
  });

  describe("Validações de Erro", () => {
    test("deve lançar erro se usuário não tem empresa vinculada", async () => {
      const userWithoutCompany = await userRepository.create({
        email: "orphan@test.com",
        password: await PasswordUtils.hash("Test@123"),
        name: "Orphan User",
        role: USER_ROLES.OWNER,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          id: existingTenant.id,
          requestedBy: userWithoutCompany,
        }),
      ).rejects.toThrow(new InternalServerError("Usuário sem empresa vinculada."));
    });

    test("deve lançar erro se locatário não existe", async () => {
      await expect(
        useCase.execute({
          id: "non-existent-id",
          requestedBy: ownerUser,
        }),
      ).rejects.toThrow(new NotFoundError("Locatário não encontrado."));
    });

    test("deve lançar erro se locatário pertence a outra empresa", async () => {
      // Criar outra empresa
      const otherOwner = await userRepository.create({
        email: "other@test.com",
        password: await PasswordUtils.hash("Test@123"),
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
          requestedBy: updatedOtherOwner,
        }),
      ).rejects.toThrow(new NotFoundError("Locatário não encontrado."));
    });
  });

  describe("Controle de Permissões por Role", () => {
    test("ADMIN não está na lista de roles permitidos e deve lançar erro", async () => {
      const adminUser = await userRepository.create({
        email: "admin@test.com",
        password: await PasswordUtils.hash("Test@123"),
        name: "Admin User",
        role: USER_ROLES.ADMIN,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          id: existingTenant.id,
          requestedBy: adminUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para visualizar locatários."));
    });

    test("BROKER não pode visualizar locatário criado por outro usuário", async () => {
      await expect(
        useCase.execute({
          id: existingTenant.id, // Criado pelo owner
          requestedBy: brokerUser,
        }),
      ).rejects.toThrow(
        new ForbiddenError("Você só pode visualizar locatários que você cadastrou."),
      );
    });

    test("OWNER pode visualizar qualquer locatário da empresa", async () => {
      // Criar locatário pelo broker
      const brokerTenant = await tenantRepository.create({
        name: "Cliente do Broker",
        cpf: "78864706720",
        companyId: company.id,
        createdBy: brokerUser.id,
      });

      const result = await useCase.execute({
        id: brokerTenant.id,
        requestedBy: ownerUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(brokerTenant.id);
    });

    test("MANAGER pode visualizar qualquer locatário da empresa", async () => {
      // Criar locatário pelo broker
      const brokerTenant = await tenantRepository.create({
        name: "Cliente do Broker",
        cpf: "78864706720",
        companyId: company.id,
        createdBy: brokerUser.id,
      });

      const result = await useCase.execute({
        id: brokerTenant.id,
        requestedBy: managerUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(brokerTenant.id);
    });

    test("INSURANCE_ANALYST pode visualizar qualquer locatário da empresa", async () => {
      // Criar locatário pelo broker
      const brokerTenant = await tenantRepository.create({
        name: "Cliente do Broker",
        cpf: "78864706720",
        companyId: company.id,
        createdBy: brokerUser.id,
      });

      const result = await useCase.execute({
        id: brokerTenant.id,
        requestedBy: insuranceAnalystUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(brokerTenant.id);
    });
  });

  describe("Campos do Output", () => {
    test("deve retornar todos os campos disponíveis do locatário", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        requestedBy: ownerUser,
      });

      // Verificar que todos os campos estão presentes
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("cpf");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("phone");
      expect(result).toHaveProperty("birthDate");
      expect(result).toHaveProperty("monthlyIncome");
      expect(result).toHaveProperty("employer");
      expect(result).toHaveProperty("emergencyContact");
      expect(result).toHaveProperty("emergencyPhone");
      expect(result).toHaveProperty("address");
      expect(result).toHaveProperty("city");
      expect(result).toHaveProperty("state");
      expect(result).toHaveProperty("zipCode");
      expect(result).toHaveProperty("notes");
    });

    test("deve retornar campos opcionais como null ou undefined quando não preenchidos", async () => {
      // Criar locatário com campos mínimos
      const minimalTenant = await tenantRepository.create({
        name: "Maria Santos",
        cpf: "99690852981",
        companyId: company.id,
        createdBy: ownerUser.id,
      });

      const result = await useCase.execute({
        id: minimalTenant.id,
        requestedBy: ownerUser,
      });

      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.birthDate).toBeNull();
      // Campos opcionais retornam null quando não preenchidos
      expect(result.monthlyIncome).toBeNull();
      expect(result.employer).toBeNull();
      expect(result.emergencyContact).toBeNull();
      expect(result.emergencyPhone).toBeNull();
      expect(result.address).toBeNull();
      expect(result.city).toBeNull();
      expect(result.state).toBeNull();
      expect(result.zipCode).toBeNull();
      expect(result.notes).toBeNull();
    });
  });
});
