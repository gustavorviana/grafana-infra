import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { logTokens } from "@/lib/db/schema";
import type { LogToken } from "@/lib/types";

function genToken(): string {
  return "lgt_" + randomBytes(24).toString("hex");
}

export class LogTokenRepository {
  list(): LogToken[] {
    return db.select().from(logTokens).all();
  }

  get(id: string): LogToken | undefined {
    return db.select().from(logTokens).where(eq(logTokens.id, id)).get();
  }

  // Look up a token by its raw value (used to authenticate the log API).
  findByToken(token: string): LogToken | undefined {
    return db.select().from(logTokens).where(eq(logTokens.token, token)).get();
  }

  // Token is generated here (server) only on creation.
  add(data: Omit<LogToken, "id" | "token">): LogToken {
    const token: LogToken = { ...data, id: randomUUID(), token: genToken() };
    db.insert(logTokens).values(token).run();
    return token;
  }

  edit(id: string, patch: Partial<Omit<LogToken, "id" | "token">>): void {
    db.update(logTokens).set(patch).where(eq(logTokens.id, id)).run();
  }

  // Regenerate the token value for an existing row.
  reset(id: string): string {
    const token = genToken();
    db.update(logTokens).set({ token }).where(eq(logTokens.id, id)).run();
    return token;
  }

  remove(id: string): void {
    db.delete(logTokens).where(eq(logTokens.id, id)).run();
  }
}

export const logTokenRepository = new LogTokenRepository();
