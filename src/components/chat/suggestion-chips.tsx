"use client";

import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  type ChatContext,
  type SuggestionChipKey,
  SUGGESTION_CHIPS,
} from "@/lib/chat/suggestion-chips";

type SuggestionChipsProps = {
  context: ChatContext;
  onChipClick: (text: string) => void;
  className?: string;
};

function SuggestionChips({ context, onChipClick, className }: SuggestionChipsProps) {
  const keys: SuggestionChipKey[] = SUGGESTION_CHIPS[context];

  if (keys.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5 px-3 pb-2", className)}>
      {keys.map((key) => {
        const label = t("suggestion_chips", key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChipClick(label)}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export { SuggestionChips };
