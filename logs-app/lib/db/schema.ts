import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  // Session token + expiry (epoch ms). Null when logged out.
  session: text("session"),
  sessionExpiresAt: integer("session_expires_at"),
});

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  tag: text("tag").notNull(),
});

export const logTokens = sqliteTable("log_tokens", {
  id: text("id").primaryKey(),
  description: text("description").notNull().default(""),
  applicationId: text("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
});
