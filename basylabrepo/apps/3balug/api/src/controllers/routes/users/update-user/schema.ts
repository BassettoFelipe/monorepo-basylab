import { Type } from "@sinclair/typebox";
import { USER_ROLES } from "@/types/roles";

export const UpdateUserSchema = Type.Object({
  name: Type.Optional(
    Type.String({
      minLength: 2,
      maxLength: 100,
    }),
  ),
  email: Type.Optional(
    Type.String({
      format: "email",
    }),
  ),
  role: Type.Optional(
    Type.Enum({
      broker: USER_ROLES.BROKER,
      manager: USER_ROLES.MANAGER,
      insurance_analyst: USER_ROLES.INSURANCE_ANALYST,
    }),
  ),
  phone: Type.Optional(
    Type.String({
      minLength: 10,
      maxLength: 20,
    }),
  ),
  isActive: Type.Optional(Type.Boolean()),
});
