import "dotenv/config";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";
import { sqlite } from "./db.js";

// --- Définition des permissions (Access Control) ---
// Un "statement" décrit les ressources et les actions possibles dessus.
const statement = {
  ...defaultStatements,
  recipe: ["read", "create", "update", "delete"],
  user: [...defaultStatements.user, "read"],
} as const;

export const ac = createAccessControl(statement);

// Un rôle = un sous-ensemble du statement (ce qu'il a le droit de faire).
export const roles = {
  user: ac.newRole({
    recipe: ["read"],
  }),
  editor: ac.newRole({
    recipe: ["read", "create", "update"],
  }),
  admin: ac.newRole({
    recipe: ["read", "create", "update", "delete"],
    ...adminAc.statements,
    user: [...adminAc.statements.user, "read"],
  }),
};

export const auth = betterAuth({
  // Instance better-sqlite3 partagée ; Better Auth gère ses tables via Kysely.
  database: sqlite,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      ac,
      roles,
    }),
  ],
});

// Types dérivés de l'instance auth (source de vérité pour user/session).
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
