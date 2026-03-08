"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { RecipeContext as RecipeContextType, UploadResponse } from "@/app/types";
import { useThread } from "@/components/CopilotKitWrapper";

const initialRecipeState: RecipeContextType = {
  document_text: null,
  recipe: null,
  current_step: 0,
  scaled_servings: null,
  checked_ingredients: [],
  cooking_started: false,
};

interface RecipeAppValue {
  recipeState: RecipeContextType;
  setRecipeState: (s: RecipeContextType | ((prev: RecipeContextType) => RecipeContextType)) => void;
  threadId: string | null;
  setThreadId: (id: string | null) => void;
  uploadResponse: UploadResponse | null;
  setUploadResponse: (r: UploadResponse | null) => void;
}

const RecipeAppContext = createContext<RecipeAppValue | null>(null);

export function RecipeProvider({ children }: { children: ReactNode }) {
  const { threadId, setThreadId } = useThread();
  const [recipeState, setRecipeState] = useState<RecipeContextType>(initialRecipeState);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);

  const setRecipeStateSafe = useCallback(
    (s: RecipeContextType | ((prev: RecipeContextType) => RecipeContextType)) => {
      setRecipeState(s);
    },
    []
  );

  return (
    <RecipeAppContext.Provider
      value={{
        recipeState,
        setRecipeState: setRecipeStateSafe,
        threadId,
        setThreadId,
        uploadResponse,
        setUploadResponse,
      }}
    >
      {children}
    </RecipeAppContext.Provider>
  );
}

export function useRecipeApp() {
  const ctx = useContext(RecipeAppContext);
  if (!ctx) throw new Error("useRecipeApp must be used within RecipeProvider");
  return ctx;
}
