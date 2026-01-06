import { beforeEach, describe, expect, test } from "bun:test";
import { BadRequestError, ForbiddenError } from "@basylab/core/errors";
import type { Company } from "@/db/schema/companies";
import type { CustomField } from "@/db/schema/custom-fields";
import { FIELD_TYPES } from "@/db/schema/custom-fields";
import type { User } from "@/db/schema/users";
import {
  InMemoryCompanyRepository,
  InMemoryCustomFieldRepository,
  InMemoryUserRepository,
} from "@/test/mock-repository";
import { USER_ROLES } from "@/types/roles";
import { ReorderCustomFieldsUseCase } from "./reorder-custom-fields.use-case";

describe("ReorderCustomFieldsUseCase", () => {
  let useCase: ReorderCustomFieldsUseCase;
  let customFieldRepository: InMemoryCustomFieldRepository;
  let userRepository: InMemoryUserRepository;
  let companyRepository: InMemoryCompanyRepository;

  let ownerUser: User;
  let managerUser: User;
  let company: Company;
  let field1: CustomField;
  let field2: CustomField;
  let field3: CustomField;

  beforeEach(async () => {
    // Setup repositories
    customFieldRepository = new InMemoryCustomFieldRepository();
    userRepository = new InMemoryUserRepository();
    companyRepository = new InMemoryCompanyRepository();

    useCase = new ReorderCustomFieldsUseCase(customFieldRepository);

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

    // Create three custom fields
    field1 = await customFieldRepository.create({
      companyId: company.id,
      label: "Campo 1",
      type: FIELD_TYPES.TEXT,
      order: 0,
      isActive: true,
    });

    field2 = await customFieldRepository.create({
      companyId: company.id,
      label: "Campo 2",
      type: FIELD_TYPES.TEXT,
      order: 1,
      isActive: true,
    });

    field3 = await customFieldRepository.create({
      companyId: company.id,
      label: "Campo 3",
      type: FIELD_TYPES.TEXT,
      order: 2,
      isActive: true,
    });
  });

  describe("Casos de Sucesso", () => {
    test("deve reordenar campos com sucesso", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldIds: [field3.id, field1.id, field2.id],
      });

      expect(result.success).toBe(true);

      // Verificar a nova ordem
      const updatedField1 = await customFieldRepository.findById(field1.id);
      const updatedField2 = await customFieldRepository.findById(field2.id);
      const updatedField3 = await customFieldRepository.findById(field3.id);

      expect(updatedField3?.order).toBe(0); // field3 agora é o primeiro
      expect(updatedField1?.order).toBe(1); // field1 agora é o segundo
      expect(updatedField2?.order).toBe(2); // field2 agora é o terceiro
    });

    test("deve inverter a ordem dos campos", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldIds: [field3.id, field2.id, field1.id],
      });

      expect(result.success).toBe(true);

      const updatedField1 = await customFieldRepository.findById(field1.id);
      const updatedField2 = await customFieldRepository.findById(field2.id);
      const updatedField3 = await customFieldRepository.findById(field3.id);

      expect(updatedField3?.order).toBe(0);
      expect(updatedField2?.order).toBe(1);
      expect(updatedField1?.order).toBe(2);
    });

    test("deve manter a mesma ordem quando enviado na ordem atual", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldIds: [field1.id, field2.id, field3.id],
      });

      expect(result.success).toBe(true);

      const updatedField1 = await customFieldRepository.findById(field1.id);
      const updatedField2 = await customFieldRepository.findById(field2.id);
      const updatedField3 = await customFieldRepository.findById(field3.id);

      expect(updatedField1?.order).toBe(0);
      expect(updatedField2?.order).toBe(1);
      expect(updatedField3?.order).toBe(2);
    });

    test("deve reordenar apenas os campos fornecidos", async () => {
      // Criar um 4º campo
      const field4 = await customFieldRepository.create({
        companyId: company.id,
        label: "Campo 4",
        type: FIELD_TYPES.TEXT,
        order: 3,
        isActive: true,
      });

      // Reordenar apenas 2 campos
      await useCase.execute({
        user: ownerUser,
        fieldIds: [field2.id, field1.id],
      });

      const updatedField1 = await customFieldRepository.findById(field1.id);
      const updatedField2 = await customFieldRepository.findById(field2.id);
      const updatedField3 = await customFieldRepository.findById(field3.id);
      const updatedField4 = await customFieldRepository.findById(field4.id);

      // Os dois primeiros foram reordenados
      expect(updatedField2?.order).toBe(0);
      expect(updatedField1?.order).toBe(1);

      // Os outros mantiveram a ordem original
      expect(updatedField3?.order).toBe(2);
      expect(updatedField4?.order).toBe(3);
    });

    test("deve ignorar IDs inválidos e reordenar apenas os válidos", async () => {
      const result = await useCase.execute({
        user: ownerUser,
        fieldIds: ["invalid-id-1", field2.id, "invalid-id-2", field1.id, field3.id],
      });

      expect(result.success).toBe(true);

      // Apenas os campos válidos foram reordenados
      const updatedField1 = await customFieldRepository.findById(field1.id);
      const updatedField2 = await customFieldRepository.findById(field2.id);
      const updatedField3 = await customFieldRepository.findById(field3.id);

      expect(updatedField2?.order).toBe(0);
      expect(updatedField1?.order).toBe(1);
      expect(updatedField3?.order).toBe(2);
    });
  });

  describe("Validações de Erro", () => {
    test("deve lançar erro se o usuário não for OWNER", async () => {
      await expect(
        useCase.execute({
          user: managerUser,
          fieldIds: [field1.id, field2.id],
        }),
      ).rejects.toThrow(
        new ForbiddenError("Apenas o proprietário pode reordenar campos personalizados."),
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
          fieldIds: [field1.id, field2.id],
        }),
      ).rejects.toThrow(new BadRequestError("Usuário sem empresa vinculada."));
    });

    test("deve lançar erro se não há campos fornecidos", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldIds: [],
        }),
      ).rejects.toThrow(new BadRequestError("Nenhum campo fornecido para reordenação."));
    });

    test("deve lançar erro se todos os IDs fornecidos são inválidos", async () => {
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldIds: ["invalid-id-1", "invalid-id-2", "invalid-id-3"],
        }),
      ).rejects.toThrow(new BadRequestError("Nenhum campo válido fornecido para reordenação."));
    });

    test("deve lançar erro se tentar reordenar campos de outra empresa", async () => {
      // Create another company with fields
      const company2 = await companyRepository.create({
        name: "Imobiliária 2",
        cnpj: "98765432109876",
      });

      const fieldFromOtherCompany = await customFieldRepository.create({
        companyId: company2.id,
        label: "Campo Empresa 2",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      // Owner 1 tenta reordenar apenas campos da empresa 2
      await expect(
        useCase.execute({
          user: ownerUser,
          fieldIds: [fieldFromOtherCompany.id],
        }),
      ).rejects.toThrow(new BadRequestError("Nenhum campo válido fornecido para reordenação."));
    });
  });

  describe("Isolamento e Integridade", () => {
    test("deve garantir isolamento entre empresas na reordenação", async () => {
      // Create another company
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

      const field2_1 = await customFieldRepository.create({
        companyId: company2.id,
        label: "Campo 2-1",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      const field2_2 = await customFieldRepository.create({
        companyId: company2.id,
        label: "Campo 2-2",
        type: FIELD_TYPES.TEXT,
        order: 1,
        isActive: true,
      });

      // Owner 1 reordena seus campos
      await useCase.execute({
        user: ownerUser,
        fieldIds: [field3.id, field1.id, field2.id],
      });

      // Owner 2 reordena seus campos
      await useCase.execute({
        user: owner2,
        fieldIds: [field2_2.id, field2_1.id],
      });

      // Verificar que as ordens estão corretas e isoladas
      const updated1_1 = await customFieldRepository.findById(field1.id);
      const updated1_3 = await customFieldRepository.findById(field3.id);
      const updated2_1 = await customFieldRepository.findById(field2_1.id);
      const updated2_2 = await customFieldRepository.findById(field2_2.id);

      // Empresa 1
      expect(updated1_3?.order).toBe(0);
      expect(updated1_1?.order).toBe(1);

      // Empresa 2
      expect(updated2_2?.order).toBe(0);
      expect(updated2_1?.order).toBe(1);
    });

    test("deve filtrar automaticamente campos de outras empresas em lista mista", async () => {
      // Create another company
      const company2 = await companyRepository.create({
        name: "Imobiliária 2",
        cnpj: "98765432109876",
      });

      const fieldFromOtherCompany = await customFieldRepository.create({
        companyId: company2.id,
        label: "Campo Empresa 2",
        type: FIELD_TYPES.TEXT,
        order: 0,
        isActive: true,
      });

      // Owner 1 tenta reordenar misturando campos de ambas empresas
      const result = await useCase.execute({
        user: ownerUser,
        fieldIds: [
          field2.id,
          fieldFromOtherCompany.id, // Este será ignorado
          field1.id,
          field3.id,
        ],
      });

      expect(result.success).toBe(true);

      // Apenas campos da empresa 1 foram reordenados
      const updated1 = await customFieldRepository.findById(field1.id);
      const updated2 = await customFieldRepository.findById(field2.id);
      const updated3 = await customFieldRepository.findById(field3.id);
      const updatedOther = await customFieldRepository.findById(fieldFromOtherCompany.id);

      expect(updated2?.order).toBe(0);
      expect(updated1?.order).toBe(1);
      expect(updated3?.order).toBe(2);

      // Campo da outra empresa mantém ordem original
      expect(updatedOther?.order).toBe(0);
    });
  });
});
