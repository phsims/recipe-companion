import { NextRequest } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8000";

/** Headers to forward from client to backend (lowercase). Skip host and connection. */
const FORWARD_HEADERS = [
  "content-type",
  "accept",
  "accept-language",
  "accept-encoding",
  "authorization",
  "cache-control",
  "pragma",
  "sec-fetch-mode",
  "sec-fetch-dest",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "user-agent",
];

export function getBackendUrl(): string {
  return BACKEND_URL;
}

export function forwardHeaders(from: NextRequest): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of FORWARD_HEADERS) {
    const v = from.headers.get(name);
    if (v) out[name] = v;
  }
  return out;
}

/**
 * Backend expects run payload at top level; CopilotKit sends { method, params, body }.
 * Returns the inner body as JSON string when present, otherwise the raw body.
 */
export function unwrapCopilotKitEnvelope(rawBody: string): string {
  if (!rawBody?.trim()) return rawBody;
  try {
    const envelope = JSON.parse(rawBody) as { method?: string; body?: unknown };
    if (
      envelope &&
      typeof envelope === "object" &&
      "body" in envelope &&
      envelope.body != null &&
      (envelope.method === "agent/run" || envelope.method === "agent/connect")
    ) {
      return JSON.stringify(envelope.body);
    }
  } catch {
    // not JSON or wrong shape — forward as-is
  }
  return rawBody;
}

/** True if the request body looks like a CopilotKit agent run/connect envelope. */
export function isCopilotKitEnvelope(rawBody: string): boolean {
  if (!rawBody?.trim()) return false;
  try {
    const envelope = JSON.parse(rawBody) as { method?: string; body?: unknown };
    return (
      !!envelope &&
      typeof envelope === "object" &&
      (envelope.method === "agent/run" || envelope.method === "agent/connect") &&
      envelope.body != null
    );
  } catch {
    return false;
  }
}

/** Proxy a request to the backend and return the response. Log 422 body in dev for debugging. */
export async function proxyToBackend(
  backendPath: string,
  request: NextRequest,
  init: { method: string; body?: string }
): Promise<{ status: number; body: string; contentType: string }> {
  const url = new URL(request.url);
  const target = `${BACKEND_URL}${backendPath}${url.search}`;
  const headers: Record<string, string> = { ...forwardHeaders(request) };
  if (init.body && !headers["content-type"]) {
    headers["content-type"] = "application/json";
  }
  const res = await fetch(target, {
    method: init.method,
    headers,
    body: init.body ?? undefined,
    cache: "no-store",
  });
  const body = await res.text();
  const contentType = res.headers.get("Content-Type") || "application/json";

  if (res.status === 422 && process.env.NODE_ENV === "development") {
    console.warn("[copilotkit proxy] Backend returned 422. Path:", backendPath, "Body:", body.slice(0, 500));
  }

  return { status: res.status, body, contentType };
}

/**
 * Proxy POST to the backend and return the raw Response so the caller can stream the body.
 * Use this for agent/run and any endpoint that returns SSE or streaming JSON.
 */
export async function fetchBackendResponse(
  backendPath: string,
  request: NextRequest,
  body: string | undefined
): Promise<Response> {
  const url = new URL(request.url);
  const target = `${BACKEND_URL}${backendPath}${url.search}`;
  const headers: Record<string, string> = { ...forwardHeaders(request) };
  if (body && !headers["content-type"]) {
    headers["content-type"] = "application/json";
  }
  if (!headers["accept"]) {
    headers["accept"] = "text/event-stream, application/json";
  }
  return fetch(target, {
    method: "POST",
    headers,
    body: body ?? undefined,
    cache: "no-store",
  });
}

export const STREAM_RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
  "connection",
  "x-copilotkit-runtime-version",
] as const;

export function copyStreamResponseHeaders(from: Response, to: Headers): void {
  for (const name of STREAM_RESPONSE_HEADERS) {
    const v = from.headers.get(name);
    if (v) to.set(name, v);
  }
  const ct = to.get("content-type") || "";
  if (ct.includes("text/event-stream") && !ct.includes("charset=")) {
    to.set("Content-Type", "text/event-stream; charset=utf-8");
  } else if (!to.has("content-type")) {
    to.set("Content-Type", "text/event-stream; charset=utf-8");
  }
  to.set("X-Accel-Buffering", "no");
}
