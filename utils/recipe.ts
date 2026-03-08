import type { Recipe, Ingredient, RecipeStep } from "@/app/types";

/** Escape special regex characters for use in RegExp */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Scale recipe ingredients to target servings (mirrors backend Recipe.scale).
 * Uses recipe.servings as the denominator so repeated scaling works from current servings.
 */
export function scaleRecipe(recipe: Recipe, targetServings: number): Recipe {
  if (recipe.servings === 0 || recipe.servings === targetServings) {
    return recipe;
  }
  const scaleFactor = targetServings / recipe.servings;
  const original = recipe.original_servings ?? recipe.servings;

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
    original_servings: original,
  };
}

/**
 * Replace all occurrences of originalName with substituteName in str (case-insensitive).
 * Escapes regex special chars in originalName.
 */
function replaceIngredientInText(
  str: string,
  originalName: string,
  substituteName: string
): string {
  if (!str?.trim()) return str;
  const pattern = new RegExp(escapeRegex(originalName.trim()), "gi");
  return str.replace(pattern, substituteName);
}

/**
 * Return a new recipe with one ingredient substituted (exact match by name, case-insensitive).
 * Updates the ingredients list and every text field that may mention the ingredient:
 * description, step instructions, and step tips.
 */
export function substituteIngredient(
  recipe: Recipe,
  originalName: string,
  substituteName: string,
  substituteQuantity?: number | null,
  substituteUnit?: string | null
): Recipe {
  const orig = originalName.trim();
  const sub = substituteName.trim();

  const newIngredients: Ingredient[] = recipe.ingredients.map((ing: Ingredient) => {
    if (ing.name.toLowerCase() === orig.toLowerCase()) {
      return {
        ...ing,
        name: sub,
        quantity: substituteQuantity !== undefined ? substituteQuantity : ing.quantity,
        unit: substituteUnit !== undefined ? substituteUnit : ing.unit,
      };
    }
    return ing;
  });

  const newSteps: RecipeStep[] = recipe.steps.map((step: RecipeStep) => ({
    ...step,
    instruction: replaceIngredientInText(step.instruction, orig, sub),
    tips: step.tips.map((tip) => replaceIngredientInText(tip, orig, sub)),
  }));

  return {
    ...recipe,
    ingredients: newIngredients,
    steps: newSteps,
    description: recipe.description
      ? replaceIngredientInText(recipe.description, orig, sub)
      : recipe.description,
  };
}

/**
 * When the agent returns a recipe after a substitution, it often only updates the ingredients list.
 * This applies the same name changes to description, step instructions, and tips so the UI is consistent.
 * Compares newRecipe to oldRecipe by ingredient index and runs substituteIngredient for each name change.
 */
export function applyAgentSubstitutionsToRecipe(
  newRecipe: Recipe,
  oldRecipe: Recipe | null
): Recipe {
  if (!oldRecipe || oldRecipe.ingredients.length !== newRecipe.ingredients.length) {
    return newRecipe;
  }
  let result = newRecipe;
  for (let i = 0; i < newRecipe.ingredients.length; i++) {
    const oldName = oldRecipe.ingredients[i].name;
    const newName = newRecipe.ingredients[i].name;
    if (oldName.trim().toLowerCase() !== newName.trim().toLowerCase()) {
      result = substituteIngredient(result, oldName, newName);
    }
  }
  return result;
}
