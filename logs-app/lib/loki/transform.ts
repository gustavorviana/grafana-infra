import { nowNs, toNanos } from "@/lib/loki/time";
import type {
  LogRequest,
  LokiPushBody,
  LokiStream,
  LokiValue,
} from "@/lib/loki/types";

function toLine(content: object | string): string {
  return typeof content === "string" ? content : JSON.stringify(content);
}

// Convert the validated LogRequest into a Loki push body.
// Labels (stream identity, low cardinality): app tag, level, host, and cliente.
export function toLokiPush(data: LogRequest, tag: string, cliente?: string | null): LokiPushBody {
  const streams: LokiStream[] = data.map((s) => {
    const labels: Record<string, string> = { app: tag, level: s.level };
    if (s.host) labels.host = s.host;
    if (cliente) labels.cliente = cliente;

    const values: LokiValue[] = s.logs.map((log) => {
      // Validation guarantees a parseable time; fall back to now if absent.
      const ts = (log.time && toNanos(log.time)) || nowNs();
      const line = toLine(log.content);
      return [ts, line, log.metadata as Record<string, string>];
    });

    return { stream: labels, values };
  });

  return { streams };
}
