import { describe, it, expect, beforeAll } from "vitest";
import { createUser, as } from "./helpers.js";

let userC, adminC, targetId;

beforeAll(async () => {
  userC = (await createUser({ name: "U2", email: "u-admin@test.com", role: "user" })).cookie;
  adminC = (await createUser({ name: "A2", email: "a-admin@test.com", role: "admin" })).cookie;
  targetId = (await createUser({ name: "T", email: "target@test.com" })).id;
});

describe("Routes admin & RBAC (intégration)", () => {
  it("user reçoit 403 sur GET /api/v1/admin/users", async () => {
    const res = await as(userC).get("/api/v1/admin/users");
    expect(res.status).toBe(403);
  });

  it("admin liste tous les comptes (200)", async () => {
    const res = await as(adminC).get("/api/v1/admin/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((u) => u.email === "target@test.com")).toBe(true);
  });

  it("user reçoit 403 sur PATCH role", async () => {
    const res = await as(userC)
      .patch(`/api/v1/admin/users/${targetId}/role`)
      .send({ role: "admin" });
    expect(res.status).toBe(403);
  });

  it("admin PATCH role invalide -> 400", async () => {
    const res = await as(adminC)
      .patch(`/api/v1/admin/users/${targetId}/role`)
      .send({ role: "superuser" });
    expect(res.status).toBe(400);
  });

  it("admin change le rôle (user -> editor) et c'est persisté", async () => {
    const res = await as(adminC)
      .patch(`/api/v1/admin/users/${targetId}/role`)
      .send({ role: "editor" });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("editor");

    // Vérifie via la liste que le changement est bien persisté.
    const list = await as(adminC).get("/api/v1/admin/users");
    const target = list.body.find((u) => u.id === targetId);
    expect(target.role).toBe("editor");
  });
});
