import { describe, it, expect } from "vitest";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { request, app, createUser, as } from "./helpers.js";

const ORIGIN = process.env.BETTER_AUTH_URL || "http://localhost:3000";

describe("Hardening (intégration)", () => {
  it("helmet pose les en-têtes de sécurité", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
    // helmet retire l'en-tête qui divulgue la techno.
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("expose les en-têtes RateLimit standard (draft-7)", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["ratelimit-policy"] || res.headers["ratelimit"]).toBeDefined();
  });

  it("route inconnue -> 404 JSON via notFoundHandler", async () => {
    const res = await request(app).get("/api/this-route-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Route not found/);
  });

  it("body JSON malformé -> 400 via errorHandler", async () => {
    const { cookie } = await createUser({ name: "Json", email: "json@test.com", role: "editor" });
    const res = await as(cookie)
      .post("/api/v1/recipes")
      .set("Content-Type", "application/json")
      .send('{"name": broken');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid JSON body");
  });

  it("ne divulgue jamais de stack trace dans la réponse", async () => {
    const res = await request(app).get("/api/nope");
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\(.*:\d+:\d+\)/);
    expect(res.body.stack).toBeUndefined();
  });

  // Le rate limiter est testé en ISOLATION (mini-app, seuil bas) pour ne pas
  // consommer le quota partagé de la vraie app et faire échouer d'autres tests.
  it("rate limiter : renvoie 429 au-delà du seuil", async () => {
    const miniApp = express();
    miniApp.use(
      rateLimit({ windowMs: 60_000, limit: 2, standardHeaders: "draft-7", legacyHeaders: false,
        message: { error: "Too many requests" } }),
    );
    miniApp.get("/", (req, res) => res.json({ ok: true }));

    const codes = [];
    for (let i = 0; i < 4; i++) {
      const r = await request(miniApp).get("/");
      codes.push(r.status);
    }
    // 2 passent, les suivantes sont bloquées.
    expect(codes.filter((c) => c === 200)).toHaveLength(2);
    expect(codes.filter((c) => c === 429).length).toBeGreaterThanOrEqual(1);
  });
});
