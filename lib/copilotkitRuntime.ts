/**
 * Shared CopilotKit Runtime: GraphQL/single-route endpoint that uses HttpAgent to call the Python AG-UI backend.
 * Used by both /api/copilotkit and /api/copilotkit/[...path] so agent/run works from either URL.
 */
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  EmptyAdapter,
} from "@copilotkit/runtime";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8000";
const agentName =
  process.env.NEXT_PUBLIC_COPILOT_AGENT_NAME || "agenticChatAgent";

const runtime = new CopilotRuntime({
  agents: {
    [agentName]: new LangGraphHttpAgent({
      url: `${backendUrl}/copilotkit`,
    }),
  },
});

const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter: new EmptyAdapter(),
  endpoint: "/api/copilotkit",
});

export { handleRequest };
