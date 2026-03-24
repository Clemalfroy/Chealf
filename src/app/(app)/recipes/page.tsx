import Link from "next/link";
import { Plus } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { getRecipesByUserId } from "@/lib/recipes/queries";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { buttonVariants } from "@/components/ui/button-variants";

export default async function RecipesPage() {
  const { user } = await verifySession();
  const recipes = await getRecipesByUserId(user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Mes recettes
        </h1>
        <Link href="/recipes/new" className={buttonVariants()}>
          <Plus className="mr-1.5" />
          Nouvelle recette
        </Link>
      </div>

      {/* Grid / Empty state */}
      {recipes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Vous n&apos;avez pas encore de recettes.
          </p>
          <Link href="/recipes/new" className={buttonVariants({ variant: "outline" })}>
            <Plus className="mr-1.5" />
            Créer ma première recette
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
