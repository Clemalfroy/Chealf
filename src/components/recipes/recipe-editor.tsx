"use client";

import { useReducer, useState, useEffect } from "react";
import { Clock, Users, Edit2, Trash2, Plus, ImageIcon, Minus } from "lucide-react";
import { formatQuantity } from "@/lib/format";
import { scaleQuantity } from "@/lib/scaling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IngredientRow, type EditorIngredient } from "./ingredient-row";
import { StepEditor, type EditorStep } from "./step-editor";
import { TagSelector } from "./tag-selector";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { DietaryTag, Aisle } from "@/db/schema";
import type { RecipeWithRelations } from "@/lib/recipes/queries";

// ─── State ────────────────────────────────────────────────────────────────────

export type RecipeEditorState = {
  id: string | null;
  title: string;
  servings: number | null;
  prep_time: number | null;
  ingredients: EditorIngredient[];
  steps: EditorStep[];
  dietary_tag_ids: string[];
  isDirty: boolean;
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

export type RecipeEditorAction =
  | { type: "SET_ID"; payload: string }
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_SERVINGS"; payload: number | null }
  | { type: "SET_PREP_TIME"; payload: number | null }
  | { type: "ADD_INGREDIENT"; payload: EditorIngredient }
  | { type: "UPDATE_INGREDIENT"; tempId: string; field: keyof EditorIngredient; value: string | number }
  | { type: "REMOVE_INGREDIENT"; tempId: string }
  | { type: "ADD_STEP" }
  | { type: "UPDATE_STEP"; tempId: string; instruction: string }
  | { type: "REMOVE_STEP"; tempId: string }
  | { type: "REORDER_STEP"; tempId: string; direction: "up" | "down" }
  | { type: "TOGGLE_PARALLEL"; tempId: string }
  | { type: "SET_STEPS"; payload: EditorStep[] }
  | { type: "TOGGLE_TAG"; tagId: string }
  | { type: "SET_TAGS"; payload: string[] }
  | { type: "LOAD_RECIPE"; payload: RecipeEditorState };

// Keep legacy alias for backwards-compat with reducer tests
type Action = RecipeEditorAction;

let nextTempId = 1;
export function genTempId() {
  return `tmp-${nextTempId++}`;
}

function recalcStepOrders(steps: EditorStep[]): EditorStep[] {
  return steps.map((s, i) => ({ ...s, step_order: i + 1 }));
}

export function recipeEditorReducer(
  state: RecipeEditorState,
  action: Action
): RecipeEditorState {
  switch (action.type) {
    case "SET_ID":
      return { ...state, id: action.payload };

    case "SET_TITLE":
      return { ...state, title: action.payload, isDirty: true };

    case "SET_SERVINGS":
      return { ...state, servings: action.payload, isDirty: true };

    case "SET_PREP_TIME":
      return { ...state, prep_time: action.payload, isDirty: true };

    case "ADD_INGREDIENT":
      return {
        ...state,
        ingredients: [...state.ingredients, action.payload],
        isDirty: true,
      };

    case "UPDATE_INGREDIENT":
      return {
        ...state,
        ingredients: state.ingredients.map((ing) =>
          ing.tempId === action.tempId
            ? { ...ing, [action.field]: action.value }
            : ing
        ),
        isDirty: true,
      };

    case "REMOVE_INGREDIENT":
      return {
        ...state,
        ingredients: state.ingredients.filter(
          (ing) => ing.tempId !== action.tempId
        ),
        isDirty: true,
      };

    case "ADD_STEP": {
      const newStep: EditorStep = {
        tempId: genTempId(),
        instruction: "",
        step_order: state.steps.length + 1,
      };
      return { ...state, steps: [...state.steps, newStep], isDirty: true };
    }

    case "UPDATE_STEP":
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.tempId === action.tempId
            ? { ...s, instruction: action.instruction }
            : s
        ),
        isDirty: true,
      };

    case "REMOVE_STEP":
      return {
        ...state,
        steps: recalcStepOrders(
          state.steps.filter((s) => s.tempId !== action.tempId)
        ),
        isDirty: true,
      };

    case "REORDER_STEP": {
      const idx = state.steps.findIndex((s) => s.tempId === action.tempId);
      if (idx < 0) return state;
      const newSteps = [...state.steps];
      const swapIdx = action.direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= newSteps.length) return state;
      [newSteps[idx], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[idx]];
      return { ...state, steps: recalcStepOrders(newSteps), isDirty: true };
    }

    case "TOGGLE_PARALLEL": {
      const step = state.steps.find((s) => s.tempId === action.tempId);
      if (!step) return state;
      const maxGroup = Math.max(
        0,
        ...state.steps
          .map((s) => s.parallel_group ?? 0)
          .filter((g) => g > 0)
      );
      const newGroup =
        step.parallel_group !== undefined ? undefined : maxGroup + 1;
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.tempId === action.tempId
            ? { ...s, parallel_group: newGroup }
            : s
        ),
        isDirty: true,
      };
    }

    case "SET_STEPS":
      return { ...state, steps: action.payload, isDirty: true };

    case "TOGGLE_TAG":
      return {
        ...state,
        dietary_tag_ids: state.dietary_tag_ids.includes(action.tagId)
          ? state.dietary_tag_ids.filter((id) => id !== action.tagId)
          : [...state.dietary_tag_ids, action.tagId],
        isDirty: true,
      };

    case "SET_TAGS":
      return { ...state, dietary_tag_ids: action.payload, isDirty: true };

    case "LOAD_RECIPE":
      return { ...action.payload, isDirty: false };

    default:
      return state;
  }
}

