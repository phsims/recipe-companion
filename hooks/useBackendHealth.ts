"use client";

import { useState, useCallback, useEffect } from "react";

type Status = "idle" | "checking" | "up" | "down";

export function useBackendHealth() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setStatus("checking");
    setError(null);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (res.ok) {
        setStatus("up");
      } else {
        setStatus("down");
        setError(`HTTP ${res.status}`);
      }
    } catch (e) {
      setStatus("down");
      setError(e instanceof Error ? e.message : "Network error");
    }
  }, []);

  useEffect(() => {
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [check]);

  return { status, error, check };
}
