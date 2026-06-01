import { rateLimit } from "express-rate-limit";

// Limites larges en dev pour ne pas se bloquer pendant les tests ;
// strictes en production.
const isProd = process.env.NODE_ENV === "production";

// Limiteur global : protège toute l'API. Fenêtre glissante de 15 min.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 300 : 2000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Limiteur strict pour l'authentification (anti brute-force).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 10 : 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});
