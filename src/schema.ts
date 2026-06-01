import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Table des recettes. On ne touche PAS aux tables de Better Auth (user,
// session, account, verification) : elles cohabitent dans le même fichier SQLite.
export const recipes = sqliteTable("recipe", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  // SQLite n'a pas de type tableau : on stocke le JSON en colonne text,
  // Drizzle (mode: "json") sérialise/désérialise automatiquement.
  ingredients: text("ingredients", { mode: "json" })
    .notNull()
    .$type<string[]>(),
  duration: integer("duration").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Types inférés depuis le schéma — la source de vérité du modèle.
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
