import { beforeEach, describe, expect, test } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "@basylab/core/errors";
import { ContactValidator, DocumentValidator } from "@basylab/core/validation";
import type { Company } from "@/db/schema/companies";
import type { PropertyOwner } from "@/db/schema/property-owners";
import type { User } from "@/db/schema/users";
import {
  InMemoryCompanyRepository,
  InMemoryPropertyOwnerRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { UpdatePropertyOwnerUseCase } from "./update-property-owner.use-case";

describe("UpdatePropertyOwnerUseCase", () => {
  let useCase: UpdatePropertyOwnerUseCase;
  let propertyOwnerRepository: InMemoryPropertyOwnerRepository;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;
  let documentValidator: DocumentValidator;
  let contactValidator: ContactValidator;

  let ownerUser: User;
  let brokerUser: User;
  let company: Company;
  let existingOwner: PropertyOwner;

  beforeEach(async () => {
    // Setup repositories
    propertyOwnerRepository = new InMemoryPropertyOwnerRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    // Setup services
    documentValidator = new DocumentValidator();
    contactValidator = new ContactValidator();

    // Create use case
    useCase = new UpdatePropertyOwnerUseCase(
      propertyOwnerRepository,
      documentValidator,
      contactValidator,
    );

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

    // Create existing property owner
    existingOwner = await propertyOwnerRepository.create({
      name: "João Silva Proprietário",
      documentType: "cpf",
      document: "81105850439",
      email: "joao@example.com",
      phone: "11999999999",
      address: "Rua Teste, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234567",
      companyId: company.id,
      createdBy: ownerUser.id,
    });
  });

  describe("Caso de Sucesso - Atualizações Parciais", () => {
    test("deve atualizar apenas o nome do proprietário", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        name: "Maria Santos Proprietária",
        updatedBy: ownerUser,
      });

      expect(result.id).toBe(existingOwner.id);
      expect(result.name).toBe("Maria Santos Proprietária");
      expect(result.document).toBe(existingOwner.document);
      expect(result.email).toBe(existingOwner.email);
    });

    test("deve atualizar apenas o email", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        email: "newemail@example.com",
        updatedBy: ownerUser,
      });

      expect(result.email).toBe("newemail@example.com");
      expect(result.name).toBe(existingOwner.name);
    });

    test("deve atualizar apenas o telefone", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        phone: "(11) 88888-8888",
        updatedBy: ownerUser,
      });

      expect(result.phone).toBe("11888888888");
      expect(result.name).toBe(existingOwner.name);
    });

    test("deve atualizar múltiplos campos ao mesmo tempo", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        name: "Updated Owner",
        email: "updated@example.com",
        phone: "(11) 77777-7777",
        address: "Nova Rua, 456",
        city: "Rio de Janeiro",
        state: "rj",
        zipCode: "20000-000",
        notes: "Proprietário atualizado",
        updatedBy: ownerUser,
      });

      expect(result.name).toBe("Updated Owner");
      expect(result.email).toBe("updated@example.com");
      expect(result.phone).toBe("11777777777");
      expect(result.address).toBe("Nova Rua, 456");
      expect(result.city).toBe("Rio de Janeiro");
      expect(result.state).toBe("RJ");
      expect(result.zipCode).toBe("20000000");
      expect(result.notes).toBe("Proprietário atualizado");
    });

    test("deve atualizar documentType e document juntos", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        documentType: "cnpj",
        document: "11.222.333/0001-81",
        updatedBy: ownerUser,
      });

      expect(result.documentType).toBe("cnpj");
      expect(result.document).toBe("11222333000181");
    });

    test("deve permitir atualizar apenas documentType mantendo document", async () => {
      // Create owner with CNPJ
      const ownerWithCnpj = await propertyOwnerRepository.create({
        name: "Company Owner",
        documentType: "cnpj",
        document: "11222333000181",
        companyId: company.id,
        createdBy: ownerUser.id,
      });

      const result = await useCase.execute({
        id: ownerWithCnpj.id,
        documentType: "cpf",
        document: "788.647.067-20",
        updatedBy: ownerUser,
      });

      expect(result.documentType).toBe("cpf");
      expect(result.document).toBe("78864706720");
    });
  });

  describe("Validação de Proprietário Não Encontrado", () => {
    test("deve lançar erro quando proprietário não existe", async () => {
      await expect(
        useCase.execute({
          id: "non-existent-id",
          name: "Test",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(NotFoundError);

      await expect(
        useCase.execute({
          id: "non-existent-id",
          name: "Test",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow("Proprietário não encontrado.");
    });
  });

  describe("Validação de Usuário sem Empresa", () => {
    test("deve lançar erro quando usuário não tem empresa vinculada", async () => {
      const userWithoutCompany = await userRepository.create({
        email: "nocompany@test.com",
        password: await PasswordUtils.hash("Test@123"),
        name: "User Without Company",
        role: USER_ROLES.OWNER,
        isActive: true,
        isEmailVerified: true,
      });

      await expect(
        useCase.execute({
          id: existingOwner.id,
          name: "Test",
          updatedBy: userWithoutCompany,
        }),
      ).rejects.toThrow(InternalServerError);

      await expect(
        useCase.execute({
          id: existingOwner.id,
          name: "Test",
          updatedBy: userWithoutCompany,
        }),
      ).rejects.toThrow("Usuário sem empresa vinculada");
    });
  });

  describe("Validação de Email Duplicado", () => {
    test("deve lançar erro quando email já existe em outro proprietário", async () => {
      await propertyOwnerRepository.create({
        name: "Another Owner",
        documentType: "cpf",
        document: "78864706720",
        email: "duplicate@example.com",
        companyId: company.id,
        createdBy: ownerUser.id,
      });

      await expect(
        useCase.execute({
          id: existingOwner.id,
          email: "duplicate@example.com",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(ConflictError);

      await expect(
        useCase.execute({
          id: existingOwner.id,
          email: "duplicate@example.com",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow("Já existe um proprietário cadastrado com este e-mail na sua empresa");
    });

    test("deve validar email duplicado case-insensitive", async () => {
      await propertyOwnerRepository.create({
        name: "Another Owner",
        documentType: "cpf",
        document: "78864706720",
        email: "DUPLICATE@EXAMPLE.COM",
        companyId: company.id,
        createdBy: ownerUser.id,
      });

      await expect(
        useCase.execute({
          id: existingOwner.id,
          email: "duplicate@example.com",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(ConflictError);
    });

    test("deve permitir manter o mesmo email do proprietário", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        email: existingOwner.email,
        name: "Updated Name",
        updatedBy: ownerUser,
      });

      expect(result.email).toBe(existingOwner.email);
      expect(result.name).toBe("Updated Name");
    });

    test("deve permitir mesmo email em empresas diferentes", async () => {
      // Create another company
      const anotherOwner = await userRepository.create({
        email: "another@test.com",
        password: await PasswordUtils.hash("Test@123"),
        name: "Another Owner",
        role: USER_ROLES.OWNER,
        isActive: true,
        isEmailVerified: true,
      });

      const anotherCompany = await companyRepository.create({
        name: "Another Company",
        ownerId: anotherOwner.id,
        email: "another@test.com",
      });

      await userRepository.update(anotherOwner.id, {
        companyId: anotherCompany.id,
      });

      const ownerInAnotherCompany = await propertyOwnerRepository.create({
        name: "Owner 2",
        documentType: "cpf",
        document: "78864706720",
        email: "same@test.com",
        companyId: anotherCompany.id,
        createdBy: anotherOwner.id,
      });

      const updatedAnotherOwner = (await userRepository.findById(anotherOwner.id)) as User;

      const result = await useCase.execute({
        id: ownerInAnotherCompany.id,
        email: existingOwner.email,
        updatedBy: updatedAnotherOwner,
      });

      expect(result.email).toBe(existingOwner.email);
      expect(result.companyId).toBe(anotherCompany.id);
    });
  });

  describe("Validação de Documento Duplicado", () => {
    test("deve lançar erro quando CPF já existe em outro proprietário", async () => {
      await propertyOwnerRepository.create({
        name: "Another Owner",
        documentType: "cpf",
        document: "78864706720",
        companyId: company.id,
        createdBy: ownerUser.id,
      });

      await expect(
        useCase.execute({
          id: existingOwner.id,
          document: "788.647.067-20",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(ConflictError);

      await expect(
        useCase.execute({
          id: existingOwner.id,
          document: "788.647.067-20",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow("Já existe um proprietário cadastrado com este documento na sua empresa");
    });

    test("deve lançar erro quando CNPJ já existe em outro proprietário", async () => {
      await propertyOwnerRepository.create({
        name: "Another Company",
        documentType: "cnpj",
        document: "11222333000181",
        companyId: company.id,
        createdBy: ownerUser.id,
      });

      await expect(
        useCase.execute({
          id: existingOwner.id,
          documentType: "cnpj",
          document: "11.222.333/0001-81",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(ConflictError);
    });

    test("deve permitir manter o mesmo documento", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        document: "811.058.504-39",
        name: "Updated Name",
        updatedBy: ownerUser,
      });

      expect(result.document).toBe(existingOwner.document);
      expect(result.name).toBe("Updated Name");
    });
  });

  describe("Validação de Documento Inválido", () => {
    test("deve lançar erro quando CPF é inválido", async () => {
      await expect(
        useCase.execute({
          id: existingOwner.id,
          document: "111.111.111-11",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(BadRequestError);

      await expect(
        useCase.execute({
          id: existingOwner.id,
          document: "111.111.111-11",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow("CPF inválido");
    });

    test("deve lançar erro quando CNPJ é inválido", async () => {
      await expect(
        useCase.execute({
          id: existingOwner.id,
          documentType: "cnpj",
          document: "11.111.111/1111-11",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(BadRequestError);

      await expect(
        useCase.execute({
          id: existingOwner.id,
          documentType: "cnpj",
          document: "11.111.111/1111-11",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow("CNPJ inválido");
    });
  });

  describe("Validação de Email Inválido", () => {
    test("deve lançar erro quando email é inválido", async () => {
      await expect(
        useCase.execute({
          id: existingOwner.id,
          email: "invalid-email",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow(BadRequestError);

      await expect(
        useCase.execute({
          id: existingOwner.id,
          email: "invalid-email",
          updatedBy: ownerUser,
        }),
      ).rejects.toThrow("E-mail inválido");
    });

    test("deve aceitar email vazio e converter para null", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        email: "",
        updatedBy: ownerUser,
      });

      expect(result.email).toBeNull();
    });

    test("deve aceitar null para email", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        email: null,
        updatedBy: ownerUser,
      });

      expect(result.email).toBeNull();
    });
  });

  describe("Permissões por Role", () => {
    test("OWNER pode editar qualquer proprietário da empresa", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        name: "Updated by Owner",
        updatedBy: ownerUser,
      });

      expect(result.name).toBe("Updated by Owner");
    });

    test("BROKER só pode editar proprietários que criou", async () => {
      // Create owner created by broker
      const ownerCreatedByBroker = await propertyOwnerRepository.create({
        name: "Broker's Owner",
        documentType: "cpf",
        document: "78864706720",
        companyId: company.id,
        createdBy: brokerUser.id,
      });

      // Broker can edit own owner
      const result = await useCase.execute({
        id: ownerCreatedByBroker.id,
        name: "Updated by Broker",
        updatedBy: brokerUser,
      });

      expect(result.name).toBe("Updated by Broker");
    });

    test("BROKER não pode editar proprietários criados por outros", async () => {
      await expect(
        useCase.execute({
          id: existingOwner.id,
          name: "Trying to update",
          updatedBy: brokerUser,
        }),
      ).rejects.toThrow(ForbiddenError);

      await expect(
        useCase.execute({
          id: existingOwner.id,
          name: "Trying to update",
          updatedBy: brokerUser,
        }),
      ).rejects.toThrow("Você só pode editar proprietários que você cadastrou.");
    });

    test("MANAGER pode editar qualquer proprietário da empresa", async () => {
      const managerUser = await userRepository.create({
        email: "manager@test.com",
        password: await PasswordUtils.hash("Test@123"),
        name: "Manager User",
        role: USER_ROLES.MANAGER,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const result = await useCase.execute({
        id: existingOwner.id,
        name: "Updated by Manager",
        updatedBy: managerUser,
      });

      expect(result.name).toBe("Updated by Manager");
    });

    test("ADMIN pode editar qualquer proprietário da empresa", async () => {
      const adminUser = await userRepository.create({
        email: "admin@test.com",
        password: await PasswordUtils.hash("Test@123"),
        name: "Admin User",
        role: USER_ROLES.ADMIN,
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const result = await useCase.execute({
        id: existingOwner.id,
        name: "Updated by Admin",
        updatedBy: adminUser,
      });

      expect(result.name).toBe("Updated by Admin");
    });
  });

  describe("Isolamento por Empresa", () => {
    test("não pode editar proprietário de outra empresa", async () => {
      // Create another company
      const anotherOwner = await userRepository.create({
        email: "another@test.com",
        password: await PasswordUtils.hash("Test@123"),
        name: "Another Owner",
        role: USER_ROLES.OWNER,
        isActive: true,
        isEmailVerified: true,
      });

      const anotherCompany = await companyRepository.create({
        name: "Another Company",
        ownerId: anotherOwner.id,
        email: "another@test.com",
      });

      await userRepository.update(anotherOwner.id, {
        companyId: anotherCompany.id,
      });

      await expect(
        useCase.execute({
          id: existingOwner.id,
          name: "Trying to update",
          updatedBy: (await userRepository.findById(anotherOwner.id)) as User,
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Normalização de Dados", () => {
    test("deve normalizar CPF removendo pontuação", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        document: "788.647.067-20",
        updatedBy: ownerUser,
      });

      expect(result.document).toBe("78864706720");
    });

    test("deve normalizar CNPJ removendo pontuação", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        documentType: "cnpj",
        document: "11.222.333/0001-81",
        updatedBy: ownerUser,
      });

      expect(result.document).toBe("11222333000181");
    });

    test("deve normalizar email para lowercase", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        email: "TEST@EXAMPLE.COM",
        updatedBy: ownerUser,
      });

      expect(result.email).toBe("test@example.com");
    });

    test("deve normalizar telefone removendo pontuação", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        phone: "(11) 98888-8888",
        updatedBy: ownerUser,
      });

      expect(result.phone).toBe("11988888888");
    });

    test("deve normalizar CEP removendo pontuação", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        zipCode: "12345-678",
        updatedBy: ownerUser,
      });

      expect(result.zipCode).toBe("12345678");
    });

    test("deve normalizar estado para uppercase", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        state: "rj",
        updatedBy: ownerUser,
      });

      expect(result.state).toBe("RJ");
    });
  });

  describe("Conversão de Campos para Null", () => {
    test("deve converter string vazia em null para address", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        address: "   ",
        updatedBy: ownerUser,
      });

      expect(result.address).toBeNull();
    });

    test("deve converter string vazia em null para city", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        city: "   ",
        updatedBy: ownerUser,
      });

      expect(result.city).toBeNull();
    });

    test("deve converter string vazia em null para state", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        state: "   ",
        updatedBy: ownerUser,
      });

      expect(result.state).toBeNull();
    });

    test("deve aceitar null para zipCode", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        zipCode: null,
        updatedBy: ownerUser,
      });

      expect(result.zipCode).toBeNull();
    });

    test("deve aceitar null para phone", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        phone: null,
        updatedBy: ownerUser,
      });

      expect(result.phone).toBeNull();
    });

    test("deve converter string vazia em null para notes", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        notes: "   ",
        updatedBy: ownerUser,
      });

      expect(result.notes).toBeNull();
    });

    test("deve converter string vazia em null para birthDate", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        birthDate: "",
        updatedBy: ownerUser,
      });

      expect(result.birthDate).toBeNull();
    });
  });

  describe("Atualização sem Mudanças", () => {
    test("deve retornar proprietário inalterado quando não há dados para atualizar", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        updatedBy: ownerUser,
      });

      expect(result.id).toBe(existingOwner.id);
      expect(result.name).toBe(existingOwner.name);
      expect(result.document).toBe(existingOwner.document);
      expect(result.email).toBe(existingOwner.email);
    });
  });

  describe("Trim em Campos de Texto", () => {
    test("deve fazer trim em name", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        name: "  Trimmed Name  ",
        updatedBy: ownerUser,
      });

      expect(result.name).toBe("Trimmed Name");
    });

    test("deve fazer trim em address", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        address: "  Trimmed Address  ",
        updatedBy: ownerUser,
      });

      expect(result.address).toBe("Trimmed Address");
    });

    test("deve fazer trim em city", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        city: "  Trimmed City  ",
        updatedBy: ownerUser,
      });

      expect(result.city).toBe("Trimmed City");
    });

    test("deve fazer trim em notes", async () => {
      const result = await useCase.execute({
        id: existingOwner.id,
        notes: "  Trimmed Notes  ",
        updatedBy: ownerUser,
      });

      expect(result.notes).toBe("Trimmed Notes");
    });
  });
});
