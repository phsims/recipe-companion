/**
 * Proxies all CopilotKit subpaths (e.g. /api/copilotkit/info) to the Python backend.
 * Workaround: React client sends GET /info but Python SDK expects POST /info with JSON body (see CopilotKit #1907).
 * We rewrite GET /info → POST /info with body "{}" so the backend accepts it.
 */
import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/copilotkitProxy";

function getBackendPath(pathSegments: string[]): string {
  const path = pathSegments?.length ? pathSegments.join("/") : "";
  return `/copilotkit${path ? `/${path}` : ""}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const pathStr = (pathSegments ?? []).join("/");
    const backendPath = getBackendPath(pathSegments ?? []);

    // Python CopilotKit SDK expects POST /info with a JSON body; React sends GET. Rewrite to avoid 422/400.
    if (pathStr === "info") {
      const { status, body, contentType } = await proxyToBackend(backendPath, request, {
        method: "POST",
        body: "{}",
      });
      return new NextResponse(body, {
        status,
        headers: { "Content-Type": contentType },
      });
    }

    const { status, body, contentType } = await proxyToBackend(backendPath, request, { method: "GET" });
    return new NextResponse(body, {
      status,
      headers: { "Content-Type": contentType },
    });
  } catch (e) {
    console.error("[api/copilotkit/[...path]] GET proxy error:", e);
    return NextResponse.json(
      { error: "Backend unreachable", details: String(e) },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const backendPath = getBackendPath(pathSegments ?? []);
    const body = await request.text();
    const { status, body: resBody, contentType } = await proxyToBackend(backendPath, request, {
      method: "POST",
      body: body || undefined,
    });
    return new NextResponse(resBody, {
      status,
      headers: { "Content-Type": contentType },
    });
  } catch (e) {
    console.error("[api/copilotkit/[...path]] POST proxy error:", e);
    return NextResponse.json(
      { error: "Backend unreachable", details: String(e) },
      { status: 502 }
    );
  }
}
