import Link from "next/link";
import { Clock, Users, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import type { RecipeCard } from "@/lib/recipes/queries";

type RecipeCardProps = {
  recipe: RecipeCard;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      {/* Image placeholder */}
      <div className="flex aspect-[4/3] items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-2 text-subtle-foreground">
          <UtensilsCrossed className="size-8" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title */}
        <h2 className="font-display text-base font-semibold leading-snug text-foreground group-hover:text-primary">
          {recipe.title}
        </h2>

        {/* Metadata */}
        {(recipe.servings || recipe.prep_time) && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                <span className="font-mono">{recipe.servings}</span>
                <span>pers.</span>
              </span>
            )}
            {recipe.prep_time && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                <span className="font-mono">{recipe.prep_time}</span>
                <span>min</span>
              </span>
            )}
          </div>
        )}

        {/* Dietary tags */}
        {recipe.recipeDietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.recipeDietaryTags.map((rdt) => (
              <Badge key={rdt.dietaryTag.id} variant="success">
                {t("dietary_tags", rdt.dietaryTag.slug as Parameters<typeof t>[1])}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
