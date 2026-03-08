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
