import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

// Middleware d'authentification.
// - Lit la session depuis les headers (cookie ou Bearer token).
// - Renvoie 401 si aucune session valide.
// - Injecte req.user et req.session pour la suite de la chaîne.
export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (err) {
    console.error("sessionMiddleware error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
