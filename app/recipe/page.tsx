"use client";

import { useEffect, useState } from "react";
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
import { useChatContext } from "@copilotkit/react-ui";
import RecipeDisplay from "@/components/RecipeDisplay";
import VoiceInput from "@/components/VoiceInput";
import type { RecipeContext as RecipeContextType, Recipe } from "@/app/types";
import { useRecipeApp, initialRecipeState } from "@/contexts/RecipeContext";
import { PENDING_RECIPE_KEY } from "@/app/config";
import { scaleRecipe, applyAgentSubstitutionsToRecipe } from "@/utils/recipe";

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
  const { open: chatOpen, setOpen: setChatOpen } = useChatContext();

  const onToggleChat = () => setChatOpen(!chatOpen);

  const agentName =
    process.env.NEXT_PUBLIC_COPILOT_AGENT_NAME || "agenticChatAgent";

  const { state } = useCoAgent<RecipeContextType>({
    name: agentName,
    initialState: recipeState,
    ...(threadId && { threadId }),
  });

  // When the agent returns state (from stream), merge it into recipeState so the UI updates.
  // If the agent did a substitution, it usually only updates ingredients; apply the same name
  // changes to instructions, tips, and description so substitution appears everywhere.
  useEffect(() => {
    if (!state || !recipeState.recipe) return;
    setRecipeState((prev) => {
      const agentRecipe = state.recipe ?? prev.recipe;
      const recipe =
        agentRecipe && prev.recipe
          ? applyAgentSubstitutionsToRecipe(agentRecipe, prev.recipe)
          : agentRecipe;
      return {
        ...prev,
        document_text: state.document_text ?? prev.document_text,
        recipe,
        current_step: state.current_step ?? prev.current_step,
        scaled_servings: state.scaled_servings ?? prev.scaled_servings,
        checked_ingredients: state.checked_ingredients ?? prev.checked_ingredients,
        cooking_started: state.cooking_started ?? prev.cooking_started,
      };
    });
  }, [
    state?.document_text,
    state?.recipe,
    state?.current_step,
    state?.scaled_servings,
    state?.checked_ingredients,
    state?.cooking_started,
    setRecipeState,
  ]);

  // Prefer agent state when synced; fall back to context.
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

  const handleBackToHome = () => {
    setRecipeState(initialRecipeState);
    setThreadId(null);
    if (typeof window !== "undefined") sessionStorage.removeItem(PENDING_RECIPE_KEY);
    router.push("/");
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
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }} role="status" aria-live="polite" aria-busy="true">
        <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <CircularProgress size={48} aria-hidden />
          <Typography variant="body1" color="text.secondary" id="loading-recipe">
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
          <Button variant="contained" onClick={handleBackToHome} aria-label="Go back to home page">
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
            onClick={handleBackToHome}
            sx={{ mr: 2 }}
            aria-label="Back to home"
          >
            <ArrowBack />
          </IconButton>
          <Restaurant sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} aria-hidden="true">
            {displayRecipe.title || "Recipe"}
          </Typography>

          <VoiceInput />
          <Tooltip title="Open AI Cooking Assistant">
            <IconButton
              color="inherit"
              onClick={onToggleChat}
              aria-label="Open AI Cooking Assistant"
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
    </Box>
  );
}
