import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { properties } from "./properties";
import { propertyOwners } from "./property-owners";
import { tenants } from "./tenants";
import { users } from "./users";

export const CONTRACT_STATUS = {
  ACTIVE: "active", // Ativo
  TERMINATED: "terminated", // Encerrado
  CANCELLED: "cancelled", // Cancelado
  EXPIRED: "expired", // Vencido
} as const;

export type ContractStatus = (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];

export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "restrict" }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => propertyOwners.id, { onDelete: "restrict" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    brokerId: uuid("broker_id").references(() => users.id, {
      onDelete: "set null",
    }), // Corretor responsável pelo contrato
    startDate: timestamp("start_date").notNull(), // Data de início
    endDate: timestamp("end_date").notNull(), // Data de término
    rentalAmount: integer("rental_amount").notNull(), // Valor do aluguel em centavos
    paymentDay: integer("payment_day").notNull().default(5), // Dia do vencimento (1-31)
    depositAmount: integer("deposit_amount"), // Valor do depósito/caução em centavos
    status: text("status").notNull().default(CONTRACT_STATUS.ACTIVE), // active, terminated, cancelled, expired
    terminatedAt: timestamp("terminated_at"), // Data de encerramento (se encerrado)
    terminationReason: text("termination_reason"), // Motivo do encerramento
    notes: text("notes"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("contracts_company_id_idx").on(table.companyId),
    index("contracts_property_id_idx").on(table.propertyId),
    index("contracts_owner_id_idx").on(table.ownerId),
    index("contracts_tenant_id_idx").on(table.tenantId),
    index("contracts_broker_id_idx").on(table.brokerId),
    index("contracts_status_idx").on(table.status),
    index("contracts_start_date_idx").on(table.startDate),
    index("contracts_end_date_idx").on(table.endDate),
    index("contracts_company_status_idx").on(table.companyId, table.status),
    index("contracts_company_broker_status_idx").on(table.companyId, table.brokerId, table.status),
    index("contracts_company_status_enddate_idx").on(table.companyId, table.status, table.endDate),
    index("contracts_company_status_created_idx").on(
      table.companyId,
      table.status,
      table.createdAt,
    ),
  ],
);

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
