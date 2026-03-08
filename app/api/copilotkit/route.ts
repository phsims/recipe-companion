/**
 * CopilotKit Runtime (GraphQL) endpoint. Agent runs are forwarded to the Python AG-UI backend via HttpAgent.
 */
import { NextRequest } from "next/server";
import { handleRequest } from "@/lib/copilotkitRuntime";

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}
