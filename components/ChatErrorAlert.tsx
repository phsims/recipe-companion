"use client";

import { Alert, Button, Box, Typography } from "@mui/material";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import Refresh from "@mui/icons-material/Refresh";

export interface ChatErrorProps {
  message: string;
  operation?: string;
  timestamp?: number;
  onDismiss: () => void;
  onRetry?: () => void;
}

/**
 * Renders agent/network errors in the CopilotKit sidebar with dismiss and retry.
 */
export default function ChatErrorAlert({
  message,
  operation,
  onDismiss,
  onRetry,
}: ChatErrorProps) {
  return (
    <Alert
      severity="error"
      icon={<ErrorOutline />}
      sx={{ mx: 1, my: 1 }}
      onClose={onDismiss}
      action={
        onRetry ? (
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            <Button
              size="small"
              color="inherit"
              startIcon={<Refresh />}
              onClick={onRetry}
            >
              Retry
            </Button>
          </Box>
        ) : undefined
      }
    >
      <Typography variant="body2" component="span">
        {message}
      </Typography>
      {operation && (
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          Operation: {operation}
        </Typography>
      )}
    </Alert>
  );
}
