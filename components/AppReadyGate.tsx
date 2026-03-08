"use client";

import { useState, useEffect, type ReactNode } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import SkipLink from "@/components/SkipLink";
import Header from "@/components/Header";

/**
 * Shows a full-page loading state until the client has mounted and had a chance
 * to paint (so MUI and icons are ready). Then reveals the full app. Nothing
 * else (header, content) is shown until then.
 */
export default function AppReadyGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!ready) {
    return (
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          bgcolor: "background.default",
        }}
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <CircularProgress size={48} aria-hidden />
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content">{children}</main>
    </>
  );
}
