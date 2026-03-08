/**
 * CopilotKit subpaths: agent/.../run and agent/.../connect go to the runtime (which uses HttpAgent to Python).
 * recipe-state and info are handled here.
 */
import { NextRequest, NextResponse } from "next/server";
import { handleRequest } from "@/lib/copilotkitRuntime";
import { proxyToBackend } from "@/lib/copilotkitProxy";

const FALLBACK_INFO_JSON = JSON.stringify({ actions: [], agents: [] });

function getBackendPath(pathSegments: string[]): string {
  const path = pathSegments?.length ? pathSegments.join("/") : "";
  if (/^agent\/[^/]+\/(run|connect)$/.test(path)) return "/copilotkit";
  return `/copilotkit${path ? `/${path}` : ""}`;
}

function normalizeInfoResponse(body: string, contentType: string): string {
  let text = body;
  if (contentType.includes("text/event-stream") && body.startsWith("data: ")) {
    text = body.split("\n")[0].slice(6);
  }
  if (!text || text.trim() === "") return FALLBACK_INFO_JSON;
  try {
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return FALLBACK_INFO_JSON;
    return JSON.stringify({
      ...parsed,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      agents: Array.isArray(parsed.agents) ? parsed.agents : [],
    });
  } catch {
    return FALLBACK_INFO_JSON;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const backendPath = getBackendPath(pathSegments ?? []);
    const pathStr = (pathSegments ?? []).join("/");

    if (pathStr === "info") {
      const { status, body, contentType } = await proxyToBackend(backendPath, request, { method: "POST", body: "{}" });
      return new NextResponse(normalizeInfoResponse(body, contentType), {
        status: status >= 400 ? 200 : status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { status, body, contentType } = await proxyToBackend(backendPath, request, { method: "GET" });
    return new NextResponse(body, { status, headers: { "Content-Type": contentType } });
  } catch (e) {
    console.error("[api/copilotkit/[...path]] GET proxy error:", e);
    return NextResponse.json({ error: "Backend unreachable", details: String(e) }, { status: 502 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path: pathSegments } = await params;
  const pathStr = (pathSegments ?? []).join("/");

  if (pathStr === "recipe-state") {
    return new NextResponse(null, { status: 204 });
  }

  // agent/.../run and agent/.../connect: forward to runtime (same envelope, URL as /api/copilotkit so Hono matches)
  if (/^agent\/[^/]+\/(run|connect)$/.test(pathStr)) {
    const url = new URL(request.url);
    const runtimeUrl = `${url.origin}/api/copilotkit`;
    const body = await request.text();
    const forwarded = new Request(runtimeUrl, {
      method: "POST",
      headers: new Headers(request.headers),
      body,
    });
    return handleRequest(forwarded as NextRequest);
  }

  if (pathStr === "info") {
    try {
      const backendPath = getBackendPath(pathSegments ?? []);
      const body = await request.text();
      const { status, body: resBody, contentType } = await proxyToBackend(backendPath, request, {
        method: "POST",
        body: body || undefined,
      });
      return new NextResponse(normalizeInfoResponse(resBody, contentType), {
        status: status >= 400 ? 200 : status,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("[api/copilotkit/[...path]] POST info error:", e);
      return NextResponse.json({ error: "Backend unreachable", details: String(e) }, { status: 502 });
    }
  }

  return new NextResponse(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
}
