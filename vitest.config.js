import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Setup exécuté une fois avant toute la suite : prépare une DB jetable.
    globalSetup: "./tests/global-setup.js",
    // Pas de parallélisme entre fichiers : ils partagent la même DB/JSON de test.
    fileParallelism: false,
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // On exclut le bootstrap serveur (listen/shutdown, non exécuté en test),
      // la doc OpenAPI et les déclarations de types pures.
      exclude: ["src/index.ts", "src/openapi.ts", "src/types/**"],
      reporter: ["text", "html"],
    },
  },
});
