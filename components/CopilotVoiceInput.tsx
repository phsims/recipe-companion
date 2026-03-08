"use client";

import { useEffect, useRef, useState } from "react";
import { useChatContext } from "@copilotkit/react-ui";
import { useVoiceInput } from "@/contexts/VoiceInputContext";

type Props = {
  inProgress: boolean;
  onSend: (text: string) => void;
  chatReady?: boolean;
  onStop?: () => void;
  onUpload?: () => void;
  hideStopButton?: boolean;
  [key: string]: unknown;
};

/**
 * Custom chat Input that sends voice transcripts from VoiceInputContext
 * and renders the standard input UI so the sidebar chat works.
 */
export default function CopilotVoiceInput({
  inProgress,
  onSend,
  chatReady = false,
  onStop,
  onUpload,
  hideStopButton = false,
  ..._rest
}: Props) {
  const context = useChatContext();
  const voice = useVoiceInput();
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When a voice transcript is pending, send it and clear
  useEffect(() => {
    if (!voice?.pendingTranscript || !onSend) return;
    const transcript = voice.pendingTranscript.trim();
    if (transcript) {
      onSend(transcript);
      voice.setPendingTranscript(null);
    }
  }, [voice?.pendingTranscript, onSend, voice?.setPendingTranscript]);

  const send = () => {
    if (inProgress) return;
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
    textareaRef.current?.focus();
  };

  const isInProgress = inProgress;
  const buttonIcon = !chatReady
    ? context.icons.spinnerIcon
    : isInProgress && !hideStopButton
      ? context.icons.stopIcon
      : context.icons.sendIcon;
  const buttonAlt = !chatReady
    ? "Loading"
    : isInProgress && !hideStopButton
      ? "Stop"
      : "Send";
  const canSend = !isInProgress && text.trim().length > 0;
  const canStop = isInProgress && !hideStopButton;
  const sendDisabled = !canSend && !canStop;

  return (
    <div className="copilotKitInputContainer">
      <div
        className="copilotKitInput"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
          textareaRef.current?.focus();
        }}
      >
        <textarea
          ref={textareaRef}
          placeholder={context.labels.placeholder}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) send();
            }
          }}
          className="copilotKitTextarea"
          style={{
            resize: "none",
            width: "100%",
            minHeight: "24px",
            maxHeight: "120px",
            border: "none",
            outline: "none",
            font: "inherit",
            padding: 0,
          }}
        />
        <div className="copilotKitInputControls">
          {onUpload && (
            <button
              type="button"
              onClick={onUpload}
              className="copilotKitInputControlButton"
            >
              {context.icons.uploadIcon}
            </button>
          )}
          <div style={{ flexGrow: 1 }} />
          <button
            type="button"
            disabled={sendDisabled}
            onClick={isInProgress && !hideStopButton ? onStop : send}
            data-copilotkit-in-progress={inProgress}
            className="copilotKitInputControlButton"
            aria-label={buttonAlt}
          >
            {buttonIcon}
          </button>
        </div>
      </div>
    </div>
  );
}
