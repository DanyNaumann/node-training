import request from "supertest";
import Database from "better-sqlite3";
import { app } from "../src/index.js";

const ORIGIN = process.env.BETTER_AUTH_URL || "http://localhost:3000";

// Connexion directe à la DB de test pour forcer un rôle (ce que ferait
// normalement un admin via l'API ; on court-circuite pour préparer le terrain).
function testDb() {
  return new Database(process.env.DB_FILE);
}

export function setRole(email, role) {
  const db = testDb();
  db.prepare("UPDATE user SET role = ? WHERE email = ?").run(role, email);
  db.close();
}

// Crée un compte et renvoie le cookie de session + l'id user.
// role optionnel : promeut le compte après création.
export async function createUser({ name, email, password = "password123", role }) {
  const res = await request(app)
    .post("/api/auth/sign-up/email")
    .set("Origin", ORIGIN)
    .send({ name, email, password });

  if (res.status !== 200) {
    throw new Error(`sign-up failed (${res.status}): ${JSON.stringify(res.body)}`);
  }

  const id = res.body.user.id;
  let cookie = res.headers["set-cookie"];

  if (role && role !== "user") {
    setRole(email, role);
    // Re-login pour que la session reflète le nouveau rôle.
    cookie = await login(email, password);
  }

  return { id, cookie, email };
}

// Connexion : renvoie le cookie de session.
export async function login(email, password = "password123") {
  const res = await request(app)
    .post("/api/auth/sign-in/email")
    .set("Origin", ORIGIN)
    .send({ email, password });
  if (res.status !== 200) {
    throw new Error(`sign-in failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.headers["set-cookie"];
}

// Petit helper : un agent supertest authentifié (porte le cookie).
export function as(cookie) {
  return {
    get: (url) => request(app).get(url).set("Cookie", cookie).set("Origin", ORIGIN),
    post: (url) => request(app).post(url).set("Cookie", cookie).set("Origin", ORIGIN),
    put: (url) => request(app).put(url).set("Cookie", cookie).set("Origin", ORIGIN),
    patch: (url) => request(app).patch(url).set("Cookie", cookie).set("Origin", ORIGIN),
    delete: (url) => request(app).delete(url).set("Cookie", cookie).set("Origin", ORIGIN),
  };
}

export { request, app };
