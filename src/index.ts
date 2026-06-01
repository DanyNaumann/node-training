import "dotenv/config";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { pathToFileURL } from "node:url";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { sqlite } from "./db.js";
import { recipesRouter } from "./routes/recipes.js";
import { adminRouter } from "./routes/admin.js";
import { globalLimiter, authLimiter } from "./middleware/rateLimit.js";
import { notFoundHandler, errorHandler } from "./middleware/error.js";
import { buildOpenApiDocument } from "./openapi.js";

export const app = express();

// Derrière un reverse proxy, décommenter pour que rate limiting / req.ip
// voient la vraie IP. Ne jamais mettre `true` aveuglément (spoofing).
// app.set("trust proxy", 1);

// Sécurité : helmet avec une CSP explicite. Swagger UI utilise des styles et
// scripts inline (d'où 'unsafe-inline' sur style/script) ; tout le reste est
// restreint à 'self'. API pure : pas d'assets tiers à autoriser.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  }),
);

// Rate limiting global, puis renforcé sur l'auth (anti brute-force).
app.use(globalLimiter);
app.use("/api/auth", authLimiter);

// ⚠️ Handler Better Auth AVANT express.json() (il lit le flux brut).
app.all("/api/auth/*splat", toNodeHandler(auth));

// Parser JSON pour nos routes uniquement, avec limite de taille.
app.use(express.json({ limit: "100kb" }));

// Documentation interactive Swagger UI à partir du document OpenAPI généré.
const openApiDocument = buildOpenApiDocument();
app.get("/openapi.json", (_req, res) => res.json(openApiDocument));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Liveness/readiness probe.
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Routes métier versionnées sous /api/v1.
app.use("/api/v1/recipes", recipesRouter);
app.use("/api/v1/admin", adminRouter);

// 404 puis error handler global (toujours en dernier).
app.use(notFoundHandler);
app.use(errorHandler);

// Démarrage seulement si lancé directement (pas à l'import par les tests).
function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const server = app.listen(PORT, () => {
    console.log(`🍽️  Recipes API en écoute sur http://localhost:${PORT}`);
    console.log(`📖 Documentation : http://localhost:${PORT}/docs`);
  });

  function shutdown(signal: string) {
    console.log(`\n${signal} reçu, arrêt en cours...`);
    server.close((err) => {
      if (err) {
        console.error("Erreur à la fermeture du serveur:", err);
        process.exit(1);
      }
      sqlite.close();
      console.log("Serveur et DB fermés proprement. Bye 👋");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("Arrêt forcé (timeout).");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    console.error("unhandledRejection:", reason);
    shutdown("unhandledRejection");
  });
  process.on("uncaughtException", (err) => {
    console.error("uncaughtException:", err);
    shutdown("uncaughtException");
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
