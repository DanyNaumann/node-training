import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

// DB jetable pour les tests (hors auth.sqlite réel).
const DB_FILE = join(tmpdir(), "recipes-test.sqlite");

// Exécuté UNE FOIS avant toute la suite de tests.
export async function setup() {
  process.env.DB_FILE = DB_FILE;
  process.env.NODE_ENV = "test";
  process.env.BETTER_AUTH_SECRET ||= "test-secret-at-least-32-characters-long-xx";
  process.env.BETTER_AUTH_URL ||= "http://localhost:3000";

  cleanFiles();

  // 1) Tables Better Auth (user/session/account/verification) via le CLI.
  execFileSync(
    "npx",
    ["@better-auth/cli@latest", "migrate", "-y", "--config", "src/auth.ts"],
    { stdio: "ignore", env: { ...process.env } },
  );

  // 2) Table recipe via les migrations Drizzle (dossier ./drizzle).
  const sqlite = new Database(DB_FILE);
  migrate(drizzle(sqlite), { migrationsFolder: "./drizzle" });
  sqlite.close();
}

export async function teardown() {
  cleanFiles();
}

function cleanFiles() {
  for (const f of [DB_FILE, `${DB_FILE}-journal`]) {
    rmSync(f, { force: true });
  }
}
