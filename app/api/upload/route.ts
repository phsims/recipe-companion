/**
 * Proxies recipe file upload to the Python backend POST /upload.
 * Returns { threadId, state, ... } for CopilotKit session.
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const res = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: "Upload failed", details: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/upload] proxy error:", e);
    return NextResponse.json(
      { error: "Backend unreachable", details: String(e) },
      { status: 502 }
    );
  }
}
