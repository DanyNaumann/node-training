import { describe, it, expect, beforeAll } from "vitest";
import { createUser, as } from "./helpers.js";
import { db } from "../src/db.js";
import { recipes } from "../src/schema.js";

let userC, editorC, adminC;

beforeAll(async () => {
  db.delete(recipes).run(); // table recette vierge
  userC = (await createUser({ name: "U", email: "u-recipe@test.com", role: "user" })).cookie;
  editorC = (await createUser({ name: "E", email: "e-recipe@test.com", role: "editor" })).cookie;
  adminC = (await createUser({ name: "A", email: "a-recipe@test.com", role: "admin" })).cookie;
});

describe("CRUD recettes & RBAC (intégration)", () => {
  it("user reçoit 403 sur POST (recipe:create refusé)", async () => {
    const res = await as(userC).post("/api/v1/recipes").send({
      name: "Forbidden", ingredients: ["x"], duration: 5,
    });
    expect(res.status).toBe(403);
  });

  it("editor peut créer (201) avec createdBy = son id", async () => {
    const res = await as(editorC).post("/api/v1/recipes").send({
      name: "Pasta", ingredients: ["pasta", "salt"], duration: 15,
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("Pasta");
    expect(res.body.createdBy).toBeDefined();
  });

  it("POST invalide -> 400 (validation Zod, avec détails)", async () => {
    const res = await as(editorC).post("/api/v1/recipes").send({
      name: "", ingredients: [], duration: -5,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it("POST avec champ inconnu -> 400 (.strict())", async () => {
    const res = await as(editorC).post("/api/v1/recipes").send({
      name: "X", ingredients: ["a"], duration: 5, createdBy: "hacker",
    });
    expect(res.status).toBe(400);
  });

  it("GET liste paginée (data/total) puis filtre ?maxDuration=20", async () => {
    await as(editorC).post("/api/v1/recipes").send({ name: "Roast", ingredients: ["beef"], duration: 40 });

    const all = await as(userC).get("/api/v1/recipes");
    expect(all.status).toBe(200);
    expect(all.body.total).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(all.body.data)).toBe(true);

    const filtered = await as(userC).get("/api/v1/recipes?maxDuration=20");
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.every((r) => r.duration <= 20)).toBe(true);
    expect(filtered.body.data.some((r) => r.name === "Roast")).toBe(false);
  });

  it("pagination : limit/offset respectés", async () => {
    const page = await as(userC).get("/api/v1/recipes?limit=1&offset=0");
    expect(page.body.data).toHaveLength(1);
    expect(page.body.limit).toBe(1);
    expect(page.body.offset).toBe(0);
  });

  it("query invalide (limit > 100) -> 400", async () => {
    const res = await as(userC).get("/api/v1/recipes?limit=999");
    expect(res.status).toBe(400);
  });

  it("GET /:id inexistant -> 404", async () => {
    const res = await as(userC).get("/api/v1/recipes/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("editor PUT = merge partiel (garde les autres champs)", async () => {
    const created = await as(editorC).post("/api/v1/recipes").send({
      name: "Soup", ingredients: ["water", "veg"], duration: 30,
    });
    const id = created.body.id;

    const res = await as(editorC).put(`/api/v1/recipes/${id}`).send({ duration: 10 });
    expect(res.status).toBe(200);
    expect(res.body.duration).toBe(10);
    expect(res.body.name).toBe("Soup");
    expect(res.body.ingredients).toEqual(["water", "veg"]);
  });

  it("PUT vide -> 400 (au moins un champ requis)", async () => {
    const created = await as(editorC).post("/api/v1/recipes").send({
      name: "Empty", ingredients: ["a"], duration: 5,
    });
    const res = await as(editorC).put(`/api/v1/recipes/${created.body.id}`).send({});
    expect(res.status).toBe(400);
  });

  it("editor reçoit 403 sur DELETE", async () => {
    const created = await as(editorC).post("/api/v1/recipes").send({
      name: "ToDelete", ingredients: ["x"], duration: 5,
    });
    const res = await as(editorC).delete(`/api/v1/recipes/${created.body.id}`);
    expect(res.status).toBe(403);
  });

  it("admin DELETE -> 204 sans body, puis 404 au second appel", async () => {
    const created = await as(editorC).post("/api/v1/recipes").send({
      name: "AdminDel", ingredients: ["x"], duration: 5,
    });
    const id = created.body.id;

    const del = await as(adminC).delete(`/api/v1/recipes/${id}`);
    expect(del.status).toBe(204);
    expect(del.body).toEqual({});

    const again = await as(adminC).delete(`/api/v1/recipes/${id}`);
    expect(again.status).toBe(404);
  });

  it("la persistance survit : une recette créée est relue via GET", async () => {
    const created = await as(editorC).post("/api/v1/recipes").send({
      name: "Persisted", ingredients: ["a"], duration: 12,
    });
    const list = await as(userC).get("/api/v1/recipes?limit=100");
    expect(list.body.data.some((r) => r.id === created.body.id)).toBe(true);
  });
});
