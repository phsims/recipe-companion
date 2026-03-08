"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface VoiceInputContextValue {
  /** Transcript from voice input to be sent to the chat. Cleared after send. */
  pendingTranscript: string | null;
  setPendingTranscript: (text: string | null) => void;
}

const VoiceInputContext = createContext<VoiceInputContextValue | null>(null);

export function useVoiceInput() {
  const ctx = useContext(VoiceInputContext);
  return ctx;
}

export function VoiceInputProvider({ children }: { children: ReactNode }) {
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const setSafe = useCallback((text: string | null) => setPendingTranscript(text), []);
  return (
    <VoiceInputContext.Provider
      value={{ pendingTranscript, setPendingTranscript: setSafe }}
    >
      {children}
    </VoiceInputContext.Provider>
  );
}
