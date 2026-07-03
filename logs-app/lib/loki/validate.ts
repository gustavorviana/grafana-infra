import { isValidTime } from "@/lib/loki/time";
import type { Log, LogLevel, LogRequest, LogStream } from "@/lib/loki/types";

const LEVELS: readonly LogLevel[] = ["INFO", "WARNING", "ERROR", "CRITICAL"];

export type ValidationResult =
  | { ok: true; data: LogRequest }
  | { ok: false; error: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function fail(error: string): ValidationResult {
  return { ok: false, error };
}

// Validates the POST /api/log body against the LogRequest contract.
// Returns the typed data on success or the first error found (with a path).
export function validateLogRequest(body: unknown): ValidationResult {
  if (!Array.isArray(body)) {
    return fail("Body must be an array of LogStream.");
  }
  if (body.length === 0) {
    return fail("Body must contain at least one LogStream.");
  }

  for (let i = 0; i < body.length; i++) {
    const err = validateStream(body[i], `[${i}]`);
    if (err) return fail(err);
  }

  return { ok: true, data: body as LogRequest };
}

function validateStream(value: unknown, path: string): string | null {
  if (!isPlainObject(value)) return `${path}: must be an object.`;

  const { level, host, logs } = value as Partial<LogStream> & {
    [k: string]: unknown;
  };

  if (typeof level !== "string" || !LEVELS.includes(level as LogLevel)) {
    return `${path}.level: must be one of ${LEVELS.join(", ")}.`;
  }
  if (host !== undefined && typeof host !== "string") {
    return `${path}.host: must be a string.`;
  }
  if (!Array.isArray(logs)) {
    return `${path}.logs: must be an array.`;
  }
  if (logs.length === 0) {
    return `${path}.logs: must contain at least one Log.`;
  }

  for (let j = 0; j < logs.length; j++) {
    const err = validateLog(logs[j], `${path}.logs[${j}]`);
    if (err) return err;
  }
  return null;
}

function validateLog(value: unknown, path: string): string | null {
  if (!isPlainObject(value)) return `${path}: must be an object.`;

  const { time, content, metadata } = value as Partial<Log> & {
    [k: string]: unknown;
  };

  if (time !== undefined) {
    if (typeof time !== "string" || !isValidTime(time)) {
      return `${path}.time: must be a unix timestamp (digits) or an ISO-8601 date string.`;
    }
  }

  if (content === undefined || content === null) {
    return `${path}.content: is required.`;
  }
  if (typeof content !== "string" && typeof content !== "object") {
    return `${path}.content: must be an object or string.`;
  }

  if (metadata !== undefined) {
    if (!isPlainObject(metadata)) {
      return `${path}.metadata: must be an object of string values.`;
    }
    for (const [k, v] of Object.entries(metadata)) {
      if (typeof v !== "string") {
        return `${path}.metadata.${k}: must be a string.`;
      }
    }
  }

  return null;
}
