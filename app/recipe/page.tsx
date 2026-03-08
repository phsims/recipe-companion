"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { ArrowBack, Restaurant, SmartToy } from "@mui/icons-material";
import { useCoAgent } from "@copilotkit/react-core";
import RecipeDisplay from "@/components/RecipeDisplay";
import VoiceInput from "@/components/VoiceInput";
import type { RecipeContext as RecipeContextType, Recipe } from "@/app/types";
import { useRecipeApp } from "@/contexts/RecipeContext";
import { PENDING_RECIPE_KEY } from "@/app/config";
import { scaleRecipe } from "@/utils/recipe";
import { CopilotSidebar } from "@copilotkit/react-ui";

export default function RecipePage() {
  const router = useRouter();
  const {
    recipeState,
    threadId,
    setRecipeState,
    setThreadId,
  } = useRecipeApp();
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [hadPendingData, setHadPendingData] = useState(false);
  const [stepOverride, setStepOverride] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevSidebarOpen = useRef(false);
  const userRequestedToggle = useRef(false);

  // Sync our "open" intent with the sidebar by triggering its internal toggle (no remount = smooth transition).
  // Only trigger when the user clicked our button, not when the sidebar called onSetOpen (e.g. click outside).
  useEffect(() => {
    if (prevSidebarOpen.current === sidebarOpen) return;
    prevSidebarOpen.current = sidebarOpen;
    if (!userRequestedToggle.current) return;
    userRequestedToggle.current = false;
    const toggle =
      document.querySelector(".copilotKitSidebar .copilotKitButton") as HTMLElement | null;
    if (toggle) toggle.click();
  }, [sidebarOpen]);

  const onToggleChat = () => {
    userRequestedToggle.current = true;
    setSidebarOpen((o) => !o);
  };

  const agentName =
    process.env.NEXT_PUBLIC_COPILOT_AGENT_NAME || "agenticChatAgent";

  const { state } = useCoAgent<RecipeContextType>({
    name: agentName,
    initialState: recipeState,
    ...(threadId && { threadId }),
  });

  // Prefer agent state when synced; fall back to context. When user has scaled, prefer context recipe.
  const displayRecipe =
    recipeState.scaled_servings != null && recipeState.recipe
      ? recipeState.recipe
      : (state?.recipe ?? recipeState.recipe);
  const displayCurrentStep =
    stepOverride ?? state?.current_step ?? recipeState.current_step;
  const displayCheckedIngredients =
    state?.checked_ingredients ?? recipeState.checked_ingredients;

  useEffect(() => {
    setStepOverride(null);
  }, [state?.current_step]);

  const handleStepClick = (stepIndex: number) => {
    setStepOverride(stepIndex);
    setRecipeState({ ...recipeState, current_step: stepIndex });
  };

  const handleServingsChange = (targetServings: number) => {
    const base = displayRecipe ?? recipeState.recipe;
    if (!base) return;
    const scaled = scaleRecipe(base, targetServings);
    setRecipeState({
      ...recipeState,
      recipe: scaled,
      scaled_servings: targetServings,
    });
  };

  const handleSubstitute = (newRecipe: Recipe) => {
    setRecipeState({
      ...recipeState,
      recipe: newRecipe,
      scaled_servings:
        recipeState.recipe?.servings ?? newRecipe.servings,
    });
  };

  // Hydrate from sessionStorage on mount (for client nav / refresh)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(PENDING_RECIPE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as { threadId: string; state: RecipeContextType };
        setRecipeState(data.state);
        setThreadId(data.threadId);
        sessionStorage.removeItem(PENDING_RECIPE_KEY);
        setHadPendingData(true);
      } catch {
        // ignore
      }
    }
    setHasCheckedStorage(true);
  }, [setRecipeState, setThreadId]);

  // Redirect to home only when we've checked storage and have no session (no thread, no recipe)
  useEffect(() => {
    if (!hasCheckedStorage) return;
    if (threadId || hadPendingData) return; // have a session, stay on recipe page
    if (recipeState.recipe) return;
    router.replace("/");
  }, [hasCheckedStorage, threadId, hadPendingData, recipeState.recipe, router]);

  // Loading: only while we haven't read sessionStorage yet
  if (!hasCheckedStorage) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
        <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary">
            Loading recipe...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!displayRecipe) {
    return (
			<Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
				<Box sx={{ textAlign: 'center' }}>
					<Typography variant="h5" gutterBottom>
						No recipe loaded
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
						Upload a recipe first to view this page.
					</Typography>
					<Button variant="contained" onClick={() => router.push('/')}>
						Back to Home
					</Button>
				</Box>
			</Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => router.push("/")}
            sx={{ mr: 2 }}
            aria-label="Back to home"
          >
            <ArrowBack />
          </IconButton>
          <Restaurant sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {displayRecipe.title || "Recipe"}
          </Typography>
          <VoiceInput />
          <Tooltip title="Open AI Cooking Assistant">
            <IconButton
              color="inherit"
              onClick={onToggleChat}
              aria-label={sidebarOpen ? "Close AI Cooking Assistant" : "Open AI Cooking Assistant"}
            >
              <SmartToy />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <RecipeDisplay
          recipe={displayRecipe}
          currentStep={displayCurrentStep}
          checkedIngredients={displayCheckedIngredients}
          onStepClick={handleStepClick}
          onServingsChange={handleServingsChange}
          onSubstitute={handleSubstitute}
          onToggleChat={onToggleChat}
        />
      </Container>

      <CopilotSidebar
        defaultOpen={false}
        onSetOpen={setSidebarOpen}
        clickOutsideToClose
        labels={{ title: "Cooking assistant", initial: "Ask for scaling, substitutions, or next steps…" }}
      />
    </Box>
  );
}
