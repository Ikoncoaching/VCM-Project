"use client";

import { useEffect, useState } from "react";
import { loadDraft } from "@/lib/storage";
import type { LookBackDraft } from "./LookBackwards";

/** Read-only chips of the ingredients harvested in Look backwards,
 *  shown wherever members put the whole thing together. */
export default function IngredientsPanel({ note }: { note?: string }) {
  const [ingredients, setIngredients] = useState<string[]>([]);

  useEffect(() => {
    const lb = loadDraft<LookBackDraft>("vcm-look-backwards");
    if (lb?.ingredients?.length) setIngredients(lb.ingredients);
  }, []);

  if (!ingredients.length) return null;

  return (
    <div className="mt-6 rounded-xl border border-navy/15 bg-mist/50 p-5">
      <p className="text-xs uppercase tracking-wider text-brass">
        Your ingredients from Consider Your History
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ingredients.map((w) => (
          <span
            key={w}
            className="rounded-full bg-paper px-3 py-1 text-sm text-navy"
          >
            {w}
          </span>
        ))}
      </div>
      {note && <p className="mt-3 text-sm text-navy/60">{note}</p>}
    </div>
  );
}
