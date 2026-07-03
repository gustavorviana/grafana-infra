import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { applications } from "@/lib/db/schema";
import type { Application } from "@/lib/types";

export class ApplicationRepository {
  list(): Application[] {
    return db.select().from(applications).all();
  }

  get(id: string): Application | undefined {
    return db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .get();
  }

  add(data: Omit<Application, "id">): Application {
    const app: Application = { ...data, id: randomUUID() };
    db.insert(applications).values(app).run();
    return app;
  }

  edit(id: string, patch: Partial<Omit<Application, "id">>): void {
    db.update(applications).set(patch).where(eq(applications.id, id)).run();
  }

  remove(id: string): void {
    // log_tokens rows cascade via FK (ON DELETE CASCADE + PRAGMA foreign_keys).
    db.delete(applications).where(eq(applications.id, id)).run();
  }
}

export const applicationRepository = new ApplicationRepository();
