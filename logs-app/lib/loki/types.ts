// --- Public request contract for POST /api/log ---
// The client sends a LogRequest (an array of LogStream). Auth is via the
// application log token; the application tag is resolved server-side.

export type LogLevel = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface Log {
  // Epoch nanoseconds as a string (Loki-native). Must be a string — ns values
  // exceed Number.MAX_SAFE_INTEGER. Absent => server uses "now".
  time?: string;
  // Object is JSON-stringified into the log line; string is used as-is.
  content: object | string;
  // Structured metadata (3rd element of a Loki value tuple). Queryable in
  // Grafana without adding stream cardinality.
  metadata?: Record<string, string>;
}

export interface LogStream {
  level: LogLevel;
  host?: string;
  logs: Log[];
}

export type LogRequest = LogStream[];

// --- Loki push API shapes (what the wrapper produces) ---
// POST {LOKI_URL}/loki/api/v1/push

// [ tsNanoseconds, line, structuredMetadata? ]
export type LokiValue = [string, string] | [string, string, Record<string, string>];

export interface LokiStream {
  stream: Record<string, string>; // labels (low cardinality)
  values: LokiValue[];
}

export interface LokiPushBody {
  streams: LokiStream[];
}
