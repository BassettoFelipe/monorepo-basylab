import { relations } from "drizzle-orm";
import { pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { plans } from "./plans";

/**
 * Tabela de features disponíveis no sistema.
 * Cada feature representa uma funcionalidade que pode ser habilitada/desabilitada por plano.
 */
export const features = pgTable("features", {
  slug: varchar("slug", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Tabela de relacionamento entre planos e features (N:N).
 * Define quais features cada plano possui acesso.
 */
export const planFeatures = pgTable(
  "plan_features",
  {
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    featureSlug: varchar("feature_slug", { length: 50 })
      .notNull()
      .references(() => features.slug, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.planId, table.featureSlug] })],
);

// Relations
export const featuresRelations = relations(features, ({ many }) => ({
  planFeatures: many(planFeatures),
}));

export const planFeaturesRelations = relations(planFeatures, ({ one }) => ({
  plan: one(plans, {
    fields: [planFeatures.planId],
    references: [plans.id],
  }),
  feature: one(features, {
    fields: [planFeatures.featureSlug],
    references: [features.slug],
  }),
}));

export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;
export type PlanFeature = typeof planFeatures.$inferSelect;
export type NewPlanFeature = typeof planFeatures.$inferInsert;
