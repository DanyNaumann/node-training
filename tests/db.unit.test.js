import { describe, it, expect, beforeEach } from "vitest";
import {
  db,
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "../src/db.js";
import { recipes } from "../src/schema.js";

// Repository Drizzle (unitaire, sur la DB de test).
describe("recipes repository (Drizzle)", () => {
  beforeEach(() => {
    db.delete(recipes).run(); // table vierge avant chaque test
  });

  const sample = (over = {}) => ({
    name: "Test",
    ingredients: ["a", "b"],
    duration: 10,
    createdBy: "tester",
    ...over,
  });

  it("create renvoie la ligne avec id + createdAt générés", async () => {
    const r = await createRecipe(sample());
    expect(r.id).toBeTruthy();
    expect(r.createdAt).toBeInstanceOf(Date);
    expect(r.ingredients).toEqual(["a", "b"]); // JSON désérialisé
  });

  it("getRecipe renvoie undefined si absent", async () => {
    expect(await getRecipe("nope")).toBeUndefined();
  });

  it("listRecipes pagine et renvoie le total", async () => {
    for (let i = 0; i < 5; i++) await createRecipe(sample({ name: `r${i}`, duration: i + 1 }));
    const page = await listRecipes({ limit: 2, offset: 0 });
    expect(page.total).toBe(5);
    expect(page.data).toHaveLength(2);
    expect(page.limit).toBe(2);
  });

  it("listRecipes filtre par maxDuration", async () => {
    await createRecipe(sample({ name: "court", duration: 5 }));
    await createRecipe(sample({ name: "long", duration: 50 }));
    const page = await listRecipes({ maxDuration: 10, limit: 20, offset: 0 });
    expect(page.total).toBe(1);
    expect(page.data[0].name).toBe("court");
  });

  it("updateRecipe applique un merge partiel", async () => {
    const r = await createRecipe(sample({ name: "Soup", duration: 30 }));
    const updated = await updateRecipe(r.id, { duration: 5 });
    expect(updated?.duration).toBe(5);
    expect(updated?.name).toBe("Soup"); // inchangé
  });

  it("deleteRecipe renvoie true puis false", async () => {
    const r = await createRecipe(sample());
    expect(await deleteRecipe(r.id)).toBe(true);
    expect(await deleteRecipe(r.id)).toBe(false);
  });
});
