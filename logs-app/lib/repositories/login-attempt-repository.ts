import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { loginAttempts } from "@/lib/db/schema";
import type { LoginAttempt } from "@/lib/types";

const MAX_ATTEMPTS = 10;
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day

export class LoginAttemptRepository {
  isBlocked(ip: string): boolean {
    const row = db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.ip, ip))
      .get();

    if (!row?.blocked) return false;

    // Auto-expire after 1 day.
    if (row.blockedAt !== null && Date.now() - row.blockedAt >= BLOCK_DURATION_MS) {
      db.delete(loginAttempts).where(eq(loginAttempts.ip, ip)).run();
      return false;
    }

    return true;
  }

  recordFailure(ip: string): void {
    const row = db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.ip, ip))
      .get();

    if (!row) {
      db.insert(loginAttempts)
        .values({ ip, attempts: 1, blocked: false, blockedAt: null })
        .run();
    } else {
      const next = row.attempts + 1;
      const willBlock = next >= MAX_ATTEMPTS;
      db.update(loginAttempts)
        .set({
          attempts: next,
          blocked: willBlock,
          blockedAt: willBlock ? Date.now() : row.blockedAt,
        })
        .where(eq(loginAttempts.ip, ip))
        .run();
    }
  }

  resetAttempts(ip: string): void {
    db.delete(loginAttempts).where(eq(loginAttempts.ip, ip)).run();
  }

  listBlocked(): LoginAttempt[] {
    return db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.blocked, true))
      .all();
  }

  unblock(ip: string): void {
    db.delete(loginAttempts).where(eq(loginAttempts.ip, ip)).run();
  }
}

export const loginAttemptRepository = new LoginAttemptRepository();
