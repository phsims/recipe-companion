/**
 * Proxies CopilotKit runtime requests to the Python backend.
 * Avoids CORS when frontend (port 3000) talks to backend (port 8000).
 * If you see 422: backend is rejecting the request (path/body/headers). Check backend CopilotKit route and version.
 */
import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/copilotkitProxy";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const backendPath = url.pathname.replace(/^\/api/, "");
    const { status, body, contentType } = await proxyToBackend(backendPath, request, { method: "GET" });
    return new NextResponse(body, {
      status,
      headers: { "Content-Type": contentType },
    });
  } catch (e) {
    console.error("[api/copilotkit] GET proxy error:", e);
    return NextResponse.json(
      { error: "Backend unreachable", details: String(e) },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const backendPath = url.pathname.replace(/^\/api/, "");
    let body = await request.text();

    // Backend (LangGraph-style) requires threadId, runId, state, messages on every request.
    // Client sends only {"method":"info"} for runtime info → 422. Add minimal placeholders for info requests.
    if (body) {
      try {
        const parsed = JSON.parse(body) as Record<string, unknown>;
        if (parsed?.method === "info") {
          body = JSON.stringify({
            ...parsed,
            threadId: parsed.threadId ?? "",
            runId: parsed.runId ?? "",
            state: parsed.state ?? {},
            messages: parsed.messages ?? [],
          });
        }
      } catch {
        // leave body unchanged if not JSON or other parse error
      }
    }

    const { status, body: resBody, contentType } = await proxyToBackend(backendPath, request, {
      method: "POST",
      body: body || undefined,
    });
    return new NextResponse(resBody, {
      status,
      headers: { "Content-Type": contentType },
    });
  } catch (e) {
    console.error("[api/copilotkit] POST proxy error:", e);
    return NextResponse.json(
      { error: "Backend unreachable", details: String(e) },
      { status: 502 }
    );
  }
}
