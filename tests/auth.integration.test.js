import { describe, it, expect } from "vitest";
import { request, app, createUser, as } from "./helpers.js";

const ORIGIN = process.env.BETTER_AUTH_URL || "http://localhost:3000";

describe("Auth & session (intégration)", () => {
  it("sign-up crée un compte avec le rôle user par défaut", async () => {
    const res = await request(app)
      .post("/api/auth/sign-up/email")
      .set("Origin", ORIGIN)
      .send({ name: "Newbie", email: "newbie@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("user");
    expect(res.body.user.email).toBe("newbie@test.com");
  });

  it("renvoie 401 sans cookie sur une route protégée", async () => {
    const res = await request(app).get("/api/v1/recipes");
    expect(res.status).toBe(401);
  });

  it("une session valide passe sessionMiddleware (200 sur /api/v1/recipes)", async () => {
    const { cookie } = await createUser({ name: "Reader", email: "reader@test.com" });
    const res = await as(cookie).get("/api/v1/recipes");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true); // réponse paginée
  });

  it("un cookie invalide est rejeté en 401", async () => {
    const res = await request(app)
      .get("/api/v1/recipes")
      .set("Cookie", "better-auth.session_token=invalid.invalid");
    expect(res.status).toBe(401);
  });
});
