import { Router, type Request, type Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { sessionMiddleware } from "../middleware/session.js";
import { requirePermission } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { UpdateRoleSchema, IdParamSchema } from "../schemas.js";

export const adminRouter = Router();

// Toutes les routes admin exigent une session valide.
adminRouter.use(sessionMiddleware);

// GET /api/v1/admin/users -> liste tous les comptes
adminRouter.get(
  "/users",
  requirePermission("user", "read"),
  async (req: Request, res: Response) => {
    // On délègue à Better Auth (défense en profondeur : il re-valide l'admin).
    const result = await auth.api.listUsers({
      query: { limit: 1000 },
      headers: fromNodeHeaders(req.headers),
    });
    res.json(result.users);
  },
);

// PATCH /api/v1/admin/users/:id/role -> change le rôle (validation Zod)
adminRouter.patch(
  "/users/:id/role",
  requirePermission("user", "ban"),
  validate({ params: IdParamSchema, body: UpdateRoleSchema }),
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const result = await auth.api.setRole({
      body: { userId: id, role: req.body.role },
      headers: fromNodeHeaders(req.headers),
    });
    res.json(result.user);
  },
);
