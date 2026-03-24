import Link from "next/link";
import { Clock, Users, UtensilsCrossed, Leaf, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import { formatSeasonRange } from "@/lib/format";
import type { RecipeCard } from "@/lib/recipes/queries";

type RecipeCardProps = {
  recipe: RecipeCard;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const seasonRange = formatSeasonRange(recipe.season_start ?? null, recipe.season_end ?? null);
  const seasonLabel = seasonRange ?? "Toute l'année";

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      {/* Image */}
      {recipe.image_url ? (
        <div className="aspect-square w-full overflow-hidden">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex aspect-square items-center justify-center bg-muted">
          <div className="flex flex-col items-center gap-2 text-subtle-foreground">
            <UtensilsCrossed className="size-8" />
          </div>
        </div>
      )}

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

        {/* Season + Nutrition pills */}
        {(seasonLabel || recipe.nutrition_score != null) && (
          <div className="flex flex-wrap gap-1.5">
            {seasonLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent-fg">
                <Leaf className="size-2.5 text-accent" />
                {seasonLabel}
              </span>
            )}
            {recipe.nutrition_score != null && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  recipe.nutrition_score >= 70
                    ? "border-[#4A5D4A]/30 bg-[#4A5D4A]/10 text-[#2D3A2D]"
                    : recipe.nutrition_score >= 40
                    ? "border-amber-400/30 bg-amber-50 text-amber-800"
                    : "border-red-300/30 bg-red-50 text-red-800"
                }`}
              >
                <Flame className="size-2.5" />
                {recipe.nutrition_score}/100
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
