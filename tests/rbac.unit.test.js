import { describe, it, expect, vi } from "vitest";
import { requirePermission } from "../src/middleware/rbac.js";

// Construit un faux (req, res, next) et exécute le middleware.
function run(role, resource, action) {
  const req = { user: role ? { role } : undefined };
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  const next = vi.fn();
  requirePermission(resource, action)(req, res, next);
  return { allowed: next.mock.calls.length === 1, res };
}

describe("requirePermission (unitaire)", () => {
  it("user : peut lire, mais ni créer/modifier/supprimer", () => {
    expect(run("user", "recipe", "read").allowed).toBe(true);
    expect(run("user", "recipe", "create").allowed).toBe(false);
    expect(run("user", "recipe", "update").allowed).toBe(false);
    expect(run("user", "recipe", "delete").allowed).toBe(false);
  });

  it("editor : lit/crée/modifie, mais ne supprime pas", () => {
    expect(run("editor", "recipe", "read").allowed).toBe(true);
    expect(run("editor", "recipe", "create").allowed).toBe(true);
    expect(run("editor", "recipe", "update").allowed).toBe(true);
    expect(run("editor", "recipe", "delete").allowed).toBe(false);
  });

  it("admin : tout sur recipe + user:read et user:ban", () => {
    expect(run("admin", "recipe", "delete").allowed).toBe(true);
    expect(run("admin", "user", "read").allowed).toBe(true);
    expect(run("admin", "user", "ban").allowed).toBe(true);
  });

  it("renvoie 403 quand refusé", () => {
    const { allowed, res } = run("user", "recipe", "delete");
    expect(allowed).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });

  it("refuse rôle absent ou inconnu", () => {
    expect(run(undefined, "recipe", "read").allowed).toBe(false);
    expect(run("ghost", "recipe", "read").allowed).toBe(false);
  });
});
