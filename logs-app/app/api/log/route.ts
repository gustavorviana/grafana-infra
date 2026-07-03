import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { LokiConfigError, pushToLoki } from "@/lib/loki/client";
import { toLokiPush } from "@/lib/loki/transform";
import { validateLogRequest } from "@/lib/loki/validate";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { logTokenRepository } from "@/lib/repositories/log-token-repository";

// Response headers that must not be copied verbatim when relaying (they
// describe the original transfer/encoding and would corrupt the relayed body).
const HOP_BY_HOP = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

// POST /api/log
// Auth is done with an application log token (Authorization: Bearer <token>
// or the `x-log-token` header). The user session is NOT considered here —
// this route lives under /api, which the proxy gate excludes.
export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "Missing log token." },
      { status: 401 }
    );
  }

  const logToken = logTokenRepository.findByToken(token);
  if (!logToken) {
    return NextResponse.json(
      { error: "Invalid log token." },
      { status: 401 }
    );
  }

  const application = applicationRepository.get(logToken.applicationId);
  if (!application) {
    // Token orphaned (its application was removed).
    return NextResponse.json(
      { error: "Application not found for token." },
      { status: 401 }
    );
  }

  // Parse + validate the payload against the LogRequest contract.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = validateLogRequest(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Wrap the payload into the Loki push format and forward it.
  const output = toLokiPush(parsed.data, application.tag, logToken.cliente);

  let lokiRes: Response;
  try {
    lokiRes = await pushToLoki(output);
  } catch (e) {
    if (e instanceof LokiConfigError) {
      return NextResponse.json(
        { error: "Loki is not configured." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to reach Loki." },
      { status: 502 }
    );
  }

  // Relay Loki's status, headers, and body back to the caller verbatim.
  const relayHeaders = new Headers();
  lokiRes.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) relayHeaders.set(key, value);
  });

  return new Response(lokiRes.body, {
    status: lokiRes.status,
    statusText: lokiRes.statusText,
    headers: relayHeaders,
  });
}

function extractToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return request.headers.get("x-log-token")?.trim() || null;
}
