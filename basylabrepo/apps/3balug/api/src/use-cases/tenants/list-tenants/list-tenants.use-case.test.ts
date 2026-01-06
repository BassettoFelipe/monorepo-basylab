import { beforeEach, describe, expect, test } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { ForbiddenError, InternalServerError } from "@basylab/core/errors";
import type { Company } from "@/db/schema/companies";
import type { Tenant } from "@/db/schema/tenants";
import type { User } from "@/db/schema/users";
import {
  InMemoryCompanyRepository,
  InMemoryTenantRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { ListTenantsUseCase } from "./list-tenants.use-case";

describe("ListTenantsUseCase", () => {
  let useCase: ListTenantsUseCase;
  let tenantRepository: InMemoryTenantRepository;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;

  let ownerUser: User;
  let managerUser: User;
  let brokerUser: User;
  let insuranceAnalystUser: User;
  let company: Company;
  let tenants: Tenant[];

  beforeEach(async () => {
    // Setup repositories
    tenantRepository = new InMemoryTenantRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    // Create use case
    useCase = new ListTenantsUseCase(tenantRepository);

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

    // Create test tenants
    tenants = [];

    // Tenants criados pelo owner
    tenants.push(
      await tenantRepository.create({
        name: "João Silva",
        cpf: "81105850439",
        email: "joao@example.com",
        companyId: company.id,
        createdBy: ownerUser.id,
      }),
    );

    tenants.push(
      await tenantRepository.create({
        name: "Maria Santos",
        cpf: "99690852981",
        email: "maria@example.com",
        companyId: company.id,
        createdBy: ownerUser.id,
      }),
    );

    // Tenants criados pelo broker
    tenants.push(
      await tenantRepository.create({
        name: "Pedro Oliveira",
        cpf: "78864706720",
        email: "pedro@example.com",
        companyId: company.id,
        createdBy: brokerUser.id,
      }),
    );
  });

  describe("Caso de Sucesso - Listagem Básica", () => {
    test("OWNER deve conseguir listar todos os locatários", async () => {
      const result = await useCase.execute({
        requestedBy: ownerUser,
      });

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    test("MANAGER deve conseguir listar todos os locatários", async () => {
      const result = await useCase.execute({
        requestedBy: managerUser,
      });

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    test("INSURANCE_ANALYST deve conseguir listar todos os locatários", async () => {
      const result = await useCase.execute({
        requestedBy: insuranceAnalystUser,
      });

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    test("BROKER deve conseguir listar apenas locatários que ele criou", async () => {
      const result = await useCase.execute({
        requestedBy: brokerUser,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].name).toBe("Pedro Oliveira");
    });

    test("deve retornar lista vazia quando não há locatários", async () => {
      // Criar novo broker sem locatários
      const newBroker = await userRepository.create({
        email: "newbroker@test.com",
        password: await PasswordUtils.hash("Test@123"),
        name: "New Broker",
        role: USER_ROLES.BROKER,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const result = await useCase.execute({
        requestedBy: newBroker,
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("Paginação", () => {
    test("deve respeitar o limite especificado", async () => {
      const result = await useCase.execute({
        limit: 2,
        requestedBy: ownerUser,
      });

      expect(result.data).toHaveLength(2);
      expect(result.limit).toBe(2);
      expect(result.total).toBe(3);
    });

    test("deve respeitar o offset especificado", async () => {
      const result = await useCase.execute({
        limit: 2,
        offset: 2,
        requestedBy: ownerUser,
      });

      expect(result.data).toHaveLength(1);
      expect(result.limit).toBe(2);
      expect(result.offset).toBe(2);
      expect(result.total).toBe(3);
    });

    test("deve usar limite padrão de 20 quando não especificado", async () => {
      const result = await useCase.execute({
        requestedBy: ownerUser,
      });

      expect(result.limit).toBe(20);
    });

    test("deve usar offset padrão de 0 quando não especificado", async () => {
      const result = await useCase.execute({
        requestedBy: ownerUser,
      });

      expect(result.offset).toBe(0);
    });
  });

  describe("Busca/Filtros", () => {
    test("deve buscar por nome", async () => {
      const result = await useCase.execute({
        search: "João",
        requestedBy: ownerUser,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("João Silva");
    });

    test("deve buscar por email", async () => {
      const result = await useCase.execute({
        search: "maria@example.com",
        requestedBy: ownerUser,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Maria Santos");
    });

    test("deve retornar lista vazia quando busca não encontra resultados", async () => {
      const result = await useCase.execute({
        search: "Nome Inexistente",
        requestedBy: ownerUser,
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    test("BROKER deve buscar apenas entre seus próprios locatários", async () => {
      // Broker tenta buscar por João (criado pelo owner)
      const result = await useCase.execute({
        search: "João",
        requestedBy: brokerUser,
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("Formato do Output", () => {
    test("deve remover campos internos (updatedAt, createdBy, companyId)", async () => {
      const result = await useCase.execute({
        requestedBy: ownerUser,
      });

      const firstTenant = result.data[0];

      // Não deve ter campos internos
      expect(firstTenant).not.toHaveProperty("updatedAt");
      expect(firstTenant).not.toHaveProperty("createdBy");
      expect(firstTenant).not.toHaveProperty("companyId");

      // Deve ter campos públicos
      expect(firstTenant).toHaveProperty("id");
      expect(firstTenant).toHaveProperty("name");
      expect(firstTenant).toHaveProperty("cpf");
      expect(firstTenant).toHaveProperty("createdAt");
    });

    test("deve manter createdAt para exibição no frontend", async () => {
      const result = await useCase.execute({
        requestedBy: ownerUser,
      });

      const firstTenant = result.data[0];
      expect(firstTenant.createdAt).toBeDefined();
      expect(firstTenant.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("Isolamento por Empresa", () => {
    test("deve listar apenas locatários da empresa do usuário", async () => {
      // Criar outra empresa com locatários
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

      // Criar locatário na outra empresa
      await tenantRepository.create({
        name: "Carlos Almeida",
        cpf: "20142327093",
        companyId: otherCompany.id,
        createdBy: updatedOtherOwner.id,
      });

      // Owner da primeira empresa deve ver apenas 3 locatários
      const result = await useCase.execute({
        requestedBy: ownerUser,
      });

      expect(result.total).toBe(3);
      expect(result.data).toHaveLength(3);
      expect(result.data.every((t) => t.name !== "Carlos Almeida")).toBe(true);
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
          requestedBy: userWithoutCompany,
        }),
      ).rejects.toThrow(new InternalServerError("Usuário sem empresa vinculada."));
    });

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
          requestedBy: adminUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para listar locatários."));
    });
  });
});
