import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import {
  getRecipeById,
  getAllDietaryTags,
  getAllAisles,
} from "@/lib/recipes/queries";
import { RecipeWorkspace } from "@/components/recipes/recipe-workspace";

type RecipeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { user } = await verifySession();
  const { id } = await params;

  const [recipe, dietaryTags, aisles] = await Promise.all([
    getRecipeById(id),
    getAllDietaryTags(),
    getAllAisles(),
  ]);

  if (!recipe || recipe.user_id !== user.id) {
    notFound();
  }

  return (
    <RecipeWorkspace
      initialRecipe={recipe}
      dietaryTags={dietaryTags}
      aisles={aisles}
    />
  );
}
