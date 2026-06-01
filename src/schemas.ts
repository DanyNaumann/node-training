import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Active la méthode .openapi() sur les schémas Zod (métadonnées pour la doc).
extendZodWithOpenApi(z);

// --- Recettes ---

export const RecipeSchema = z
  .object({
    id: z.string().openapi({ example: "a1b2c3d4-..." }),
    name: z.string().openapi({ example: "Pâtes carbonara" }),
    ingredients: z.array(z.string()).openapi({ example: ["pâtes", "œufs", "lardons"] }),
    duration: z.number().int().positive().openapi({ example: 20 }),
    createdBy: z.string(),
    createdAt: z.date().openapi({ type: "string", format: "date-time" }),
  })
  .openapi("Recipe");

// Création : champs métier requis (id/createdBy/createdAt posés côté serveur).
export const CreateRecipeSchema = z
  .object({
    name: z.string().trim().min(1),
    ingredients: z.array(z.string().trim().min(1)).min(1),
    duration: z.number().int().positive(),
  })
  .strict() // refuse les champs inconnus (ex: createdBy injecté par le client)
  .openapi("CreateRecipe");

// Mise à jour partielle : au moins un champ, aucun champ inconnu.
export const UpdateRecipeSchema = CreateRecipeSchema.partial()
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field is required" })
  .openapi("UpdateRecipe");

// Query de liste : pagination + filtre. coerce car les query params sont des strings.
export const ListRecipesQuerySchema = z
  .object({
    maxDuration: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .openapi("ListRecipesQuery");

// --- Admin ---

export const ROLES = ["user", "editor", "admin"] as const;

export const UpdateRoleSchema = z
  .object({ role: z.enum(ROLES) })
  .strict()
  .openapi("UpdateRole");

export const IdParamSchema = z.object({ id: z.string().min(1) });

// Types inférés (utilisés dans les handlers typés).
export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>;
export type ListRecipesQuery = z.infer<typeof ListRecipesQuerySchema>;
