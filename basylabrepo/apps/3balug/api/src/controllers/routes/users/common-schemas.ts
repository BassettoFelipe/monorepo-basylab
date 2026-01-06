import { Type } from "@sinclair/typebox";

export const UserResponseSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  email: Type.String({ format: "email" }),
  name: Type.String(),
  role: Type.String(),
  phone: Type.Union([Type.String(), Type.Null()]),
  isActive: Type.Boolean(),
  isEmailVerified: Type.Boolean(),
  hasPendingCustomFields: Type.Boolean(),
  createdAt: Type.String({ format: "date-time" }), // Frontend exibe "Data de Cadastro"
});
