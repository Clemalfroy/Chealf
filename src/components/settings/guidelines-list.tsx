"use client";

import { useState, useTransition } from "react";
import { Trash2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createGuidelineAction,
  updateGuidelineAction,
  deleteGuidelineAction,
} from "@/app/(app)/settings/actions";
import type { UserGuideline } from "@/db/schema/user-guidelines";

type GuidelinesListProps = {
  guidelines: UserGuideline[];
};

export function GuidelinesList({ guidelines }: GuidelinesListProps) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing(g: UserGuideline) {
    setEditingId(g.id);
    setEditingContent(g.content);
  }

  function handleSaveEdit() {
    if (!editingId) return;
    setError(null);
    startTransition(async () => {
      const result = await updateGuidelineAction(editingId, editingContent);
      if (result.success) {
        setEditingId(null);
      } else {
        setError(result.error);
      }
    });
  }

  function handleCreate() {
    if (!newContent.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createGuidelineAction(newContent.trim());
      if (result.success) {
        setNewContent("");
        setIsCreating(false);
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteGuidelineAction(id);
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {guidelines.map((g) =>
        editingId === g.id ? (
          <div key={g.id} className="space-y-2">
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              autoFocus
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" disabled={pending || !editingContent.trim()} onClick={handleSaveEdit}>
                <Check className="mr-1.5 size-3.5" />
                Sauvegarder
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                <X className="mr-1.5 size-3.5" />
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div
            key={g.id}
            className="group flex items-start justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5"
          >
            <p
              className="flex-1 text-sm text-foreground cursor-text line-clamp-3"
              onClick={() => startEditing(g)}
            >
              {g.content}
            </p>
            <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                disabled={pending}
                onClick={() => handleDelete(g.id)}
                aria-label="Supprimer"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        )
      )}

      {guidelines.length === 0 && !isCreating && (
        <p className="text-sm text-muted-foreground py-1">Aucune guideline définie.</p>
      )}

      {isCreating ? (
        <div className="space-y-2">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            autoFocus
            placeholder="Ex: Je suis allergique aux crustacés. Cuisine méditerranéenne, pas de recettes > 45 min."
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={pending || !newContent.trim()} onClick={handleCreate}>
              <Check className="mr-1.5 size-3.5" />
              Créer
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setIsCreating(false); setNewContent(""); }}>
              <X className="mr-1.5 size-3.5" />
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="mr-1.5 size-4" />
          Ajouter une guideline
        </Button>
      )}
    </div>
  );
}