// ─── Initial state builders ───────────────────────────────────────────────────

export function buildInitialState(recipe?: RecipeWithRelations): RecipeEditorState {
  if (!recipe) {
    return {
      id: null,
      title: "",
      servings: null,
      prep_time: null,
      ingredients: [],
      steps: [],
      dietary_tag_ids: [],
      isDirty: false,
    };
  }
  return {
    id: recipe.id,
    title: recipe.title,
    servings: recipe.servings ?? null,
    prep_time: recipe.prep_time ?? null,
    ingredients: recipe.recipeIngredients.map((ri) => ({
      tempId: genTempId(),
      ingredient_id: ri.ingredient_id,
      name: ri.ingredient.name,
      quantity_per_person: ri.quantity_per_person,
      unit: ri.unit,
      scaling_factor: ri.scaling_factor,
      aisle_id: ri.ingredient.aisle_id ?? undefined,
    })),
    steps: recipe.recipeSteps.map((s) => ({
      tempId: genTempId(),
      instruction: s.instruction,
      step_order: s.step_order,
      parallel_group: s.parallel_group ?? undefined,
    })),
    dietary_tag_ids: recipe.recipeDietaryTags.map((rdt) => rdt.dietary_tag_id),
    isDirty: false,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export type RecipeEditorMode = "view" | "edit" | "streaming";

type RecipeEditorProps = {
  state: RecipeEditorState;
  dispatch: React.Dispatch<RecipeEditorAction>;
  mode: RecipeEditorMode;
  dietaryTags: DietaryTag[];
  aisles: Aisle[];
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  isPending?: boolean;
  saveError?: string;
};

export function RecipeEditor({
  state,
  dispatch,
  mode,
  dietaryTags,
  aisles: _aisles,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  isPending = false,
  saveError,
}: RecipeEditorProps) {
  const isEditing = mode === "edit";
  const isStreaming = mode === "streaming";
  // In streaming mode: read-only with fade-in animation on updated fields
  const isReadOnly = !isEditing;

  // Display-only servings for quantity preview (not saved to DB)
  const [displayServings, setDisplayServings] = useState(state.servings ?? 1);
  useEffect(() => {
    if (state.servings !== null && state.servings !== undefined) {
      setDisplayServings(state.servings);
    }
  }, [state.servings]);

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {saveError && (
        <div
          role="alert"
          className="rounded-md border border-l-[3px] border-[#E8B8B8] border-l-[#B54545] bg-[#FDE8E8] px-4 py-3 text-sm font-medium text-[#8A2E2E]"
        >
          {saveError}
        </div>
      )}

      {/* Image placeholder */}
      <div className="flex aspect-[4/3] max-h-64 w-full items-center justify-center rounded-xl bg-muted">
        <div className="flex flex-col items-center gap-2 text-subtle-foreground">
          <ImageIcon className="size-8" />
          <span className="text-xs">Image générée par l&apos;IA</span>
        </div>
      </div>

      {/* Title */}
      {isEditing ? (
        <Input
          value={state.title}
          onChange={(e) =>
            dispatch({ type: "SET_TITLE", payload: e.target.value })
          }
          placeholder="Titre de la recette"
          className="font-display text-2xl font-bold h-auto border-none px-0 text-foreground placeholder:text-subtle-foreground focus-visible:ring-0 focus-visible:border-none"
        />
      ) : (
        <h1
          className={cn(
            "font-display text-2xl font-bold text-foreground",
            isStreaming && "animate-[fadeInUp_300ms_ease-out]"
          )}
        >
          {state.title || (
            <span className="text-subtle-foreground">Sans titre</span>
          )}
        </h1>
      )}

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {isEditing ? (
          <>
            <label className="flex items-center gap-1.5">
              <Users className="size-4" />
              <Input
                type="number"
                value={state.servings ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_SERVINGS",
                    payload: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="pers."
                className="h-7 w-16 font-mono text-sm"
                min="1"
                max="50"
              />
            </label>
            <label className="flex items-center gap-1.5">
              <Clock className="size-4" />
              <Input
                type="number"
                value={state.prep_time ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_PREP_TIME",
                    payload: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="min"
                className="h-7 w-20 font-mono text-sm"
                min="1"
                max="1440"
              />
              <span className="text-xs">min</span>
            </label>
          </>
        ) : (
          <>
            {state.servings && (
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  isStreaming && "animate-[fadeInUp_300ms_ease-out]"
                )}
              >
                <Users className="size-4" />
                <button
                  type="button"
                  onClick={() => setDisplayServings((n) => Math.max(1, n - 1))}
                  className="flex size-5 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted"
                  aria-label="Diminuer le nombre de personnes"
                >
                  <Minus className="size-3" />
                </button>
                <span className="min-w-[1.5ch] text-center font-mono text-foreground">
                  {displayServings}
                </span>
                <button
                  type="button"
                  onClick={() => setDisplayServings((n) => Math.min(50, n + 1))}
                  className="flex size-5 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted"
                  aria-label="Augmenter le nombre de personnes"
                >
                  <Plus className="size-3" />
                </button>
                <span>pers.</span>
              </span>
            )}
            {state.prep_time && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  isStreaming && "animate-[fadeInUp_300ms_ease-out]"
                )}
              >
                <Clock className="size-4" />
                <span className="font-mono">{state.prep_time}</span>
                <span>min</span>
              </span>
            )}
          </>
        )}
      </div>

      {/* Dietary tags */}
      <div>
        {isEditing ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Régimes alimentaires
            </p>
            <TagSelector
              dietaryTags={dietaryTags}
              selectedIds={state.dietary_tag_ids}
              onToggle={(tagId) =>
                dispatch({ type: "TOGGLE_TAG", tagId })
              }
            />
          </div>
        ) : state.dietary_tag_ids.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {dietaryTags
              .filter((tag) => state.dietary_tag_ids.includes(tag.id))
              .map((tag) => (
                <Badge key={tag.id} variant="success">
                  {t("dietary_tags", tag.slug as Parameters<typeof t>[1])}
                </Badge>
              ))}
          </div>
        ) : null}
      </div>

      {/* Ingredients */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Ingrédients
        </h2>
        {state.ingredients.length === 0 && isReadOnly && (
          <p className="text-sm text-subtle-foreground">Aucun ingrédient</p>
        )}
        {isEditing ? (
          state.ingredients.map((ing) => (
            <IngredientRow
              key={ing.tempId}
              ingredient={ing}
              onUpdate={(tempId, field, value) =>
                dispatch({ type: "UPDATE_INGREDIENT", tempId, field, value })
              }
              onRemove={(tempId) =>
                dispatch({ type: "REMOVE_INGREDIENT", tempId })
              }
            />
          ))
        ) : (
          <div className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
            {state.ingredients.map((ing) => (
              <div
                key={ing.tempId}
                className={cn(
                  "flex items-baseline gap-2 text-sm",
                  isStreaming && "animate-[fadeInUp_300ms_ease-out]"
                )}
              >
                <span className="font-mono text-foreground">
                  {formatQuantity(
                    scaleQuantity(
                      ing.quantity_per_person,
                      state.servings ?? 1,
                      displayServings,
                      ing.scaling_factor
                    )
                  )}
                </span>
                <span className="text-muted-foreground">{ing.unit}</span>
                <span className="text-foreground">{ing.name}</span>
              </div>
            ))}
          </div>
        )}
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              dispatch({
                type: "ADD_INGREDIENT",
                payload: {
                  tempId: genTempId(),
                  name: "",
                  quantity_per_person: 0,
                  unit: "",
                  scaling_factor: 1.0,
                },
              })
            }
            className="text-muted-foreground"
          >
            <Plus className="mr-1" />
            Ajouter un ingrédient
          </Button>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Étapes
        </h2>
        {state.steps.length === 0 && isReadOnly && (
          <p className="text-sm text-subtle-foreground">Aucune étape</p>
        )}
        {isEditing ? (
          <StepEditor
            steps={state.steps}
            onAdd={() => dispatch({ type: "ADD_STEP" })}
            onUpdate={(tempId, instruction) =>
              dispatch({ type: "UPDATE_STEP", tempId, instruction })
            }
            onRemove={(tempId) =>
              dispatch({ type: "REMOVE_STEP", tempId })
            }
            onMoveUp={(tempId) =>
              dispatch({ type: "REORDER_STEP", tempId, direction: "up" })
            }
            onMoveDown={(tempId) =>
              dispatch({ type: "REORDER_STEP", tempId, direction: "down" })
            }
            onToggleParallel={(tempId) =>
              dispatch({ type: "TOGGLE_PARALLEL", tempId })
            }
          />
        ) : (
          <div className="relative border-l-2 border-border pl-5 space-y-4">
            {state.steps.map((step, idx) => {
              const prevStep = idx > 0 ? state.steps[idx - 1] : undefined;
              const nextStep = idx < state.steps.length - 1 ? state.steps[idx + 1] : undefined;
              const isParallel = step.parallel_group !== undefined;
              const forkStart =
                isParallel && step.parallel_group !== prevStep?.parallel_group;
              const forkEnd =
                isParallel && step.parallel_group !== nextStep?.parallel_group;

              return (
                <div
                  key={step.tempId}
                  className={cn(
                    isStreaming && "animate-[fadeInUp_300ms_ease-out]"
                  )}
                >
                  {/* Sequential step — dot on main timeline */}
                  {!isParallel && (
                    <div className="relative flex gap-3 text-sm">
                      <div className="absolute -left-[calc(1.25rem+5px)] top-1.5 size-1.5 rounded-full bg-border" />
                      <span className="min-w-[1.25rem] font-mono text-xs font-medium text-muted-foreground shrink-0">
                        {step.step_order}.
                      </span>
                      <p className="text-foreground">{step.instruction}</p>
                    </div>
                  )}

                  {/* Parallel step — badge above, then dashed indent */}
                  {isParallel && (
                    <>
                      {forkStart && (
                        <div className="mb-2">
                          <Badge variant="accent" className="text-[10px] py-0">
                            Vous pouvez faire en parallèle
                          </Badge>
                        </div>
                      )}
                      <div className="ml-3 border-l-2 border-dashed border-accent-light pl-4 pt-1">
                        <div className="flex gap-3 text-sm">
                          <span className="min-w-[1.25rem] font-mono text-xs font-medium text-muted-foreground shrink-0">
                            {step.step_order}.
                          </span>
                          <p className="text-foreground/80">{step.instruction}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {forkEnd && <div className="mt-1" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {isEditing ? (
          <>
            <Button
              type="button"
              onClick={onSave}
              disabled={isPending || !state.title.trim()}
            >
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
            {state.id && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Annuler
              </Button>
            )}
          </>
        ) : isStreaming ? null : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onEdit}
            >
              <Edit2 className="mr-1.5" />
              Modifier
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isPending}
            >
              <Trash2 className="mr-1.5" />
              Supprimer
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Simple mode reducer hook (kept for RecipeWorkspace) ──────────────────────

export function useEditorMode(initial: RecipeEditorMode) {
  return useReducer(
    (_: RecipeEditorMode, next: RecipeEditorMode) => next,
    initial
  );
}
