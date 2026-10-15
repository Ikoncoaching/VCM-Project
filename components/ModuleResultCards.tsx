"use client";

import { useEffect, useState } from "react";
import { loadDraft } from "@/lib/storage";
import { typeByNumber } from "@/lib/enneagram";

/**
 * Rich read-only views of two module results, for the Articulate page: the
 * Enneagram type in its own language, and the constellation drawn as the shape
 * the client actually made, with their category words on it.
 *
 * Both read the module's saved draft, so they always match the client's
 * current answers.
 */

interface EnneagramDraftShape {
  typeNumber?: number | null;
  level?: number | null;
}

interface Cat {
  id: string;
  name: string;
}
interface WordsDraftShape {
  shape?: "triangle" | "diamond" | "star" | null;
  central?: string;
  cats?: Cat[];
  positions?: Record<string, { x: number; y: number }>;
}

/** a 5-pointed star skips every other vertex; everything else joins in order */
function edgeOrder(count: number): number[] {
  return count === 5 ? [0, 2, 4, 1, 3] : [...Array(count).keys()];
}

/** fallback layout if a draft has no saved positions */
function presetPositions(cats: Cat[]): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {};
  cats.forEach((c, i) => {
    const angle = ((-90 + (360 / cats.length) * i) * Math.PI) / 180;
    pos[c.id] = {
      x: 50 + Math.cos(angle) * 34,
      y: 50 + Math.sin(angle) * 34,
    };
  });
  return pos;
}

export function EnneagramResult() {
  const [draft, setDraft] = useState<EnneagramDraftShape | null>(null);

  useEffect(() => {
    const read = () => setDraft(loadDraft<EnneagramDraftShape>("vcm-enneagram"));
    read();
    window.addEventListener("vcm-hydrated", read);
    return () => window.removeEventListener("vcm-hydrated", read);
  }, []);

  const t = draft?.typeNumber ? typeByNumber(draft.typeNumber) : undefined;
  if (!t) return null;

  const level =
    typeof draft?.level === "number"
      ? t.levels.find((l) => l.level === draft.level)
      : undefined;

  return (
    <div className="mt-6 rounded-xl border border-navy/15 bg-paper p-6">
      <p className="text-xs uppercase tracking-wider text-brass">Enneagram</p>
      <p className="mt-2 font-display text-2xl text-navy">
        Type {t.number}: {t.name}
      </p>

      <dl className="mt-4 space-y-3">
        {[
          ["Basic desire", t.desire],
          ["Basic fear", t.fear],
          ["Core need", t.need],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-wider text-navy/45">
              {label}
            </dt>
            <dd className="leading-relaxed text-foreground/85">{value}</dd>
          </div>
        ))}
      </dl>

      {t.summary?.length ? (
        <p className="mt-4 leading-relaxed text-foreground/80">
          {t.summary[0]}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-brass/40 bg-brass/5 p-4">
          <p className="text-xs uppercase tracking-wider text-brass">
            At your best
          </p>
          <p className="mt-1 leading-relaxed text-foreground/85">{t.peak}</p>
        </div>
        <div className="rounded-lg border border-navy/15 bg-mist/60 p-4">
          <p className="text-xs uppercase tracking-wider text-navy/45">
            Your edge
          </p>
          <p className="mt-1 leading-relaxed text-foreground/85">{t.edge}</p>
        </div>
      </div>

      {level ? (
        <p className="mt-4 text-sm leading-relaxed text-navy/70">
          <span className="font-medium text-navy">
            Level {level.level} ({level.group}):
          </span>{" "}
          {level.text}
        </p>
      ) : null}
    </div>
  );
}

export function WordsILikeResult() {
  const [draft, setDraft] = useState<WordsDraftShape | null>(null);

  useEffect(() => {
    const read = () => setDraft(loadDraft<WordsDraftShape>("vcm-words-i-like"));
    read();
    window.addEventListener("vcm-hydrated", read);
    return () => window.removeEventListener("vcm-hydrated", read);
  }, []);

  const cats = (draft?.cats ?? []).filter((c) => c?.name?.trim());
  if (!cats.length) return null;

  const positions =
    draft?.positions && cats.every((c) => draft.positions?.[c.id])
      ? draft.positions
      : presetPositions(cats);

  const order = edgeOrder(cats.length);
  const pts = order
    .map((i) => positions[cats[i]?.id])
    .filter(Boolean) as { x: number; y: number }[];

  return (
    <div className="mt-6 rounded-xl border border-navy/15 bg-paper p-6">
      <p className="text-xs uppercase tracking-wider text-brass">
        Words I Like
      </p>
      {draft?.shape ? (
        <p className="mt-1 text-sm text-navy/60">
          Your words made a {draft.shape}.
        </p>
      ) : null}

      <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-xl border border-navy/15 bg-mist/30">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {pts.length === cats.length && (
            <polygon
              points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="#2e5880"
              fillOpacity="0.15"
              fillRule="nonzero"
              stroke="#2e5880"
              strokeWidth="2.5"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {cats.map((c) => {
          const p = positions[c.id] ?? { x: 50, y: 20 };
          return (
            <div
              key={c.id}
              className="absolute max-w-40 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-navy/25 bg-paper px-3 py-1.5 text-center"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <p className="font-display text-base leading-tight text-navy">
                {c.name}
              </p>
            </div>
          );
        })}

        {draft?.central?.trim() ? (
          <div className="absolute left-1/2 top-1/2 max-w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brass bg-brass/10 px-5 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-brass">
              Central {draft.central.trim().includes(" ") ? "phrase" : "word"}
            </p>
            <p className="font-display text-lg leading-tight text-navy">
              {draft.central.trim()}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
