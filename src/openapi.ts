import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import {
  RecipeSchema,
  CreateRecipeSchema,
  UpdateRecipeSchema,
  ListRecipesQuerySchema,
  UpdateRoleSchema,
} from "./schemas.js";

// Construit le document OpenAPI à partir des schémas Zod (source unique).
export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  // Auth par cookie de session (Better Auth).
  const cookieAuth = registry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "better-auth.session_token",
  });
  const security = [{ [cookieAuth.name]: [] }];

  // --- Recipes ---
  registry.registerPath({
    method: "get",
    path: "/api/v1/recipes",
    summary: "Lister les recettes (paginé, filtrable)",
    security,
    request: { query: ListRecipesQuerySchema },
    responses: {
      200: {
        description: "Liste paginée",
        content: {
          "application/json": {
            schema: RecipeSchema.array().openapi("RecipeList"),
          },
        },
      },
      401: { description: "Non authentifié" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/recipes",
    summary: "Créer une recette (editor/admin)",
    security,
    request: {
      body: { content: { "application/json": { schema: CreateRecipeSchema } } },
    },
    responses: {
      201: { description: "Créée", content: { "application/json": { schema: RecipeSchema } } },
      400: { description: "Validation échouée" },
      403: { description: "Permission insuffisante" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/recipes/{id}",
    summary: "Récupérer une recette",
    security,
    responses: {
      200: { description: "OK", content: { "application/json": { schema: RecipeSchema } } },
      404: { description: "Introuvable" },
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/v1/recipes/{id}",
    summary: "Mettre à jour partiellement (editor/admin)",
    security,
    request: {
      body: { content: { "application/json": { schema: UpdateRecipeSchema } } },
    },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: RecipeSchema } } },
      400: { description: "Validation échouée" },
      404: { description: "Introuvable" },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/v1/recipes/{id}",
    summary: "Supprimer (admin uniquement)",
    security,
    responses: {
      204: { description: "Supprimée" },
      403: { description: "Permission insuffisante" },
      404: { description: "Introuvable" },
    },
  });

  // --- Admin ---
  registry.registerPath({
    method: "get",
    path: "/api/v1/admin/users",
    summary: "Lister les utilisateurs (admin)",
    security,
    responses: {
      200: { description: "Liste des comptes" },
      403: { description: "Permission insuffisante" },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/admin/users/{id}/role",
    summary: "Changer le rôle d'un utilisateur (admin)",
    security,
    request: {
      body: { content: { "application/json": { schema: UpdateRoleSchema } } },
    },
    responses: {
      200: { description: "Rôle mis à jour" },
      400: { description: "Rôle invalide" },
      403: { description: "Permission insuffisante" },
    },
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Recipes API",
      description:
        "API REST de recettes avec authentification (Better Auth) et RBAC à 3 rôles. " +
        "Auth disponible sous /api/auth/* (sign-up, sign-in, sign-out, get-session).",
    },
    servers: [{ url: "/" }],
  });
}
