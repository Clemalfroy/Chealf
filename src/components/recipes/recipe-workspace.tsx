"use client";

import { useCallback, useReducer, useState, useTransition } from "react";
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
} from "@/app/(app)/recipes/actions";
import type { DietaryTag, Aisle } from "@/db/schema";
import type { RecipeWithRelations } from "@/lib/recipes/queries";

type RecipeWorkspaceProps = {
  initialRecipe?: RecipeWithRelations;
  dietaryTags: DietaryTag[];
  aisles: Aisle[];
};

export function RecipeWorkspace({
  initialRecipe,
  dietaryTags,
  aisles,
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
        />
      }
    />
  );
}
