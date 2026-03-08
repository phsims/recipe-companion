"use client";

import { IconButton, Tooltip } from "@mui/material";
import Mic from "@mui/icons-material/Mic";

/**
 * Placeholder for voice input. Wire to speech-to-text when ready.
 */
export default function VoiceInput() {
  return (
    <Tooltip title="Voice input (coming soon)">
      <IconButton color="inherit" size="medium" aria-label="Voice input" disabled>
        <Mic />
      </IconButton>
    </Tooltip>
  );
}
