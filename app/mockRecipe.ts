/**
 * Mock processed recipe for development / when API quota is exceeded.
 * Same shape as POST /upload response so it can replace a real upload.
 *
 * Use "Try sample recipe" on the home page to load this without calling the API.
 * Chat on the recipe page still uses the real backend (Gemini); only parsing is skipped.
 */

import type { UploadResponse } from "@/app/types";

const MOCK_THREAD_ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";
const MOCK_RUN_ID = "b2c3d4e5-f6a7-4890-b123-456789abcdef";

export const mockRecipeUploadResponse: UploadResponse = {
  threadId: MOCK_THREAD_ID,
  runId: MOCK_RUN_ID,
  state: {
    document_text: 'Simple Pasta Carbonara\n\nServings: 2\n\nIngredients: 200g spaghetti, 100g guanciale, 2 eggs, 50g Pecorino Romano, black pepper.\n\nSteps: 1. Boil pasta. 2. Fry guanciale. 3. Mix eggs and cheese. 4. Toss pasta with guanciale, off heat add egg mix and pepper.',
    recipe: {
      title: 'Simple Pasta Carbonara',
      description: 'Classic Roman pasta with eggs, cheese, and cured pork.',
      servings: 2,
      original_servings: null,
      prep_time_minutes: 10,
      cook_time_minutes: 20,
      difficulty: 'easy',
      cuisine: 'Italian',
      dietary_tags: [],
      ingredients: [
        { name: 'Spaghetti', quantity: 200, unit: 'g', preparation: null, category: 'pantry', substitutes: [] },
        { name: 'Guanciale', quantity: 100, unit: 'g', preparation: 'diced', category: 'protein', substitutes: ['pancetta', 'bacon'] },
        { name: 'Eggs', quantity: 2, unit: null, preparation: 'room temperature', category: 'dairy', substitutes: [] },
        { name: 'Pecorino Romano', quantity: 50, unit: 'g', preparation: 'finely grated', category: 'dairy', substitutes: ['Parmesan'] },
        { name: 'Black pepper', quantity: null, unit: null, preparation: 'freshly ground', category: 'spice', substitutes: [] },
      ],
      steps: [
        { step_number: 1, instruction: 'Bring a large pot of salted water to a boil. Add the spaghetti and cook until al dente, about 9–11 minutes. Reserve 1 cup pasta water, then drain.', duration_minutes: 11, timer_label: 'Pasta', requires_attention: false, tips: ['Salt the water like the sea'] },
        { step_number: 2, instruction: 'While the pasta cooks, fry the guanciale in a large pan over medium heat until crisp and golden, about 5–7 minutes. No extra oil needed.', duration_minutes: 7, timer_label: null, requires_attention: true, tips: ['Render the fat slowly'] },
        { step_number: 3, instruction: 'In a bowl, whisk the eggs and grated Pecorino with plenty of black pepper until smooth.', duration_minutes: 2, timer_label: null, requires_attention: false, tips: [] },
        { step_number: 4, instruction: 'Off the heat, add the drained pasta to the guanciale pan. Toss, then pour in the egg mixture and stir quickly. Add pasta water a little at a time until creamy. Serve immediately with more pepper and cheese.', duration_minutes: 2, timer_label: null, requires_attention: true, tips: ['Work off the heat so the eggs don’t scramble'] },
      ],
      source_text: null,
    },
    current_step: 0,
    scaled_servings: null,
    checked_ingredients: [],
    cooking_started: false,
  },
  tools: [],
  context: [],
  forwardedProps: {},
  messages: [],
};
