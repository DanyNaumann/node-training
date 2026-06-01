import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, lte, desc, sql } from "drizzle-orm";
import { recipes, type Recipe, type NewRecipe } from "./schema.js";

// Instance SQLite unique et partagée (Better Auth + recettes).
// Chemin configurable via DB_FILE (tests) ; défaut auth.sqlite à la racine.
export const sqlite = new Database(process.env.DB_FILE || "auth.sqlite");

// Instance Drizzle typée, bâtie sur la connexion better-sqlite3.
export const db = drizzle(sqlite, { schema: { recipes } });

// --- Repository recettes ---
// Couche d'accès aux données : le reste de l'app ne connaît que ces fonctions,
// jamais le SQL ni Drizzle directement (séparation des responsabilités).

export type ListOptions = {
  maxDuration?: number;
  limit: number;
  offset: number;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
};

export async function listRecipes(opts: ListOptions): Promise<Paginated<Recipe>> {
  const where = opts.maxDuration !== undefined ? lte(recipes.duration, opts.maxDuration) : undefined;

  const data = db
    .select()
    .from(recipes)
    .where(where)
    .orderBy(desc(recipes.createdAt))
    .limit(opts.limit)
    .offset(opts.offset)
    .all();

  const [{ count }] = db
    .select({ count: sql<number>`count(*)` })
    .from(recipes)
    .where(where)
    .all();

  return { data, total: Number(count), limit: opts.limit, offset: opts.offset };
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  return db.select().from(recipes).where(eq(recipes.id, id)).get();
}

export async function createRecipe(input: NewRecipe): Promise<Recipe> {
  return db.insert(recipes).values(input).returning().get();
}

// Merge partiel : seuls les champs fournis sont écrits.
export async function updateRecipe(
  id: string,
  patch: Partial<Pick<Recipe, "name" | "ingredients" | "duration">>,
): Promise<Recipe | undefined> {
  if (Object.keys(patch).length === 0) return getRecipe(id);
  return db.update(recipes).set(patch).where(eq(recipes.id, id)).returning().get();
}

// Renvoie true si une ligne a été supprimée, false si l'id n'existait pas.
export async function deleteRecipe(id: string): Promise<boolean> {
  const res = db.delete(recipes).where(eq(recipes.id, id)).run();
  return res.changes > 0;
}
