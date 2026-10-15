"use client";

import { useEffect, useState } from "react";
import { loadDraft, saveDraft } from "@/lib/storage";
import type { LookBackDraft } from "./LookBackwards";

const KEY = "vcm-look-backwards";

interface IngredientCaptureProps {
  prompt: string;
  /** module slug recorded against each ingredient added here */
  source?: string;
}

/**
 * End-of-module invitation to add what the exercise revealed to the shared
 * ingredient list (the one started in Consider Your History).
 *
 * This is an invitation, not a requirement: there is no minimum, no counter,
 * and adding nothing here never blocks a client from completing the module.
 */
export default function IngredientCapture({
  prompt,
  source,
}: IngredientCaptureProps) {
  const [ingredients, setIngredients] = useState<string[] | null>(null);
  const [sources, setSources] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const lb = loadDraft<LookBackDraft>(KEY);
    const ing = lb?.ingredients ?? [];
    const src = lb?.sources ?? {};
    setIngredients(ing);
    setSources(src);
  }, []);

  if (ingredients === null) return null;

  function persist(nextIngredients: string[], nextSources: Record<string, string>) {
    setIngredients(nextIngredients);
    setSources(nextSources);
    const lb = loadDraft<LookBackDraft>(KEY) ?? {
      step: 1,
      entries: {},
      ingredients: [],
    };
    saveDraft(KEY, {
      ...lb,
      ingredients: nextIngredients,
      sources: nextSources,
    });
  }

  function add(raw: string) {
    const incoming = raw
      .split(/[,\n]/)
      .map((w) => w.trim().replace(/\s+/g, " "))
      .filter((w) => w.length > 0 && w.length <= 80);
    if (!incoming.length) return;
    const existing = new Set(ingredients!.map((w) => w.toLowerCase()));
    const merged = [...ingredients!];
    const nextSources = { ...sources };
    for (const w of incoming) {
      if (!existing.has(w.toLowerCase())) {
        merged.push(w);
        existing.add(w.toLowerCase());
        if (source) nextSources[w.toLowerCase()] = source;
      }
    }
    persist(merged, nextSources);
  }

  return (
    <div className="mt-10 rounded-xl border border-brass/60 bg-brass/5 p-6">
      <p className="text-xs uppercase tracking-wider text-brass">
        Add to Your Ingredients
      </p>
      <p className="mt-2 text-foreground/80">{prompt}</p>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem(
            "ingredient"
          ) as HTMLInputElement;
          add(input.value);
          input.value = "";
          input.focus();
        }}
      >
        <input
          name="ingredient"
          autoComplete="off"
          placeholder="A word or phrase that stood out (commas add several)"
          className="flex-1 rounded-md border border-navy/25 bg-paper px-4 py-2.5 text-sm outline-none focus:border-navy"
        />
        <button className="rounded-md bg-primary px-5 py-2.5 text-sm text-white hover:bg-navy-deep">
          Add
        </button>
      </form>

      <div className="mt-4 border-t border-brass/30 pt-4">
        <button
          onClick={() => setShowAll((o) => !o)}
          aria-expanded={showAll}
          className="flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy"
        >
          <span
            aria-hidden="true"
            className={`transition-transform ${showAll ? "rotate-90" : ""}`}
          >
            ▸
          </span>
          Your ingredients so far ({ingredients.length})
        </button>
        {showAll && (
          <div className="mt-3 flex flex-wrap gap-2">
            {ingredients.length ? (
              ingredients.map((w) => (
                <span
                  key={w}
                  className="rounded-full bg-paper px-3 py-1 text-sm text-navy"
                >
                  {w}
                </span>
              ))
            ) : (
              <p className="text-sm text-navy/50">
                Nothing yet. Add one above whenever something is worth keeping.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
