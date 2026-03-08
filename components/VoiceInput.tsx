"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import Mic from "@mui/icons-material/Mic";
import { useChatContext } from "@copilotkit/react-ui";
import { useVoiceInput } from "@/contexts/VoiceInputContext";

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition
    : undefined;

export default function VoiceInput() {
  const { setOpen: setChatOpen } = useChatContext();
  const voice = useVoiceInput();
  const [listening, setListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognition>> | null>(null);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!SpeechRecognition) {
      setUnsupported(true);
      return;
    }
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const startListening = useCallback(() => {
    if (!SpeechRecognition || !voice) return;
    if (listening) {
      stopListening();
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      for (let i = event.resultIndex; i < results.length; i++) {
        const item = results[i];
        if (item.isFinal && item.length > 0) {
          const text = item[0].transcript?.trim();
          if (text) {
            voice.setPendingTranscript(text);
            setChatOpen(true);
          }
        }
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setListening(false);
      }
    };

    rec.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [SpeechRecognition, voice, listening, stopListening, setChatOpen]);

  const handleClick = useCallback(() => {
    if (unsupported) return;
    startListening();
  }, [unsupported, startListening]);

  if (unsupported) {
    return (
      <Tooltip title="Voice input not supported in this browser">
        <span>
          <IconButton color="inherit" size="medium" aria-label="Voice input" disabled>
            <Mic />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={listening ? "Stop listening" : "Start voice input"}>
      <IconButton
        color="inherit"
        size="medium"
        aria-label={listening ? "Stop voice input" : "Voice input"}
        onClick={handleClick}
        sx={
          listening
            ? {
                animation: "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.6 },
                },
              }
            : undefined
        }
      >
        <Mic />
      </IconButton>
    </Tooltip>
  );
}
