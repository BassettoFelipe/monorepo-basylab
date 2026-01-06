import { Type } from "@sinclair/typebox";
import { USER_ROLES } from "@/types/roles";

const CustomFieldValueSchema = Type.Object({
  fieldId: Type.String({
    format: "uuid",
    description: "ID do campo customizado",
  }),
  value: Type.String({
    description: "Valor do campo",
  }),
});

export const CreateUserSchema = Type.Object({
  email: Type.String({
    format: "email",
    description: "Email do usuário",
  }),
  name: Type.String({
    minLength: 2,
    maxLength: 100,
    description: "Nome completo do usuário",
  }),
  password: Type.String({
    minLength: 8,
    description: "Senha do usuário",
  }),
  role: Type.Enum(
    {
      broker: USER_ROLES.BROKER,
      manager: USER_ROLES.MANAGER,
      insurance_analyst: USER_ROLES.INSURANCE_ANALYST,
    },
    {
      description: "Função do usuário na empresa",
    },
  ),
  phone: Type.String({
    minLength: 10,
    maxLength: 20,
    description: "Celular do usuário - obrigatório",
  }),
  customFields: Type.Optional(
    Type.Array(CustomFieldValueSchema, {
      description: "Valores dos campos customizados",
    }),
  ),
});
