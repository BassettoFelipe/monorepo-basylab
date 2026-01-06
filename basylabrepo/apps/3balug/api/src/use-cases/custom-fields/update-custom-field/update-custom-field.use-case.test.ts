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
import { UpdateCustomFieldUseCase } from "./update-custom-field.use-case";

describe("UpdateCustomFieldUseCase", () => {
  let useCase: UpdateCustomFieldUseCase;
  let customFieldRepository: InMemoryCustomFieldRepository;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;

  let ownerUser: User;
  let managerUser: User;
  let company: Company;
  let existingField: CustomField;

  beforeEach(async () => {
    // Setup repositories
    customFieldRepository = new InMemoryCustomFieldRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    useCase = new UpdateCustomFieldUseCase(customFieldRepository);

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

    // Create existing field
    existingField = await customFieldRepository.create({
      companyId: company.id,
      label: "Campo Inicial",
      type: FIELD_TYPES.TEXT,
      placeholder: "Placeholder inicial",
      helpText: "Help inicial",
      isRequired: false,
      order: 0,
      isActive: true,
    });
  });

  describe("Casos de Sucesso", () => {
    test("deve atualizar o label de um campo", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldId: existingField.id,
        label: "Campo Atualizado",
      });

      expect(result.label).toBe("Campo Atualizado");
      expect(result.type).toBe(FIELD_TYPES.TEXT);
      expect(result.placeholder).toBe("Placeholder inicial");
    });

    test("deve atualizar placeholder e helpText", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldId: existingField.id,
        placeholder: "Novo placeholder",
        helpText: "Novo help text",
      });

      expect(result.placeholder).toBe("Novo placeholder");
      expect(result.helpText).toBe("Novo help text");
    });

    test("deve atualizar isRequired", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldId: existingField.id,
        isRequired: true,
      });

      expect(result.isRequired).toBe(true);
    });

    test("deve atualizar isActive para desativar campo", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldId: existingField.id,
        isActive: false,
      });

      expect(result.isActive).toBe(false);
    });

    test("deve converter campo TEXT para SELECT com opções", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldId: existingField.id,
        type: FIELD_TYPES.SELECT,
        options: ["Opção 1", "Opção 2", "Opção 3"],
        allowMultiple: true,
      });

      expect(result.type).toBe(FIELD_TYPES.SELECT);
      expect(result.options).toEqual(["Opção 1", "Opção 2", "Opção 3"]);
      expect(result.allowMultiple).toBe(true);
    });

    test("deve converter campo TEXT para FILE com configuração", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldId: existingField.id,
        type: FIELD_TYPES.FILE,
        fileConfig: {
          maxFileSize: 10,
          maxFiles: 3,
          allowedTypes: ["image/*", "application/pdf"],
        },
      });

      expect(result.type).toBe(FIELD_TYPES.FILE);
      expect(result.fileConfig).toEqual({
        maxFileSize: 10,
        maxFiles: 3,
        allowedTypes: ["image/*", "application/pdf"],
      });
    });

    test("deve atualizar apenas opções de um campo SELECT existente", async () => {
      const selectField = await customFieldRepository.create({
        companyId: company.id,
        label: "Estado Civil",
        type: FIELD_TYPES.SELECT,
        options: ["Solteiro", "Casado"],
        allowMultiple: false,
        order: 1,
        isActive: true,
      });

      const result = await useCase.execute({
        user: ownerUser,
        fieldId: selectField.id,
        options: ["Solteiro", "Casado", "Divorciado", "Viúvo"],
      });

      expect(result.options).toEqual(["Solteiro", "Casado", "Divorciado", "Viúvo"]);
      expect(result.type).toBe(FIELD_TYPES.SELECT);
    });

    test("deve atualizar validation de um campo NUMBER", async () => {
      const numberField = await customFieldRepository.create({
        companyId: company.id,
        label: "Idade",
        type: FIELD_TYPES.NUMBER,
        order: 1,
        isActive: true,
      });

      const result = await useCase.execute({
        user: ownerUser,
        fieldId: numberField.id,
        validation: { min: 18, max: 100 },
      });

      expect(result.validation).toEqual({ min: 18, max: 100 });
    });

    test("deve fazer trim do label, placeholder e helpText", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldId: existingField.id,
        label: "  Label com espaços  ",
        placeholder: "  Placeholder com espaços  ",
        helpText: "  Help com espaços  ",
      });

      expect(result.label).toBe("Label com espaços");
      expect(result.placeholder).toBe("Placeholder com espaços");
      expect(result.helpText).toBe("Help com espaços");
    });

    test("deve permitir definir placeholder como null enviando string vazia", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldId: existingField.id,
        placeholder: "",
        helpText: "",
      });

      expect(result.placeholder).toBeNull();
      expect(result.helpText).toBeNull();
    });
  });

  describe("Validações de Erro", () => {
    test("deve lançar erro se o usuário não for OWNER", async () => {
      await expect(
        useCase.execute({
          user: managerUser,
          fieldId: existingField.id,
          label: "Novo Label",
        }),
      ).rejects.toThrow(
        new ForbiddenError("Apenas o proprietário pode editar campos personalizados."),
      );
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
          label: "Novo Label",
        }),
      ).rejects.toThrow(new BadRequestError("Usuário sem empresa vinculada."));
    });

    test("deve lançar erro se o campo não existe", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: "non-existent-id",
          label: "Novo Label",
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
          label: "Tentando Alterar",
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para editar este campo."));
    });

    test("deve lançar erro para tipo de campo inválido", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: existingField.id,
          type: "invalid_type" as any,
        }),
      ).rejects.toThrow(
        new BadRequestError(
          `Tipo de campo inválido. Tipos válidos: ${Object.values(FIELD_TYPES).join(", ")}`,
        ),
      );
    });

    test("deve lançar erro ao converter para SELECT sem opções suficientes", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: existingField.id,
          type: FIELD_TYPES.SELECT,
          options: ["Única opção"],
        }),
      ).rejects.toThrow(
        new BadRequestError("Campos do tipo seleção devem ter pelo menos 2 opções."),
      );

      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: existingField.id,
          type: FIELD_TYPES.SELECT,
          options: [],
        }),
      ).rejects.toThrow(
        new BadRequestError("Campos do tipo seleção devem ter pelo menos 2 opções."),
      );
    });

    test("deve lançar erro ao atualizar campo SELECT mantendo menos de 2 opções", async () => {
      const selectField = await customFieldRepository.create({
        companyId: company.id,
        label: "Estado Civil",
        type: FIELD_TYPES.SELECT,
        options: ["Solteiro", "Casado"],
        order: 1,
        isActive: true,
      });

      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: selectField.id,
          options: ["Única"],
        }),
      ).rejects.toThrow(
        new BadRequestError("Campos do tipo seleção devem ter pelo menos 2 opções."),
      );
    });

    test("deve lançar erro se campo SELECT tem opções duplicadas (case insensitive)", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: existingField.id,
          type: FIELD_TYPES.SELECT,
          options: ["Opção 1", "opção 1", "Opção 2"],
        }),
      ).rejects.toThrow(new BadRequestError("Não é permitido ter opções duplicadas."));
    });

    test("deve lançar erro se maxFileSize está fora do limite (1-10 MB)", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: existingField.id,
          type: FIELD_TYPES.FILE,
          fileConfig: {
            maxFileSize: 0,
            allowedTypes: ["image/*"],
          },
        }),
      ).rejects.toThrow(
        new BadRequestError("O tamanho máximo do arquivo deve ser entre 1 e 10 MB."),
      );

      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: existingField.id,
          type: FIELD_TYPES.FILE,
          fileConfig: {
            maxFileSize: 11,
            allowedTypes: ["image/*"],
          },
        }),
      ).rejects.toThrow(
        new BadRequestError("O tamanho máximo do arquivo deve ser entre 1 e 10 MB."),
      );
    });

    test("deve lançar erro se maxFiles está fora do limite (1-5)", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: existingField.id,
          type: FIELD_TYPES.FILE,
          fileConfig: {
            maxFiles: 0,
            allowedTypes: ["image/*"],
          },
        }),
      ).rejects.toThrow(
        new BadRequestError("A quantidade máxima de arquivos deve ser entre 1 e 5."),
      );

      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: existingField.id,
          type: FIELD_TYPES.FILE,
          fileConfig: {
            maxFiles: 6,
            allowedTypes: ["image/*"],
          },
        }),
      ).rejects.toThrow(
        new BadRequestError("A quantidade máxima de arquivos deve ser entre 1 e 5."),
      );
    });

    test("deve lançar erro se campo FILE não tem tipos permitidos", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: existingField.id,
          type: FIELD_TYPES.FILE,
          fileConfig: {
            allowedTypes: [],
          },
        }),
      ).rejects.toThrow(new BadRequestError("Selecione pelo menos um tipo de arquivo permitido."));
    });

    test("deve lançar erro se label tem menos de 2 caracteres", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: existingField.id,
          label: "A",
        }),
      ).rejects.toThrow(new BadRequestError("O nome do campo deve ter pelo menos 2 caracteres."));

      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: existingField.id,
          label: "   ",
        }),
      ).rejects.toThrow(new BadRequestError("O nome do campo deve ter pelo menos 2 caracteres."));
    });
  });

  describe("Isolamento e Integridade", () => {
    test("deve garantir que campos de empresas diferentes não podem ser editados", async () => {
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

      const field2 = await customFieldRepository.create({
        companyId: company2.id,
        label: "Campo Empresa 2",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      // Owner 1 tenta editar campo da empresa 2
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldId: field2.id,
          label: "Tentando Alterar",
        }),
      ).rejects.toThrow(new ForbiddenError("Você não tem permissão para editar este campo."));

      // Owner 2 consegue editar seu próprio campo
      const result = await useCase.execute({
        user: owner2,
        fieldId: field2.id,
        label: "Campo Editado",
      });

      expect(result.label).toBe("Campo Editado");
      expect(result.companyId).toBe(company2.id);
    });
  });
});
