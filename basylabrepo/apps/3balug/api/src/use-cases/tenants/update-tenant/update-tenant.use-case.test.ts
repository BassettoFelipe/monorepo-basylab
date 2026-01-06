import { beforeEach, describe, expect, test } from "bun:test";
import type { Company } from "@/db/schema/companies";
import type { Tenant } from "@/db/schema/tenants";
import type { User } from "@/db/schema/users";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "@/errors";
import { ContactValidationService } from "@/services/validation/contact-validation.service";
import { DocumentValidationService } from "@/services/validation/document-validation.service";
import {
  InMemoryCompanyRepository,
  InMemoryTenantRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { CryptoUtils } from "@/utils/crypto.utils";
import { UpdateTenantUseCase } from "./update-tenant.use-case";

describe("UpdateTenantUseCase", () => {
  let useCase: UpdateTenantUseCase;
  let tenantRepository: InMemoryTenantRepository;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;
  let documentValidationService: DocumentValidationService;
  let contactValidationService: ContactValidationService;

  let ownerUser: User;
  let brokerUser: User;
  let company: Company;
  let existingTenant: Tenant;

  beforeEach(async () => {
    // Setup repositories
    tenantRepository = new InMemoryTenantRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    // Setup services
    documentValidationService = new DocumentValidationService();
    contactValidationService = new ContactValidationService();

    // Create use case
    useCase = new UpdateTenantUseCase(
      tenantRepository,
      documentValidationService,
      contactValidationService,
    );

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

    // Create broker user
    brokerUser = await userRepository.create({
      email: "broker@test.com",
      password: await CryptoUtils.hashPassword("Test@123"),
      name: "Broker User",
      role: USER_ROLES.BROKER,
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
      companyId: company.id,
      createdBy: ownerUser.id,
    });
  });

  describe("Caso de Sucesso - Atualizações Parciais", () => {
    test("deve atualizar apenas o nome do locatário", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        name: "João Silva Santos",
        updatedBy: ownerUser,
      });

      expect(result.name).toBe("João Silva Santos");
      expect(result.cpf).toBe(existingTenant.cpf);
      expect(result.email).toBe(existingTenant.email);
    });

    test("deve atualizar apenas o CPF do locatário", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        cpf: "996.908.529-81",
        updatedBy: ownerUser,
      });

      expect(result.cpf).toBe("99690852981");
      expect(result.name).toBe(existingTenant.name);
    });

    test("deve atualizar apenas o email do locatário", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        email: "joao.silva@example.com",
        updatedBy: ownerUser,
      });

      expect(result.email).toBe("joao.silva@example.com");
      expect(result.name).toBe(existingTenant.name);
    });

    test("deve atualizar múltiplos campos ao mesmo tempo", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        name: "João Silva Santos",
        address: "Rua Nova, 456",
        city: "Rio de Janeiro",
        state: "rj",
        monthlyIncome: 8000,
        updatedBy: ownerUser,
      });

      expect(result.name).toBe("João Silva Santos");
      expect(result.address).toBe("Rua Nova, 456");
      expect(result.city).toBe("Rio de Janeiro");
      expect(result.state).toBe("RJ");
      expect(result.monthlyIncome).toBe(8000);
    });

    test("deve retornar locatário inalterado quando nenhum campo é fornecido", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        updatedBy: ownerUser,
      });

      expect(result).toEqual(existingTenant);
    });

    test("deve normalizar CPF removendo caracteres especiais", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        cpf: "788.647.067-20",
        updatedBy: ownerUser,
      });

      expect(result.cpf).toBe("78864706720");
    });

    test("deve normalizar email para lowercase", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        email: "JOAO.NOVO@EXAMPLE.COM",
        updatedBy: ownerUser,
      });

      expect(result.email).toBe("joao.novo@example.com");
    });

    test("deve normalizar telefone removendo caracteres especiais", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        phone: "(21) 98765-4321",
        updatedBy: ownerUser,
      });

      expect(result.phone).toBe("21987654321");
    });

    test("deve normalizar estado para maiúsculo", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        state: "mg",
        updatedBy: ownerUser,
      });

      expect(result.state).toBe("MG");
    });

    test("deve normalizar CEP removendo caracteres especiais", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        zipCode: "12345-678",
        updatedBy: ownerUser,
      });

      expect(result.zipCode).toBe("12345678");
    });
  });

  describe("Conversão de Campos para Null", () => {
    test("deve converter email vazio para null", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        email: null,
        updatedBy: ownerUser,
      });

      expect(result.email).toBeNull();
    });

    test("deve converter telefone vazio para null", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        phone: null,
        updatedBy: ownerUser,
      });

      expect(result.phone).toBeNull();
    });

    test("deve converter campos opcionais vazios para null", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        employer: null,
        notes: null,
        updatedBy: ownerUser,
      });

      expect(result.address).toBeNull();
      expect(result.city).toBeNull();
      expect(result.state).toBeNull();
      expect(result.zipCode).toBeNull();
      expect(result.employer).toBeNull();
      expect(result.notes).toBeNull();
    });

    test("deve converter renda mensal zero para null", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        monthlyIncome: 0,
        updatedBy: ownerUser,
      });

      expect(result.monthlyIncome).toBeNull();
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
          name: "Novo Nome",
          updatedBy: userWithoutCompany,
        }),
      ).rejects.toThrow(new InternalServerError("Usuário sem empresa vinculada"));
    });

    test("deve lançar erro se locatário não existe", async () => {
      await expect(
        useCase.execute({
          id: "non-existent-id",
          name: "Novo Nome",
          updatedBy: ownerUser,
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
          name: "Novo Nome",
          updatedBy: updatedOtherOwner,
        }),
      ).rejects.toThrow(new NotFoundError("Locatário não encontrado."));
    });

    test("deve lançar erro para CPF inválido", async () => {
      await expect(
        useCase.execute({
          id: existingTenant.id,
          cpf: "111.111.111-11",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("deve lançar erro para email inválido", async () => {
      await expect(
        useCase.execute({
          id: existingTenant.id,
          email: "email-invalido",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("deve lançar erro para renda mensal negativa", async () => {
      await expect(
        useCase.execute({
          id: existingTenant.id,
          monthlyIncome: -1000,
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(new BadRequestError("Renda mensal não pode ser negativa."));
    });
  });

  describe("Validação de CPF Duplicado", () => {
    test("deve lançar erro ao tentar atualizar para CPF já existente na mesma empresa", async () => {
      // Criar segundo locatário
      await tenantRepository.create({
        name: "Maria Santos",
        cpf: "99690852981",
        companyId: company.id,
        createdBy: ownerUser.id,
      });

      // Tentar atualizar primeiro locatário com CPF do segundo
      await expect(
        useCase.execute({
          id: existingTenant.id,
          cpf: "996.908.529-81",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(ConflictError);
    });

    test("deve permitir atualizar locatário mantendo o mesmo CPF", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        cpf: "811.058.504-39", // Mesmo CPF, apenas com formatação
        name: "Novo Nome",
        updatedBy: ownerUser,
      });

      expect(result.cpf).toBe("81105850439");
      expect(result.name).toBe("Novo Nome");
    });

    test("deve permitir atualizar para CPF que existe em outra empresa", async () => {
      // Criar outra empresa com locatário
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

      await tenantRepository.create({
        name: "Pedro Oliveira",
        cpf: "78864706720",
        companyId: otherCompany.id,
        createdBy: updatedOtherOwner.id,
      });

      // Deve permitir atualizar locatário da primeira empresa com CPF que existe na segunda
      const result = await useCase.execute({
        id: existingTenant.id,
        cpf: "788.647.067-20",
        updatedBy: ownerUser,
      });

      expect(result.cpf).toBe("78864706720");
    });
  });

  describe("Validação de Email Duplicado", () => {
    test("deve lançar erro ao tentar atualizar para email já existente na mesma empresa", async () => {
      // Criar segundo locatário
      await tenantRepository.create({
        name: "Maria Santos",
        cpf: "99690852981",
        email: "maria@example.com",
        companyId: company.id,
        createdBy: ownerUser.id,
      });

      // Tentar atualizar primeiro locatário com email do segundo
      await expect(
        useCase.execute({
          id: existingTenant.id,
          email: "maria@example.com",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(ConflictError);
    });

    test("deve permitir atualizar locatário mantendo o mesmo email", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        email: "joao@example.com", // Mesmo email
        name: "Novo Nome",
        updatedBy: ownerUser,
      });

      expect(result.email).toBe("joao@example.com");
      expect(result.name).toBe("Novo Nome");
    });

    test("deve lançar erro para email duplicado case-insensitive", async () => {
      await tenantRepository.create({
        name: "Maria Santos",
        cpf: "99690852981",
        email: "maria@example.com",
        companyId: company.id,
        createdBy: ownerUser.id,
      });

      await expect(
        useCase.execute({
          id: existingTenant.id,
          email: "MARIA@EXAMPLE.COM",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(ConflictError);
    });

    test("deve permitir atualizar para email que existe em outra empresa", async () => {
      // Criar outra empresa com locatário
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

      await tenantRepository.create({
        name: "Pedro Oliveira",
        cpf: "78864706720",
        email: "pedro@example.com",
        companyId: otherCompany.id,
        createdBy: updatedOtherOwner.id,
      });

      // Deve permitir atualizar locatário da primeira empresa com email que existe na segunda
      const result = await useCase.execute({
        id: existingTenant.id,
        email: "pedro@example.com",
        updatedBy: ownerUser,
      });

      expect(result.email).toBe("pedro@example.com");
    });
  });

  describe("Controle de Permissões - BROKER", () => {
    test("BROKER deve poder editar locatário que ele mesmo criou", async () => {
      // Criar locatário pelo broker
      const brokerTenant = await tenantRepository.create({
        name: "Cliente do Broker",
        cpf: "78864706720",
        companyId: company.id,
        createdBy: brokerUser.id,
      });

      const result = await useCase.execute({
        id: brokerTenant.id,
        name: "Nome Atualizado",
        updatedBy: brokerUser,
      });

      expect(result.name).toBe("Nome Atualizado");
    });

    test("BROKER não deve poder editar locatário criado por outro usuário", async () => {
      await expect(
        useCase.execute({
          id: existingTenant.id, // Criado pelo owner
          name: "Nome Atualizado",
          updatedBy: brokerUser,
        }),
      ).rejects.toThrow(new ForbiddenError("Você só pode editar locatários que você cadastrou."));
    });

    test("OWNER deve poder editar qualquer locatário da empresa", async () => {
      // Criar locatário pelo broker
      const brokerTenant = await tenantRepository.create({
        name: "Cliente do Broker",
        cpf: "78864706720",
        companyId: company.id,
        createdBy: brokerUser.id,
      });

      // Owner pode editar
      const result = await useCase.execute({
        id: brokerTenant.id,
        name: "Nome Atualizado pelo Owner",
        updatedBy: ownerUser,
      });

      expect(result.name).toBe("Nome Atualizado pelo Owner");
    });

    test("ADMIN deve poder editar qualquer locatário da empresa", async () => {
      // Criar admin user
      const adminUser = await userRepository.create({
        email: "admin@test.com",
        password: await CryptoUtils.hashPassword("Test@123"),
        name: "Admin User",
        role: USER_ROLES.ADMIN,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      // Admin pode editar
      const result = await useCase.execute({
        id: existingTenant.id,
        name: "Nome Atualizado pelo Admin",
        updatedBy: adminUser,
      });

      expect(result.name).toBe("Nome Atualizado pelo Admin");
    });
  });

  describe("Trim de Strings", () => {
    test("deve fazer trim de strings com espaços", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        name: "  João Silva Santos  ",
        address: "  Rua Teste  ",
        city: "  São Paulo  ",
        employer: "  Empresa  ",
        emergencyContact: "  Maria  ",
        notes: "  Notas  ",
        updatedBy: ownerUser,
      });

      expect(result.name).toBe("João Silva Santos");
      expect(result.address).toBe("Rua Teste");
      expect(result.city).toBe("São Paulo");
      expect(result.employer).toBe("Empresa");
      expect(result.emergencyContact).toBe("Maria");
      expect(result.notes).toBe("Notas");
    });

    test("deve converter strings apenas com espaços para null", async () => {
      const result = await useCase.execute({
        id: existingTenant.id,
        address: "   ",
        city: "   ",
        employer: "   ",
        notes: "   ",
        updatedBy: ownerUser,
      });

      expect(result.address).toBeNull();
      expect(result.city).toBeNull();
      expect(result.employer).toBeNull();
      expect(result.notes).toBeNull();
    });
  });
});
