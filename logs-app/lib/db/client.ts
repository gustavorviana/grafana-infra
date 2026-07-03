import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "@/lib/db/schema";
import { hashPassword } from "@/lib/password";

const DB_PATH = resolve(process.env.DATABASE_PATH ?? "data/logs.db");

// Single source of truth for the physical schema. The app creates its own
// tables on first boot; there is no external migration/provisioning step.
const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,
  username           TEXT NOT NULL UNIQUE,
  password           TEXT NOT NULL,
  session            TEXT,
  session_expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS applications (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tag         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS log_tokens (
  id             TEXT PRIMARY KEY,
  description    TEXT NOT NULL DEFAULT '',
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  token          TEXT NOT NULL UNIQUE
);
`;

function init() {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(CREATE_SQL);

  // Additive migration for DBs created before the session columns existed.
  const userCols = sqlite
    .prepare("PRAGMA table_info(users)")
    .all() as { name: string }[];
  const hasCol = (c: string) => userCols.some((col) => col.name === c);
  if (!hasCol("session")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN session TEXT");
  }
  if (!hasCol("session_expires_at")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN session_expires_at INTEGER");
  }

  // Seed a default account so the app is reachable once the session gate is on.
  const count = sqlite
    .prepare("SELECT count(*) AS c FROM users")
    .get() as { c: number };
  if (count.c === 0) {
    // Bootstrap admin from env. ADMIN_PASSWORD_HASH must be a bcrypt hash;
    // falls back to a hashed "admin" if unset. Change after first login.
    const adminUser = process.env.ADMIN_USERNAME ?? "admin";
    const adminHash = process.env.ADMIN_PASSWORD_HASH ?? hashPassword("admin");
    sqlite
      .prepare("INSERT INTO users (id, username, password) VALUES (?, ?, ?)")
      .run(randomUUID(), adminUser, adminHash);
  }

  return drizzle(sqlite, { schema });
}

// Reuse a single connection across HMR / module re-eval in dev.
const g = globalThis as unknown as {
  __drizzleDb?: ReturnType<typeof init>;
};

export const db = g.__drizzleDb ?? (g.__drizzleDb = init());
