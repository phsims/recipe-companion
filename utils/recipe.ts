import type { Recipe, Ingredient, RecipeStep } from "@/app/types";

/** Escape special regex characters for use in RegExp */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Scale recipe ingredients to target servings (mirrors backend Recipe.scale).
 * Uses original_servings when present, otherwise recipe.servings.
 */
export function scaleRecipe(recipe: Recipe, targetServings: number): Recipe {
  if (recipe.servings === 0 || recipe.servings === targetServings) {
    return recipe;
  }
  const base = recipe.original_servings ?? recipe.servings;
  const scaleFactor = targetServings / base;

  const scaledIngredients: Ingredient[] = recipe.ingredients.map((ing: Ingredient) => ({
    ...ing,
    quantity:
      ing.quantity != null
        ? Math.round(ing.quantity * scaleFactor * 100) / 100
        : null,
  }));

  return {
    ...recipe,
    ingredients: scaledIngredients,
    servings: targetServings,
    original_servings: base,
  };
}

/**
 * Return a new recipe with one ingredient substituted (exact match by name, case-insensitive).
 * Updates both the ingredients list and step instructions that mention the ingredient.
 */
export function substituteIngredient(
  recipe: Recipe,
  originalName: string,
  substituteName: string,
  substituteQuantity?: number | null,
  substituteUnit?: string | null
): Recipe {
  const newIngredients: Ingredient[] = recipe.ingredients.map((ing: Ingredient) => {
    if (ing.name.toLowerCase() === originalName.toLowerCase()) {
      return {
        ...ing,
        name: substituteName,
        quantity: substituteQuantity !== undefined ? substituteQuantity : ing.quantity,
        unit: substituteUnit !== undefined ? substituteUnit : ing.unit,
      };
    }
    return ing;
  });

  const pattern = new RegExp(escapeRegex(originalName), "gi");
  const newSteps: RecipeStep[] = recipe.steps.map((step: RecipeStep) => ({
    ...step,
    instruction: step.instruction.replace(pattern, substituteName),
  }));

  return {
    ...recipe,
    ingredients: newIngredients,
    steps: newSteps,
  };
}
