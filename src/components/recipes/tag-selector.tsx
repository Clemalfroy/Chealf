"use client";

import type { DietaryTag } from "@/db/schema";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type TagSelectorProps = {
  dietaryTags: DietaryTag[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
};

export function TagSelector({
  dietaryTags,
  selectedIds,
  onToggle,
}: TagSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {dietaryTags.map((tag) => {
        const selected = selectedIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag.id)}
            className={cn(
              "inline-flex items-center rounded-sm border px-2 py-1 text-xs font-semibold transition-colors",
              selected
                ? "border-[#C2D4C2] bg-[#E8F0E8] text-[#2D3A2D]"
                : "border-border bg-card text-muted-foreground hover:border-[#C2D4C2] hover:bg-[#E8F0E8] hover:text-[#2D3A2D]"
            )}
          >
            {t("dietary_tags", tag.slug as Parameters<typeof t>[1])}
          </button>
        );
      })}
    </div>
  );
}
