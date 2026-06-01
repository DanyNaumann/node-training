import type { Session, User } from "../auth.js";

// Augmentation du type Request d'Express : sessionMiddleware injecte
// req.user / req.session ; validate() injecte req.validatedQuery.
declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
      validatedQuery?: unknown;
    }
  }
}

export {};
