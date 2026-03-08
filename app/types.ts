// TypeScript types matching the backend Python models (backend/src/models.py)

export interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  preparation: string | null;
  category: 'produce' | 'protein' | 'dairy' | 'pantry' | 'spice' | 'other';
  substitutes: string[];
}

export interface RecipeStep {
  step_number: number;
  instruction: string;
  duration_minutes: number | null;
  timer_label: string | null;
  requires_attention: boolean;
  tips: string[];
}

export interface Recipe {
  title: string;
  description: string | null;
  servings: number;
  original_servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string | null;
  dietary_tags: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
  source_text: string | null;
}

export interface RecipeContext {
  document_text: string | null;
  recipe: Recipe | null;
  current_step: number;
  scaled_servings: number | null;
  checked_ingredients: string[];
  cooking_started: boolean;
}

export interface UploadResponse {
  threadId: string;
  runId: string;
  state: RecipeContext;
  tools: any[];
  context: any[];
  forwardedProps: any;
  messages: any[];
}

// UI Component types
export type UIComponentType = 
  | 'recipe_card'
  | 'ingredient_checklist'
  | 'step_card'
  | 'timer_suggestion'
  | 'quick_actions'
  | 'shopping_list'
  | 'scaling_result'
  | 'substitution'
  | 'recovery_help'
  | 'pairing_suggestion';

export interface UIComponent {
  type: UIComponentType;
  data: Record<string, any>;
}

export interface TimerSuggestion {
  type: 'timer_suggestion';
  duration_seconds: number;
  label: string;
  step_number: number | null;
}

export interface QuickAction {
  label: string;
  action_id: string;
  icon: string | null;
}

export interface AgentResponse {
  message: string;
  components: UIComponent[];
  quick_actions: QuickAction[];
  state_hint: 'upload' | 'overview' | 'cooking' | 'finished';
}
