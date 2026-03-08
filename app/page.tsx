"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Container } from "@mui/material";
import UploadZone from "@/components/UploadZone";
import { useRecipeApp } from "@/contexts/RecipeContext";
import { useThread } from "@/components/CopilotKitWrapper";
import { useCoAgent } from "@copilotkit/react-core";
import type { RecipeContext as RecipeContextType } from "@/app/types";
import { features } from "./data";
import FeatureCard from "@/components/FeatureCard";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const { recipeState, threadId } = useRecipeApp();
  const agentName =
    process.env.NEXT_PUBLIC_COPILOT_AGENT_NAME || "agenticChatAgent";

  const { state } = useCoAgent<RecipeContextType>({
    name: agentName,
    initialState: recipeState,
    ...(threadId && { threadId }),
  });

  // Processed recipe = from upload response or from agent once it's ready
  const displayRecipe = recipeState.recipe ?? state?.recipe;

  // When recipe is processed, redirect to recipe page
  useEffect(() => {
    if (displayRecipe) {
      router.replace("/recipe");
    }
  }, [displayRecipe, router]);


  return (
    <>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h3"
              align="center"
              gutterBottom
              fontWeight={700}
              sx={{ mb: 2 }}
            >
              Welcome to your Recipe Companion
            </Typography>
            <Typography
              variant="h6"
              align="center"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Upload a recipe and let AI guide you through cooking
            </Typography>
          </motion.div>

          <UploadZone />
        </Box>

        <Box
          sx={{
            mt: 6,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 3,
          }}
        >
          {features?.map((feature, index) => (
            <FeatureCard key={index} {...feature} id={index} />
          ))}
        </Box>
      </Container>

    </>
  );
}
