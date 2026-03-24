"use client";

import { useCallback, useEffect, useReducer, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SplitPane } from "@/components/layout/split-pane";
import {
  RecipeEditor,
  recipeEditorReducer,
  buildInitialState,
  useEditorMode,
} from "@/components/recipes/recipe-editor";
import { RecipeChatPanel } from "@/components/recipes/recipe-chat-panel";
import {
  saveRecipeAction,
  deleteRecipeAction,
  generateRecipeImageAction,
  setRecipeImagePromptAction,
} from "@/app/(app)/recipes/actions";
import type { DietaryTag, Aisle } from "@/db/schema";
import type { RecipeWithRelations } from "@/lib/recipes/queries";
import type { UIMessage } from "ai";

type RecipeWorkspaceProps = {
  initialRecipe?: RecipeWithRelations;
  dietaryTags: DietaryTag[];
  aisles: Aisle[];
  initialChatHistory?: UIMessage[];
};

export function RecipeWorkspace({
  initialRecipe,
  dietaryTags,
  aisles,
  initialChatHistory,
}: RecipeWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | undefined>();

  const [state, dispatch] = useReducer(
    recipeEditorReducer,
    undefined,
    () => buildInitialState(initialRecipe)
  );

  const [mode, setMode] = useEditorMode(initialRecipe ? "view" : "edit");

  // When the LLM calls createRecipe on /recipes/new, silently update the URL to
  // /recipes/[id] without triggering a Next.js navigation (which would unmount this
  // component and kill the ongoing stream).
  useEffect(() => {
    if (!initialRecipe && state.id) {
      window.history.replaceState(null, "", `/recipes/${state.id}`);
    }
  }, [state.id, initialRecipe]);

  const handleSave = useCallback(() => {
    setSaveError(undefined);
    startTransition(async () => {
      const formData = new FormData();
      formData.set(
        "recipe",
        JSON.stringify({
          id: state.id ?? undefined,
          title: state.title,
          servings: state.servings ?? undefined,
          prep_time: state.prep_time ?? undefined,
          season_start: state.season_start ?? undefined,
          season_end: state.season_end ?? undefined,
          nutrition_score: state.nutrition_score ?? undefined,
          nutrition_data: state.nutrition_data ?? undefined,
          ingredients: state.ingredients,
          steps: state.steps,
          dietary_tag_ids: state.dietary_tag_ids,
        })
      );
      const result = await saveRecipeAction(
        { success: false, error: "" },
        formData
      );
      if (result.success) {
        if (!state.id) {
          router.push(`/recipes/${result.data.id}`);
        } else {
          setMode("view");
        }
      } else {
        setSaveError(result.error);
      }
    });
  }, [state, router, setMode]);

  const handleCancel = useCallback(() => {
    setSaveError(undefined);
    if (initialRecipe) {
      dispatch({
        type: "LOAD_RECIPE",
        payload: buildInitialState(initialRecipe),
      });
    }
    setMode("view");
  }, [initialRecipe, setMode]);

  const handleDelete = useCallback(() => {
    if (!state.id) return;
    startTransition(async () => {
      await deleteRecipeAction(state.id!);
    });
  }, [state.id]);

  const handleStreamStart = useCallback(() => setMode("streaming"), [setMode]);
  const handleStreamEnd = useCallback(() => setMode("view"), [setMode]);

  // Image generation orchestration: when the AI tool dispatches SET_IMAGE_GENERATING,
  // fire the server action to actually call DALL-E and upload to Supabase Storage.
  const imageGenerationInFlight = useRef(false);
  useEffect(() => {
    if (
      state.image_status !== "generating" ||
      !state.recipe_image_id ||
      imageGenerationInFlight.current
    ) {
      return;
    }
    imageGenerationInFlight.current = true;
    const recipeImageId = state.recipe_image_id;
    generateRecipeImageAction(recipeImageId).then((result) => {
      imageGenerationInFlight.current = false;
      if (result.success) {
        dispatch({ type: "SET_IMAGE", payload: result.data.imageUrl });
      } else {
        dispatch({ type: "SET_IMAGE_ERROR" });
      }
    });
  }, [state.image_status, state.recipe_image_id]);

  const handleRegenerateImage = useCallback(() => {
    if (!state.image_prompt || !state.id) return;
    startTransition(async () => {
      const result = await setRecipeImagePromptAction(state.id!, state.image_prompt!);
      if (result.success) {
        dispatch({
          type: "SET_IMAGE_GENERATING",
          payload: { recipeImageId: result.data.recipeImageId, prompt: state.image_prompt! },
        });
      }
    });
  }, [state.image_prompt, state.id]);

  return (
    <SplitPane
      main={
        <RecipeEditor
          state={state}
          dispatch={dispatch}
          mode={mode}
          dietaryTags={dietaryTags}
          aisles={aisles}
          onEdit={() => setMode("edit")}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onRegenerateImage={handleRegenerateImage}
          isPending={isPending}
          saveError={saveError}
        />
      }
      chat={
        <RecipeChatPanel
          recipeState={state}
          dispatch={dispatch}
          onStreamStart={handleStreamStart}
          onStreamEnd={handleStreamEnd}
          initialMessages={initialChatHistory}
        />
      }
    />
  );
}
