"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type EditorIngredient = {
  tempId: string;
  ingredient_id?: string;
  name: string;
  quantity_per_person: number;
  unit: string;
  scaling_factor: number;
  aisle_id?: string;
};

type IngredientRowProps = {
  ingredient: EditorIngredient;
  onUpdate: (tempId: string, field: keyof EditorIngredient, value: string | number) => void;
  onRemove: (tempId: string) => void;
};

export function IngredientRow({
  ingredient,
  onUpdate,
  onRemove,
}: IngredientRowProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Quantity */}
      <Input
        type="number"
        value={ingredient.quantity_per_person || ""}
        onChange={(e) =>
          onUpdate(ingredient.tempId, "quantity_per_person", parseFloat(e.target.value) || 0)
        }
        placeholder="Qté"
        className="w-16 font-mono text-sm"
        min="0"
        step="0.1"
      />
      {/* Unit */}
      <Input
        value={ingredient.unit}
        onChange={(e) => onUpdate(ingredient.tempId, "unit", e.target.value)}
        placeholder="unité"
        className="w-20 text-sm"
      />
      {/* Name */}
      <Input
        value={ingredient.name}
        onChange={(e) => onUpdate(ingredient.tempId, "name", e.target.value)}
        placeholder="Ingrédient"
        className="flex-1 text-sm"
      />
      {/* Scaling factor */}
      <Input
        type="number"
        value={ingredient.scaling_factor}
        onChange={(e) =>
          onUpdate(ingredient.tempId, "scaling_factor", parseFloat(e.target.value) || 1)
        }
        title="Facteur d'échelle (1.0 = linéaire, 0.6 = sous-linéaire, 0.0 = fixe)"
        className="w-14 font-mono text-xs text-muted-foreground"
        min="0"
        max="2"
        step="0.1"
      />
      {/* Remove */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onRemove(ingredient.tempId)}
        aria-label="Supprimer"
      >
        <X />
      </Button>
    </div>
  );
}
