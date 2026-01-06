import { beforeEach, describe, expect, test } from "bun:test";
import type { Company } from "@/db/schema/companies";
import type { CustomField } from "@/db/schema/custom-fields";
import { FIELD_TYPES } from "@/db/schema/custom-fields";
import type { User } from "@/db/schema/users";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/errors";
import {
  InMemoryCompanyRepository,
  InMemoryCustomFieldRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { DeleteCustomFieldUseCase } from "./delete-custom-field.use-case";

describe("DeleteCustomFieldUseCase", () => {
  let useCase: DeleteCustomFieldUseCase;
  let customFieldRepository: InMemoryCustomFieldRepository;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;

  let ownerUser: User;
  let managerUser: User;
  let brokerUser: User;
  let company: Company;
  let existingField: CustomField;

  beforeEach(async () => {
    // Setup repositories
    customFieldRepository = new InMemoryCustomFieldRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    useCase = new DeleteCustomFieldUseCase(customFieldRepository);

    // Create company
    company = await companyRepository.create({
      name: "Imobiliária Teste",
      cnpj: "12345678901234",
    });

    // Create owner user
    ownerUser = await userRepository.create({
      name: "Owner User",
      email: "owner@test.com",
      password: "hashed_password",
      role: USER_ROLES.OWNER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    // Create manager user
    managerUser = await userRepository.create({
      name: "Manager User",
      email: "manager@test.com",
      password: "hashed_password",
      role: USER_ROLES.MANAGER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    // Create broker user
    brokerUser = await userRepository.create({
      name: "Broker User",
      email: "broker@test.com",
      password: "hashed_password",
      role: USER_ROLES.BROKER,
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    // Create existing field
    existingField = await customFieldRepository.create({
      companyId: company.id,
      label: "Campo para Deletar",
      type: FIELD_TYPES.TEXT,
      order: 0,
      isActive: true,
    });
  });

  describe("Casos de Sucesso", () => {
    test("deve excluir um campo customizado com sucesso", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldId: existingField.id,
      });

      expect(result.success).toBe(true);

      // Verificar que o campo foi realmente excluído
      const deletedField = await customFieldRepository.findById(existingField.id);
      expect(deletedField).toBeNull();
    });

    test("deve excluir campo do tipo SELECT", async () => {
      const selectField = await customFieldRepository.create({
        companyId: company.id,
        label: "Estado Civil",
        type: FIELD_TYPES.SELECT,
        options: ["Solteiro", "Casado"],
        order: 1,
        isActive: true,
      });

      const result = await useCase.execute({
        user: ownerUser,
        fieldId: selectField.id,
      });

      expect(result.success).toBe(true);

      const deletedField = await customFieldRepository.findById(selectField.id);
      expect(deletedField).toBeNull();
    });

    test("deve excluir campo do tipo FILE", async () => {
      const fileField = await customFieldRepository.create({
        companyId: company.id,
        label: "Documento",
        type: FIELD_TYPES.FILE,
        fileConfig: {
          maxFileSize: 5,
          maxFiles: 1,
          allowedTypes: ["image/*"],
        },
        order: 1,
        isActive: true,
      });

      const result = await useCase.execute({
        user: ownerUser,
        fieldId: fileField.id,
      });

      expect(result.success).toBe(true);

      const deletedField = await customFieldRepository.findById(fileField.id);
      expect(deletedField).toBeNull();
    });

    test("deve excluir campo inativo", async () => {
      const inactiveField = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo Inativo",
        type: FIELD_TYPES.TEXT,
        order: 1,
        isActive: false,
      });

      const result = await useCase.execute({
        user: ownerUser,
        fieldId: inactiveField.id,
      });

      expect(result.success).toBe(true);

      const deletedField = await customFieldRepository.findById(inactiveField.id);
      expect(deletedField).toBeNull();
    });

    test("deve permitir excluir múltiplos campos sequencialmente", async () => {
      const field1 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 1",
        type: FIELD_TYPES.TEXT,
        order: 1,
        isActive: true,
      });

      const field2 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 2",
        type: FIELD_TYPES.TEXT,
        order: 2,
        isActive: true,
      });

      const result1 = await useCase.execute({
        user: ownerUser,
        fieldId: field1.id,
      });

      const result2 = await useCase.execute({
        user: ownerUser,
        fieldId: field2.id,
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      expect(await customFieldRepository.findById(field1.id)).toBeNull();
      expect(await customFieldRepository.findById(field2.id)).toBeNull();
    });
  });

  describe("Validações de Erro", () => {
    test("deve lançar erro se o usuário não for OWNER", async () => {
      await expect(
        useCase.execute({
          user: managerUser,
          fieldId: existingField.id,
        }),
      ).rejects.toThrow(
        new ForbiddenError("Apenas o proprietário pode excluir campos personalizados."),
      );

      await expect(
        useCase.execute({
          user: brokerUser,
          fieldId: existingField.id,
        }),
      ).rejects.toThrow(
        new ForbiddenError("Apenas o proprietário pode excluir campos personalizados."),
      );

      // Verificar que o campo não foi excluído
      const field = await customFieldRepository.findById(existingField.id);
      expect(field).not.toBeNull();
    });

    test("deve lançar erro se o usuário não tem empresa vinculada", async () => {
      const userWithoutCompany = await userRepository.create({
        name: "User Without Company",
        email: "nocompany@test.com",
        password: "password",
        role: USER_ROLES.OWNER,
        companyId: null,
      });

      await expect(
        useCase.execute({
          user: userWithoutCompany,
          fieldId: existingField.id,
        }),
      ).rejects.toThrow(new BadRequestError("Usuário sem empresa vinculada."));

      // Verificar que o campo não foi excluído
      const field = await customFieldRepository.findById(existingField.id);
      expect(field).not.toBeNull();
    });

    test("deve lançar erro se o campo não existe", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: "non-existent-id",
        }),
      ).rejects.toThrow(new NotFoundError("Campo não encontrado."));
    });

    test("deve lançar erro se o campo pertence a outra empresa", async () => {
      const otherCompany = await companyRepository.create({
        name: "Outra Imobiliária",
        cnpj: "98765432109876",
      });

      const fieldFromOtherCompany = await customFieldRepository.create({
        companyId: otherCompany.id,
        label: "Campo de Outra Empresa",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: fieldFromOtherCompany.id,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para excluir este campo."));

      // Verificar que o campo não foi excluído
      const field = await customFieldRepository.findById(fieldFromOtherCompany.id);
      expect(field).not.toBeNull();
    });
  });

  describe("Isolamento e Integridade", () => {
    test("deve garantir isolamento entre empresas", async () => {
      const company2 = await companyRepository.create({
        name: "Imobiliária 2",
        cnpj: "98765432109876",
      });

      const owner2 = await userRepository.create({
        name: "Owner 2",
        email: "owner2@test.com",
        password: "password",
        role: USER_ROLES.OWNER,
        companyId: company2.id,
      });

      const field1 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo Empresa 1",
        type: FIELD_TYPES.TEXT,
        order: 1,
        isActive: true,
      });

      const field2 = await customFieldRepository.create({
        companyId: company2.id,
        label: "Campo Empresa 2",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      // Owner 1 tenta excluir campo da empresa 2
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: field2.id,
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para excluir este campo."));

      // Owner 1 consegue excluir seu próprio campo
      const result1 = await useCase.execute({
        user: ownerUser,
        fieldId: field1.id,
      });

      expect(result1.success).toBe(true);

      // Owner 2 consegue excluir seu próprio campo
      const result2 = await useCase.execute({
        user: owner2,
        fieldId: field2.id,
      });

      expect(result2.success).toBe(true);

      // Verificar que apenas os campos corretos foram excluídos
      expect(await customFieldRepository.findById(field1.id)).toBeNull();
      expect(await customFieldRepository.findById(field2.id)).toBeNull();
    });

    test("deve manter outros campos após exclusão de um campo", async () => {
      const field1 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 1",
        type: FIELD_TYPES.TEXT,
        order: 1,
        isActive: true,
      });

      const field2 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 2",
        type: FIELD_TYPES.TEXT,
        order: 2,
        isActive: true,
      });

      // Excluir apenas field1
      await useCase.execute({
        user: ownerUser,
        fieldId: field1.id,
      });

      // Verificar que field1 foi excluído
      expect(await customFieldRepository.findById(field1.id)).toBeNull();

      // Verificar que field2 ainda existe
      const remainingField = await customFieldRepository.findById(field2.id);
      expect(remainingField).not.toBeNull();
      expect(remainingField?.label).toBe("Campo 2");
    });
  });
});
