"use client";

import { useState, useTransition } from "react";
import { Trash2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteMemoryFactAction } from "@/app/(app)/settings/actions";
import type { AiMemoryFact } from "@/db/schema/ai-memory-facts";

const CATEGORY_LABELS: Record<string, string> = {
  allergy: "Allergie",
  preference: "Préférence",
  household: "Foyer",
  lifestyle: "Mode de vie",
  diet: "Régime",
  equipment: "Équipement",
  habit: "Habitude",
};

type MemoryFactsListProps = {
  facts: AiMemoryFact[];
};

export function MemoryFactsList({ facts }: MemoryFactsListProps) {
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      await deleteMemoryFactAction(id);
      setDeletingId(null);
    });
  }

  if (facts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Brain className="size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Aucun souvenir pour l&apos;instant. L&apos;IA mémorisera tes préférences au fil des conversations.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {facts.map((fact) => (
        <li key={fact.id} className="flex items-start justify-between gap-3 py-3">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm text-foreground">{fact.content}</p>
            {fact.category && (
              <Badge variant="default" className="self-start text-[10px] py-0">
                {CATEGORY_LABELS[fact.category] ?? fact.category}
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            disabled={pending && deletingId === fact.id}
            onClick={() => handleDelete(fact.id)}
            aria-label="Supprimer ce souvenir"
          >
            <Trash2 className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
