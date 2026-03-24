import { verifySession } from "@/lib/dal";
import { getAllDietaryTags, getAllAisles } from "@/lib/recipes/queries";
import { RecipeWorkspace } from "@/components/recipes/recipe-workspace";

export default async function NewRecipePage() {
  await verifySession();
  const [dietaryTags, aisles] = await Promise.all([
    getAllDietaryTags(),
    getAllAisles(),
  ]);

  return <RecipeWorkspace dietaryTags={dietaryTags} aisles={aisles} />;
}
