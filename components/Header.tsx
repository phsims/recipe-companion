'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppBar, Toolbar, Tooltip, IconButton, Alert, Button } from "@mui/material";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { useRecipeApp, initialRecipeState } from "@/contexts/RecipeContext";
import { useThread } from "@/components/CopilotKitWrapper";
import { PENDING_RECIPE_KEY } from "@/app/config";
import { CloudDone, CloudOff, HourglassEmpty, Refresh } from "@mui/icons-material";

export default function Header() {
  const router = useRouter();
  const { setRecipeState } = useRecipeApp();
  const { setThreadId } = useThread();
  const { status: backendStatus, error: healthError, check: checkHealth } = useBackendHealth();

  const handleBackToHome = () => {
    setRecipeState(initialRecipeState);
    setThreadId(null);
    if (typeof window !== "undefined") sessionStorage.removeItem(PENDING_RECIPE_KEY);
    router.push("/");
  };

  const statusLabel =
    backendStatus === 'up'
      ? 'Backend connected'
      : backendStatus === 'checking'
        ? 'Checking…'
        : `Backend unavailable${healthError ? ` (${healthError})` : ''}`;
  const StatusIcon = backendStatus === 'up' ? CloudDone : backendStatus === 'checking' ? HourglassEmpty : CloudOff;
  const statusColor = backendStatus === 'up' ? 'success.main' : backendStatus === 'checking' ? 'text.secondary' : 'error.main';

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: 'background.paper', color: 'primary.main', borderBottom: '2px solid', borderColor: 'primary.dark' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleBackToHome();
            }}
            style={{ display: "block", lineHeight: 0 }}
            aria-label="Recipe Companion – go to home"
          >
            <Image
              src="/logo.png"
              width={216}
              height={75}
              alt="Recipe Companion"
              style={{ marginTop: 8, marginBottom: 8 }}
              loading="eager"
            />
          </Link>

          <Tooltip title={statusLabel}>
            <IconButton
              color="inherit"
              onClick={() => checkHealth()}
              aria-label={statusLabel}
              sx={{ color: statusColor, "& svg": { fontSize: 28 } }}
              size="large"
            >
              <StatusIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {backendStatus === 'down' && (
        <Alert
          severity="error"
          sx={{ borderRadius: 0 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<Refresh />}
              onClick={() => checkHealth()}
              aria-label="Retry backend connection"
            >
              Retry
            </Button>
          }
        >
          Backend unavailable. Upload and chat won&apos;t work until the server is running.
          {healthError && ` (${healthError})`}
        </Alert>
      )}
    </>
  );
}