import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { PublicUser, User } from "@/lib/types";

// Session lifetime: 1 day.
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Thrown when a username collides with an existing one.
export class UsernameTakenError extends Error {
  constructor() {
    super("USERNAME_TAKEN");
    this.name = "UsernameTakenError";
  }
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    String((e as { code: unknown }).code).startsWith("SQLITE_CONSTRAINT")
  );
}

// Public columns only — password and session token never leave the server.
const publicCols = {
  id: users.id,
  username: users.username,
};

export class UserRepository {
  list(): PublicUser[] {
    return db.select(publicCols).from(users).all();
  }

  get(id: string): PublicUser | undefined {
    return db.select(publicCols).from(users).where(eq(users.id, id)).get();
  }

  // Stores the password as a bcrypt hash. Throws UsernameTakenError on
  // duplicate username.
  add(data: Omit<User, "id">): PublicUser {
    const id = randomUUID();
    try {
      db.insert(users)
        .values({
          id,
          username: data.username,
          password: hashPassword(data.password),
        })
        .run();
    } catch (e) {
      if (isUniqueViolation(e)) throw new UsernameTakenError();
      throw e;
    }
    return { id, username: data.username };
  }

  edit(id: string, patch: Partial<Omit<User, "id">>): void {
    const set: Partial<Omit<User, "id">> = {};
    if (patch.username !== undefined) set.username = patch.username;
    if (patch.password !== undefined)
      set.password = hashPassword(patch.password);
    if (Object.keys(set).length === 0) return;
    try {
      db.update(users).set(set).where(eq(users.id, id)).run();
    } catch (e) {
      if (isUniqueViolation(e)) throw new UsernameTakenError();
      throw e;
    }
  }

  remove(id: string): void {
    db.delete(users).where(eq(users.id, id)).run();
  }

  // --- Session ---

  // Validate credentials and issue a fresh session token. Returns the token,
  // or null if the credentials are wrong.
  login(username: string, password: string): string | null {
    const row = db
      .select({ id: users.id, password: users.password })
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!row || !verifyPassword(password, row.password)) return null;

    const token = randomBytes(32).toString("hex");
    const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
    db.update(users)
      .set({ session: token, sessionExpiresAt: expiresAt })
      .where(eq(users.id, row.id))
      .run();
    return token;
  }

  // Return the user for a valid, non-expired session token, else null.
  findBySession(token: string): PublicUser | undefined {
    return db
      .select(publicCols)
      .from(users)
      .where(and(eq(users.session, token), gt(users.sessionExpiresAt, Date.now())))
      .get();
  }

  logout(token: string): void {
    db.update(users)
      .set({ session: null, sessionExpiresAt: null })
      .where(eq(users.session, token))
      .run();
  }
}

export const userRepository = new UserRepository();
