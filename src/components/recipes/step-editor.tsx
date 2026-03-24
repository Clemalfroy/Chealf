"use client";

import { ArrowUp, ArrowDown, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EditorStep = {
  tempId: string;
  instruction: string;
  step_order: number;
  parallel_group?: number;
};

type StepEditorProps = {
  steps: EditorStep[];
  onAdd: () => void;
  onUpdate: (tempId: string, instruction: string) => void;
  onRemove: (tempId: string) => void;
  onMoveUp: (tempId: string) => void;
  onMoveDown: (tempId: string) => void;
  onToggleParallel: (tempId: string) => void;
};

export function StepEditor({
  steps,
  onAdd,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onToggleParallel,
}: StepEditorProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, idx) => {
        const isParallel = step.parallel_group !== undefined;
        const prevParallelGroup =
          idx > 0 ? steps[idx - 1].parallel_group : undefined;
        const showParallelLabel =
          isParallel && step.parallel_group !== prevParallelGroup;

        return (
          <div key={step.tempId}>
            {showParallelLabel && (
              <p className="mb-1 text-xs font-medium text-[#7A5530]">
                Vous pouvez faire en parallèle
              </p>
            )}
            <div className={cn("flex gap-2", isParallel && "pl-4")}>
              <span className="mt-2 min-w-[1.25rem] text-xs font-medium text-muted-foreground">
                {step.step_order}.
              </span>
              <textarea
                value={step.instruction}
                onChange={(e) => onUpdate(step.tempId, e.target.value)}
                placeholder="Décrivez cette étape..."
                rows={2}
                className="flex-1 resize-none rounded-md border border-border-strong bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-subtle-foreground focus:border-primary focus:ring-[3px] focus:ring-[var(--success-bg)]"
              />
              <div className="flex flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onMoveUp(step.tempId)}
                  disabled={idx === 0}
                  aria-label="Monter"
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onMoveDown(step.tempId)}
                  disabled={idx === steps.length - 1}
                  aria-label="Descendre"
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onRemove(step.tempId)}
                  aria-label="Supprimer"
                >
                  <X />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => onToggleParallel(step.tempId)}
                title={
                  isParallel ? "Rendre séquentiel" : "Marquer comme parallèle"
                }
                className={cn(
                  "self-center text-xs",
                  isParallel ? "text-[#7A5530]" : "text-muted-foreground"
                )}
              >
                ⟳
              </Button>
            </div>
          </div>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onAdd}
        className="text-muted-foreground"
      >
        <Plus className="mr-1" />
        Ajouter une étape
      </Button>
    </div>
  );
}
