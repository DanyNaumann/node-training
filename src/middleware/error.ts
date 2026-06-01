import type { Request, Response, NextFunction } from "express";

// Erreur applicative typée : permet à n'importe quelle couche de signaler
// un statut HTTP précis (ex: throw new AppError(404, "Recipe not found")).
export class AppError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// Middleware 404 : monté APRÈS toutes les routes.
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Error handler GLOBAL : monté en DERNIER (signature à 4 args).
// En Express 5, les rejets de promesses des handlers async arrivent ici.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let status = 500;
  let message = "Internal Server Error";

  const e = err as { statusCode?: number; type?: string; message?: string };

  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
  } else if (e?.type === "entity.parse.failed") {
    // Body JSON malformé (levé par express.json()).
    status = 400;
    message = "Invalid JSON body";
  } else if (typeof e?.statusCode === "number") {
    // Erreurs Better Auth (APIError) et autres erreurs portant un statut.
    status = e.statusCode;
    message = e.message || message;
  }

  if (status >= 500) {
    console.error(`[${status}] ${req.method} ${req.originalUrl}`, err);
  } else {
    console.warn(`[${status}] ${req.method} ${req.originalUrl} - ${message}`);
  }

  // On ne renvoie jamais la stack au client (fuite d'info).
  res.status(status).json({ error: message });
}
