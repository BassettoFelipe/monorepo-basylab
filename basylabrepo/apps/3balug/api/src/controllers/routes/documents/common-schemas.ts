import { t } from "elysia";

export const documentTypeSchema = t.Union([
  t.Literal("rg"),
  t.Literal("cpf"),
  t.Literal("cnpj"),
  t.Literal("comprovante_residencia"),
  t.Literal("comprovante_renda"),
  t.Literal("contrato_social"),
  t.Literal("procuracao"),
  t.Literal("contrato_locacao"),
  t.Literal("termo_vistoria"),
  t.Literal("laudo_avaliacao"),
  t.Literal("outros"),
]);

export const entityTypeSchema = t.Union([
  t.Literal("property_owner"),
  t.Literal("tenant"),
  t.Literal("contract"),
]);

export const documentResponseSchema = t.Object({
  id: t.String(),
  entityType: t.String(),
  entityId: t.String(),
  documentType: t.String(),
  filename: t.String(),
  originalName: t.String(),
  mimeType: t.String(),
  size: t.Number(),
  url: t.String(),
  description: t.Nullable(t.String()),
  createdAt: t.Date(),
});
