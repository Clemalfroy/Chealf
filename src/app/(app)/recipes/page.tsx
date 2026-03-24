import Link from "next/link";
import { ChefHat, Plus } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { getRecipesByUserId } from "@/lib/recipes/queries";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n";

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
        <EmptyState
          icon={ChefHat}
          headline={t("empty_state", "recipes_headline")}
          description={t("empty_state", "recipes_description")}
          action={
            <Link href="/recipes/new" className={buttonVariants()}>
              <Plus className="mr-1.5" />
              {t("empty_state", "recipes_cta")}
            </Link>
          }
        />
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
