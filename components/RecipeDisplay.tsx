"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Checkbox,
  IconButton,
  Popover,
  TextField,
  Button,
  Tooltip,
} from "@mui/material";
import {
  AccessTime,
  Restaurant,
  Person,
  LocalDining,
  Remove,
  Add,
  SwapHoriz,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import type { Recipe } from "@/app/types";
import { substituteIngredient } from "@/utils/recipe";

export interface RecipeDisplayProps {
  recipe: Recipe;
  currentStep: number;
  checkedIngredients: string[];
  onIngredientCheck?: (ingredient: string) => void;
  onStepClick?: (stepIndex: number) => void;
  onServingsChange?: (targetServings: number) => void;
  onSubstitute?: (newRecipe: Recipe) => void;
  onToggleChat?: () => void;
}

export default function RecipeDisplay({
  recipe,
  currentStep,
  checkedIngredients,
  onIngredientCheck,
  onStepClick,
  onServingsChange,
  onSubstitute,
  onToggleChat,
}: RecipeDisplayProps) {
  const [substituteAnchor, setSubstituteAnchor] = useState<{
    el: HTMLElement;
    ingredientName: string;
  } | null>(null);
  const [substituteName, setSubstituteName] = useState("");
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  const difficultyColor = {
    easy: "success",
    medium: "warning",
    hard: "error",
  }[recipe.difficulty] as "success" | "warning" | "error";

  const progress =
    recipe.steps.length > 0 ? ((currentStep + 1) / recipe.steps.length) * 100 : 0;

  const handleSubstituteOpen = (e: React.MouseEvent<HTMLElement>, ingredientName: string) => {
    e.stopPropagation();
    setSubstituteAnchor({ el: e.currentTarget, ingredientName });
    setSubstituteName("");
  };

  const handleSubstituteClose = () => {
    setSubstituteAnchor(null);
    setSubstituteName("");
  };

  const handleSubstituteApply = () => {
    if (!substituteAnchor || !substituteName.trim() || !onSubstitute) return;
    const newRecipe = substituteIngredient(
      recipe,
      substituteAnchor.ingredientName,
      substituteName.trim()
    );
    onSubstitute(newRecipe);
    handleSubstituteClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card elevation={3}>
        <CardContent>
          {/* Header */}
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
                  {recipe.title}
                </Typography>

                {recipe.description && (
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {recipe.description}
                  </Typography>
                )}
              </Box>
              {onToggleChat && (
                <Tooltip title="Open AI Cooking Assistant">
                  <IconButton
                    sx={{
                      alignSelf: "flex-start",
                      backgroundColor: "transparent",
                      "&:hover": { backgroundColor: "transparent" },
                    }}
                    onClick={onToggleChat}
                    aria-label="Open AI Cooking Assistant"
                  >
                    <Image
                      src="/ai.png"
                      alt="AI Cooking Assistant"
                      width={100}
                      height={100}
                    />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Meta Info */}
            <Stack direction="row" spacing={2} mt={1} flexWrap="wrap" gap={1}>
              {totalTime > 0 && (
                <Chip
                  icon={<AccessTime />}
                  label={`${totalTime} min`}
                  variant="outlined"
                />
              )}
              {onServingsChange ? (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{
                    border: "1px solid",
                    borderColor: "primary.main",
                    borderRadius: 2,
                    p: 0.5,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() =>
                      onServingsChange(Math.max(1, recipe.servings - 1))
                    }
                    aria-label="Decrease servings"
                    sx={{ p: 0.25 }}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ minWidth: 24, textAlign: "center" }}
                  >
                    {recipe.servings} servings
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => onServingsChange(recipe.servings + 1)}
                    aria-label="Increase servings"
                    sx={{ p: 0.25 }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Stack>
              ) : (
                <Chip
                  icon={<Person />}
                  label={`${recipe.servings} servings`}
                  variant="outlined"
                />
              )}
              <Chip
                icon={<Restaurant />}
                label={recipe.difficulty}
                color={difficultyColor}
                variant="outlined"
              />
              {recipe.cuisine && (
                <Chip
                  icon={<LocalDining />}
                  label={recipe.cuisine}
                  variant="outlined"
                />
              )}
            </Stack>

            {/* Dietary Tags */}
            {recipe.dietary_tags.length > 0 && (
              <Box mt={2}>
                {recipe.dietary_tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
            )}
          </Box>

          {/* Progress Bar */}
          {currentStep >= 0 && recipe.steps.length > 0 && (
            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progress: Step {currentStep + 1} of {recipe.steps.length}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Ingredients */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Ingredients
            </Typography>
            <List dense>
              <AnimatePresence>
                {recipe.ingredients.map((ingredient, index) => {
                  const isChecked = checkedIngredients.includes(ingredient.name);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ListItem
                        dense
                        sx={{
                          textDecoration: isChecked ? "line-through" : "none",
                          opacity: isChecked ? 0.6 : 1,
                        }}
                      >
                        {onIngredientCheck && (
                          <Checkbox
                            edge="start"
                            checked={isChecked}
                            onChange={() => onIngredientCheck(ingredient.name)}
                            size="small"
                          />
                        )}
                        <ListItemText
                          primary={
                            <Typography variant="body1">
                              {ingredient.quantity} {ingredient.unit || ""}{" "}
                              {ingredient.name}
                              {ingredient.preparation &&
                                ` (${ingredient.preparation})`}
                            </Typography>
                          }
                        />
                        {onSubstitute && (
                          <IconButton
                            size="small"
                            onClick={(e) =>
                              handleSubstituteOpen(e, ingredient.name)
                            }
                            aria-label={`Substitute ${ingredient.name}`}
                            sx={{ ml: 0.5 }}
                          >
                            <SwapHoriz fontSize="small" />
                          </IconButton>
                        )}
                      </ListItem>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </List>
          </Box>

          <Popover
            open={!!substituteAnchor}
            anchorEl={substituteAnchor?.el}
            onClose={handleSubstituteClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <Box sx={{ p: 2, minWidth: 280 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Replace &quot;{substituteAnchor?.ingredientName}&quot; with:
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="e.g. almond milk"
                value={substituteName}
                onChange={(e) => setSubstituteName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSubstituteApply()
                }
                sx={{ mb: 1.5 }}
                autoFocus
              />
              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Button size="small" onClick={handleSubstituteClose}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSubstituteApply}
                  disabled={!substituteName.trim()}
                >
                  Apply
                </Button>
              </Stack>
            </Box>
          </Popover>

          {/* Steps */}
          <Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Instructions
            </Typography>
            <List>
              {recipe.steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ListItem
                    onClick={
                      onStepClick ? () => onStepClick(index) : undefined
                    }
                    sx={{
                      bgcolor:
                        index === currentStep ? "primary.50" : "transparent",
                      border: "1px solid",
                      borderLeft:
                        index === currentStep
                          ? "4px solid"
                          : "4px solid transparent",
                      borderColor: "primary.main",
                      mb: 2,
                      borderRadius: 1,
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                  >
                    <Box sx={{ mr: 2, minWidth: 32 }}>
                      <Chip
                        label={step.step_number}
                        size="small"
                        color={index === currentStep ? "primary" : "default"}
                      />
                    </Box>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          fontWeight={index === currentStep ? 600 : 400}
                        >
                          {step.instruction}
                          {step.duration_minutes != null && (
                            <Chip
                              size="small"
                              icon={<AccessTime />}
                              label={`${step.duration_minutes} min`}
                              sx={{ ml: 1 }}
                              variant="outlined"
                            />
                          )}
                        </Typography>
                      }
                      secondary={
                        step.tips.length > 0 ? (
                          <Box
                            component="span"
                            sx={{ display: "block", mt: 1 }}
                          >
                            {step.tips.map((tip, tipIndex) => (
                              <Typography
                                key={tipIndex}
                                variant="body2"
                                color="text.secondary"
                                component="span"
                                sx={{ display: "block", fontSize: "0.875rem" }}
                              >
                                💡 {tip}
                              </Typography>
                            ))}
                          </Box>
                        ) : null
                      }
                    />
                  </ListItem>
                </motion.div>
              ))}
            </List>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}
