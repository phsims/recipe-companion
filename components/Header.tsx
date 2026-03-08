'use client';

import Image from "next/image";
import { AppBar, Toolbar, Chip, Tooltip, IconButton } from "@mui/material";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { CloudDone, CloudOff, HourglassEmpty } from "@mui/icons-material";

export default function Header() {
  const { status: backendStatus, error: healthError, check: checkHealth } = useBackendHealth();

  const statusLabel =
    backendStatus === 'up'
      ? 'Backend connected'
      : backendStatus === 'checking'
        ? 'Checking…'
        : `Backend unavailable${healthError ? ` (${healthError})` : ''}`;
  const StatusIcon = backendStatus === 'up' ? CloudDone : backendStatus === 'checking' ? HourglassEmpty : CloudOff;
  const statusColor = backendStatus === 'up' ? 'success.main' : backendStatus === 'checking' ? 'text.secondary' : 'error.main';

  return (
    <AppBar position="static" sx={{ backgroundColor: 'background.paper', color: 'primary.main', borderBottom: '2px solid', borderColor: 'primary.dark' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Image
          src="/logo.png"
          width={216}
          height={75}
          alt="Recipe Companion"
          style={{ marginTop: 8, marginBottom: 8 }}
          loading="eager"
        />

        <Tooltip title={statusLabel}>
          <IconButton
            color="inherit"
            onClick={() => checkHealth()}
            aria-label={statusLabel}
            sx={{ color: statusColor }}
            size="large"
          >
            <StatusIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}