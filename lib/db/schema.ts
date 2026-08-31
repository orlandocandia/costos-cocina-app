import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Tabla de usuarios.
 * La contraseña se guarda hasheada con bcryptjs en `passwordHash`.
 *
 * `isActive` permite al admin desactivar usuarios sin eliminarlos.
 * `isAdmin` marca qué usuarios pueden acceder a /admin.
 * `resetToken` + `resetTokenExpires` soportan el flujo de recuperación
 * de contraseña (/recovery → /reset-password).
 */
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false).notNull(),
  resetToken: text("reset_token"),
  resetTokenExpires: integer("reset_token_expires"),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

/**
 * Lugares de trabajo del usuario, con sus gastos mensuales.
 */
export const workplaces = sqliteTable("workplaces", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  monthlyRent: real("monthly_rent").default(0).notNull(),
  monthlyElectricity: real("monthly_electricity").default(0).notNull(),
  monthlyGas: real("monthly_gas").default(0).notNull(),
  monthlyWater: real("monthly_water").default(0).notNull(),
  monthlyOther: real("monthly_other").default(0).notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

/**
 * Insumos de la despensa del usuario.
 * `unit` solo permite: 'kg' | 'liter' | 'unit' | 'package' | 'can'
 */
export const ingredients = sqliteTable("ingredients", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  unit: text("unit").notNull(),
  costPerUnit: real("cost_per_unit").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Workplace = typeof workplaces.$inferSelect;
export type NewWorkplace = typeof workplaces.$inferInsert;
export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;

/** Unidades permitidas para la columna `ingredients.unit`. */
export type IngredientUnit =
  | "kg"
  | "liter"
  | "unit"
  | "package"
  | "can";
