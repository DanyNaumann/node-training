import { defineConfig } from "drizzle-kit";

// Configuration drizzle-kit : où trouver le schéma et où écrire les migrations.
// La DB est la même que Better Auth (SQLite) ; on lit le chemin depuis l'env.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DB_FILE || "auth.sqlite",
  },
});
