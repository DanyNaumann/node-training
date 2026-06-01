import type { Request, Response, NextFunction } from "express";
import { roles } from "../auth.js";

type RoleName = keyof typeof roles;

// Middleware factory de contrôle de permissions (RBAC).
// Usage : requirePermission("recipe", "delete") — à placer APRÈS sessionMiddleware.
export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roleName = req.user?.role as RoleName | undefined;
    const role = roleName ? roles[roleName] : null;

    if (!role) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { success } = role.authorize({ [resource]: [action] });
    if (!success) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}
