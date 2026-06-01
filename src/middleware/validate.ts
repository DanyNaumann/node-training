import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

type Schemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

// Middleware de validation Zod. Valide body / query / params selon les schémas
// fournis, et REMPLACE req.* par la version parsée (typée, avec defaults/coercion).
// En cas d'échec, renvoie 400 avec le détail des erreurs.
export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const key of ["body", "query", "params"] as const) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: result.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }
      // Express 5 : req.query est en lecture seule (getter). On stocke la
      // version validée dans req.validated pour y accéder sans réassigner.
      if (key === "query") {
        (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
      } else {
        req[key] = result.data as never;
      }
    }
    next();
  };
}
