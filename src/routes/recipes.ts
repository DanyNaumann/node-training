import { Router, type Request, type Response } from "express";
import { listRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe } from "../db.js";
import { sessionMiddleware } from "../middleware/session.js";
import { requirePermission } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  CreateRecipeSchema,
  UpdateRecipeSchema,
  ListRecipesQuerySchema,
  IdParamSchema,
  type CreateRecipeInput,
  type UpdateRecipeInput,
  type ListRecipesQuery,
} from "../schemas.js";

export const recipesRouter = Router();

// Toutes les routes recettes exigent une session valide.
recipesRouter.use(sessionMiddleware);

// GET /api/v1/recipes -> liste paginée + filtre ?maxDuration=N
recipesRouter.get(
  "/",
  requirePermission("recipe", "read"),
  validate({ query: ListRecipesQuerySchema }),
  async (req: Request, res: Response) => {
    const { maxDuration, limit, offset } = req.validatedQuery as ListRecipesQuery;
    const result = await listRecipes({ maxDuration, limit, offset });
    res.json(result);
  },
);

// GET /api/v1/recipes/:id -> 404 si absente
recipesRouter.get(
  "/:id",
  requirePermission("recipe", "read"),
  validate({ params: IdParamSchema }),
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const recipe = await getRecipe(id);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
  },
);

// POST /api/v1/recipes -> création (validation Zod)
recipesRouter.post(
  "/",
  requirePermission("recipe", "create"),
  validate({ body: CreateRecipeSchema }),
  async (req: Request, res: Response) => {
    const body = req.body as CreateRecipeInput;
    const recipe = await createRecipe({
      name: body.name,
      ingredients: body.ingredients,
      duration: body.duration,
      createdBy: req.user!.id as string, // côté serveur, jamais depuis le client
    });
    res.status(201).json(recipe);
  },
);

// PUT /api/v1/recipes/:id -> merge partiel
recipesRouter.put(
  "/:id",
  requirePermission("recipe", "update"),
  validate({ params: IdParamSchema, body: UpdateRecipeSchema }),
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const existing = await getRecipe(id);
    if (!existing) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    const updated = await updateRecipe(id, req.body as UpdateRecipeInput);
    res.json(updated);
  },
);

// DELETE /api/v1/recipes/:id -> 204 sans body
recipesRouter.delete(
  "/:id",
  requirePermission("recipe", "delete"),
  validate({ params: IdParamSchema }),
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const deleted = await deleteRecipe(id);
    if (!deleted) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.status(204).end();
  },
);
