"use client";

import { useState, useCallback } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { createContext, useContext, type ReactNode } from "react";
import { VoiceInputProvider } from "@/contexts/VoiceInputContext";
import CopilotVoiceInput from "@/components/CopilotVoiceInput";
import ChatErrorAlert from "@/components/ChatErrorAlert";

interface ThreadContextValue {
  threadId: string | null;
  setThreadId: (id: string | null) => void;
}

const ThreadContext = createContext<ThreadContextValue | null>(null);

export function useThread() {
  const ctx = useContext(ThreadContext);
  if (!ctx) throw new Error("useThread must be used within CopilotKitWrapper");
  return ctx;
}

export default function CopilotKitWrapper({ children }: { children: ReactNode }) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const setThreadIdSafe = useCallback((id: string | null) => setThreadId(id), []);

  const agentName =
    process.env.NEXT_PUBLIC_COPILOT_AGENT_NAME || "agenticChatAgent";

  return (
    <ThreadContext.Provider value={{ threadId, setThreadId: setThreadIdSafe }}>
      <CopilotKit
        agent={agentName}
        runtimeUrl="/api/copilotkit"
        threadId={threadId ?? undefined}
        credentials="include"
      >
        <VoiceInputProvider>
          <CopilotSidebar
            clickOutsideToClose={false}
            Input={CopilotVoiceInput as any}
            renderError={(props) => (
              <ChatErrorAlert
                message={props.message}
                operation={props.operation}
                timestamp={props.timestamp}
                onDismiss={props.onDismiss}
                onRetry={props.onRetry}
              />
            )}
          >
            {children}
          </CopilotSidebar>
        </VoiceInputProvider>
      </CopilotKit>
    </ThreadContext.Provider>
  );
}
