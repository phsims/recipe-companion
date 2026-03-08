"use client";

import { useCallback, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import CloudUpload from "@mui/icons-material/CloudUpload";
import Description from "@mui/icons-material/Description";
import { useThread } from "@/components/CopilotKitWrapper";
import { useRecipeApp } from "@/contexts/RecipeContext";
import type { UploadResponse } from "@/app/types";
import { motion, AnimatePresence } from "framer-motion";
import { PENDING_RECIPE_KEY } from "@/app/config";

const ACCEPT = ".pdf,.txt";

export default function UploadZone() {
  const { setThreadId } = useThread();
  const { setRecipeState } = useRecipeApp();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file) return;
      setError(null);
      setSelectedFile(file);
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.details || data.error || "Upload failed");
        }
        const payload = data as UploadResponse;
        if (!payload.threadId) {
          throw new Error("No threadId in response");
        }
        setThreadId(payload.threadId);
        if (payload.state) {
          setRecipeState(payload.state);
          sessionStorage.setItem(
            PENDING_RECIPE_KEY,
            JSON.stringify({ threadId: payload.threadId, state: payload.state })
          );
        }
        // Stay on home so we can show processed recipe or "processing" message
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [setThreadId, setRecipeState]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type === "application/pdf" || file.type.startsWith("text/"))) {
        uploadFile(file);
      } else {
        setError("Please upload a PDF or text file.");
      }
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        uploadFile(files[0]);
      }
      e.target.value = "";
    },
    [uploadFile]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={isDragging ? 8 : 2}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 4,
          textAlign: "center",
          border: "2px dashed",
          borderColor: isDragging ? "primary.main" : "grey.300",
          backgroundColor: isDragging ? "primary.50" : "background.paper",
          transition: "all 0.3s ease",
          cursor: uploading ? "wait" : "pointer",
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          {uploading ? (
            <>
              <CircularProgress size={60} />
              <Typography variant="h6" color="text.secondary">
                Analyzing recipe...
              </Typography>
            </>
          ) : (
            <>
              <CloudUpload sx={{ fontSize: 60, color: "primary.main" }} />
              <Typography variant="h5" fontWeight={600}>
                Upload Your Recipe
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Drag and drop a PDF or text file, or click to browse
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
              We’ll process it and take you to the recipe page when it’s ready.
            </Typography>
              <input
                type="file"
                accept={ACCEPT}
                onChange={handleFileSelect}
                style={{ display: "none" }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<Description />}
                  size="large"
                >
                  Select File
                </Button>
              </label>

              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Typography variant="body2" color="success.main">
                    ✓ {selectedFile.name}
                  </Typography>
                </motion.div>
              )}
            </>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Typography color="error">{error}</Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Paper>
    </motion.div>
  );
}
