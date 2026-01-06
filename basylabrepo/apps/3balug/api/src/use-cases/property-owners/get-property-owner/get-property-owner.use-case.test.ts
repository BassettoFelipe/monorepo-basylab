import { beforeEach, describe, expect, test } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { ForbiddenError, InternalServerError, NotFoundError } from "@basylab/core/errors";
import type { Company } from "@/db/schema/companies";
import type { PropertyOwner } from "@/db/schema/property-owners";
import type { User } from "@/db/schema/users";
import {
  InMemoryCompanyRepository,
  InMemoryPropertyOwnerRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { GetPropertyOwnerUseCase } from "./get-property-owner.use-case";

describe("GetPropertyOwnerUseCase", () => {
  let useCase: GetPropertyOwnerUseCase;
  let propertyOwnerRepository: InMemoryPropertyOwnerRepository;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;

  let ownerUser: User;
  let managerUser: User;
  let brokerUser: User;
  let insuranceAnalystUser: User;
  let company: Company;
  let existingPropertyOwner: PropertyOwner;

  beforeEach(async () => {
    // Setup repositories
    propertyOwnerRepository = new InMemoryPropertyOwnerRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    // Create use case
    useCase = new GetPropertyOwnerUseCase(propertyOwnerRepository);

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

    // Create existing property owner with complete data
    existingPropertyOwner = await propertyOwnerRepository.create({
      name: "João Silva Proprietário",
      documentType: "cpf",
      document: "81105850439",
      email: "joao.owner@example.com",
      phone: "11999999999",
      address: "Rua dos Proprietários, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234567",
      birthDate: "1970-05-15",
      notes: "Proprietário VIP",
      companyId: company.id,
      createdBy: ownerUser.id,
    });
  });

  describe("Caso de Sucesso", () => {
    test("OWNER deve conseguir buscar proprietário com todos os campos", async () => {
      const result = await useCase.execute({
        id: existingPropertyOwner.id,
        requestedBy: ownerUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(existingPropertyOwner.id);
      expect(result.name).toBe("João Silva Proprietário");
      expect(result.document).toBe("81105850439");
      expect(result.email).toBe("joao.owner@example.com");
      expect(result.phone).toBe("11999999999");
      expect(result.address).toBe("Rua dos Proprietários, 123");
      expect(result.city).toBe("São Paulo");
      expect(result.state).toBe("SP");
      expect(result.zipCode).toBe("01234567");
      expect(result.birthDate).toBe("1970-05-15");
      expect(result.notes).toBe("Proprietário VIP");
    });

    test("MANAGER deve conseguir buscar proprietário", async () => {
      const result = await useCase.execute({
        id: existingPropertyOwner.id,
        requestedBy: managerUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(existingPropertyOwner.id);
      expect(result.name).toBe("João Silva Proprietário");
    });

    test("INSURANCE_ANALYST deve conseguir buscar proprietário", async () => {
      const result = await useCase.execute({
        id: existingPropertyOwner.id,
        requestedBy: insuranceAnalystUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(existingPropertyOwner.id);
      expect(result.name).toBe("João Silva Proprietário");
    });

    test("BROKER deve conseguir buscar proprietário que ele criou", async () => {
      // Criar proprietário pelo broker
      const brokerPropertyOwner = await propertyOwnerRepository.create({
        name: "Cliente do Broker",
        documentType: "cpf",
        document: "78864706720",
        companyId: company.id,
        createdBy: brokerUser.id,
      });

      const result = await useCase.execute({
        id: brokerPropertyOwner.id,
        requestedBy: brokerUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(brokerPropertyOwner.id);
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
          id: existingPropertyOwner.id,
          requestedBy: userWithoutCompany,
        }),
      ).rejects.toThrow(new InternalServerError("Usuário sem empresa vinculada."));
    });

    test("deve lançar erro se proprietário não existe", async () => {
      await expect(
        useCase.execute({
          id: "non-existent-id",
          requestedBy: ownerUser,
        }),
      ).rejects.toThrow(new NotFoundError("Proprietário não encontrado."));
    });

    test("deve lançar erro se proprietário pertence a outra empresa", async () => {
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
          id: existingPropertyOwner.id,
          requestedBy: updatedOtherOwner,
        }),
      ).rejects.toThrow(new NotFoundError("Proprietário não encontrado."));
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
          id: existingPropertyOwner.id,
          requestedBy: adminUser,
        }),
      ).rejects.toThrow(
        new ForbiddenError("Você não tem permissão para visualizar proprietários."),
      );
    });

    test("BROKER não pode visualizar proprietário criado por outro usuário", async () => {
      await expect(
        useCase.execute({
          id: existingPropertyOwner.id, // Criado pelo owner
          requestedBy: brokerUser,
        }),
      ).rejects.toThrow(
        new ForbiddenError("Você só pode visualizar proprietários que você cadastrou."),
      );
    });

    test("OWNER pode visualizar qualquer proprietário da empresa", async () => {
      // Criar proprietário pelo broker
      const brokerPropertyOwner = await propertyOwnerRepository.create({
        name: "Cliente do Broker",
        documentType: "cpf",
        document: "78864706720",
        companyId: company.id,
        createdBy: brokerUser.id,
      });

      const result = await useCase.execute({
        id: brokerPropertyOwner.id,
        requestedBy: ownerUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(brokerPropertyOwner.id);
    });

    test("MANAGER pode visualizar qualquer proprietário da empresa", async () => {
      // Criar proprietário pelo broker
      const brokerPropertyOwner = await propertyOwnerRepository.create({
        name: "Cliente do Broker",
        documentType: "cpf",
        document: "78864706720",
        companyId: company.id,
        createdBy: brokerUser.id,
      });

      const result = await useCase.execute({
        id: brokerPropertyOwner.id,
        requestedBy: managerUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(brokerPropertyOwner.id);
    });

    test("INSURANCE_ANALYST pode visualizar qualquer proprietário da empresa", async () => {
      // Criar proprietário pelo broker
      const brokerPropertyOwner = await propertyOwnerRepository.create({
        name: "Cliente do Broker",
        documentType: "cpf",
        document: "78864706720",
        companyId: company.id,
        createdBy: brokerUser.id,
      });

      const result = await useCase.execute({
        id: brokerPropertyOwner.id,
        requestedBy: insuranceAnalystUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(brokerPropertyOwner.id);
    });
  });

  describe("Campos do Output", () => {
    test("deve retornar todos os campos disponíveis do proprietário", async () => {
      const result = await useCase.execute({
        id: existingPropertyOwner.id,
        requestedBy: ownerUser,
      });

      // Verificar que todos os campos estão presentes
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("document");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("phone");
      expect(result).toHaveProperty("birthDate");
      expect(result).toHaveProperty("address");
      expect(result).toHaveProperty("city");
      expect(result).toHaveProperty("state");
      expect(result).toHaveProperty("zipCode");
      expect(result).toHaveProperty("notes");
    });

    test("deve retornar campos opcionais como null ou undefined quando não preenchidos", async () => {
      // Criar proprietário com campos mínimos
      const minimalPropertyOwner = await propertyOwnerRepository.create({
        name: "Maria Santos Proprietária",
        documentType: "cpf",
        document: "99690852981",
        companyId: company.id,
        createdBy: ownerUser.id,
      });

      const result = await useCase.execute({
        id: minimalPropertyOwner.id,
        requestedBy: ownerUser,
      });

      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.birthDate).toBeNull();
      expect(result.address).toBeNull();
      expect(result.city).toBeNull();
      expect(result.state).toBeNull();
      expect(result.zipCode).toBeNull();
      expect(result.notes).toBeNull();
    });

    test("deve retornar document corretamente", async () => {
      const result = await useCase.execute({
        id: existingPropertyOwner.id,
        requestedBy: ownerUser,
      });

      expect(result.document).toBe("81105850439");
      expect(result.name).toBe("João Silva Proprietário");
      expect(result.email).toBe("joao.owner@example.com");
    });
  });
});
