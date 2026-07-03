import type { LokiPushBody } from "@/lib/loki/types";

export class LokiConfigError extends Error {
  constructor() {
    super("LOKI_URL is not configured.");
    this.name = "LokiConfigError";
  }
}

function pushUrl(): string {
  const base = process.env.LOKI_URL;
  if (!base) throw new LokiConfigError();
  return `${base.replace(/\/+$/, "")}/loki/api/v1/push`;
}

// Forward a push body to Loki and return the raw fetch Response so the caller
// can relay Loki's status, headers, and body verbatim. Throws LokiConfigError
// if unconfigured; propagates network errors from fetch.
export function pushToLoki(body: LokiPushBody): Promise<Response> {
  return fetch(pushUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
