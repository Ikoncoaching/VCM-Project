"use client";

import RichTextArea from "./RichTextArea";
import { plainText } from "@/lib/richtext";

import { useEffect, useRef, useState } from "react";
import { moduleBySlug } from "@/lib/modules";
import { loadDraft, saveDraft } from "@/lib/storage";
import ModuleGate from "./ModuleGate";
import ModuleHeader from "./ModuleHeader";
import VideoSlot from "./VideoSlot";
import CompleteBar from "./CompleteBar";
import IngredientCapture from "./IngredientCapture";
import Skeleton from "@/components/Skeleton";

const DRAFT_KEY = "vcm-words-i-like";

type Shape = "triangle" | "diamond" | "star";

interface Cat {
  id: string;
  name: string;
  words: string[];
}

interface Draft {
  step: number;
  words: string[];
  cats: Cat[];
  shape: Shape | null;
  positions: Record<string, { x: number; y: number }>;
  central: string;
  story: string;
}

const STEPS = ["Discover & Organize", "Name & Central word", "Your story"];

/** The exercise is taught across three videos. Each part covers a run of the
 *  interactive sub-steps below and shows its own walkthrough at the top. */
const PARTS = [
  {
    label: "Part 1 of 3",
    title: "Getting started: Discover & Organize",
    videoSrc: "/videos/words-i-like-1.mp4" as string | undefined,
    covers: [1],
  },
  {
    label: "Part 2 of 3",
    title: "Shaping it: Name & Central Word",
    videoSrc: "/videos/words-i-like-2.mp4" as string | undefined,
    covers: [2],
  },
  {
    label: "Part 3 of 3",
    title: "Your story",
    videoSrc: "/videos/words-i-like-3.mp4" as string | undefined,
    covers: [3],
  },
];

function freshDraft(): Draft {
  return {
    step: 1,
    words: [],
    cats: [
      { id: "c1", name: "", words: [] },
      { id: "c2", name: "", words: [] },
      { id: "c3", name: "", words: [] },
    ],
    shape: null,
    positions: {},
    central: "",
    story: "",
  };
}

/** the shape is determined by how many categories you have */
function shapeFor(count: number): Shape {
  return count === 3 ? "triangle" : count === 4 ? "diamond" : "star";
}

/** vertex order for drawing edges; a 5-pointed star skips every other vertex */
function edgeOrder(count: number): number[] {
  return count === 5 ? [0, 2, 4, 1, 3] : [...Array(count).keys()];
}

function presetPositions(cats: Cat[]): Draft["positions"] {
  const pos: Draft["positions"] = {};
  cats.forEach((c, i) => {
    const angle = ((-90 + (360 / cats.length) * i) * Math.PI) / 180;
    pos[c.id] = {
      x: Math.round(50 + 36 * Math.cos(angle)),
      y: Math.round(50 + 33 * Math.sin(angle)),
    };
  });
  return pos;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Coerce a loaded draft into a valid shape so a partial or malformed
 *  saved draft can never crash the module (e.g. a category missing its
 *  words array). */
function normalizeDraft(loaded: Partial<Draft> | null): Draft {
  const base = freshDraft();
  if (!loaded) return base;
  const cats = Array.isArray(loaded.cats)
    ? loaded.cats
        .filter((c): c is Cat => !!c && typeof c.id === "string")
        .map((c) => ({
          id: c.id,
          name: typeof c.name === "string" ? c.name : "",
          words: Array.isArray(c.words) ? c.words : [],
        }))
    : base.cats;
  // the Constellation step was removed, so clamp any older saved step
  // (which had 6 steps) into the current range to avoid a blank screen
  const step = Math.min(
    Math.max(typeof loaded.step === "number" ? loaded.step : 1, 1),
    STEPS.length
  );
  return {
    ...base,
    ...loaded,
    step,
    words: Array.isArray(loaded.words) ? loaded.words : [],
    cats,
    positions:
      loaded.positions && typeof loaded.positions === "object"
        ? loaded.positions
        : {},
    central: typeof loaded.central === "string" ? loaded.central : "",
    story: typeof loaded.story === "string" ? loaded.story : "",
  };
}

export default function WordsILike() {
  const m = moduleBySlug("words-i-like")!;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [dragOverCat, setDragOverCat] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(normalizeDraft(loadDraft<Partial<Draft>>(DRAFT_KEY)));
  }, []);

  useEffect(() => {
    if (draft) saveDraft(DRAFT_KEY, draft);
  }, [draft]);

  if (!draft) {
    return <div className="mx-auto max-w-3xl px-6 py-16"><Skeleton /></div>;
  }

  const update = (patch: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));

  const placed = new Set(draft.cats.flatMap((c) => c.words));
  const nonEmptyCats = draft.cats.filter((c) => c.words.length > 0);

  const canContinue: Record<number, boolean> = {
    // step 1 merges Discover + Organize
    1: draft.words.length >= 50 && nonEmptyCats.length >= 3,
    // step 2 merges Name + Central word
    2:
      draft.cats.every((c) => c.name.trim().length > 0) &&
      draft.central.trim().length > 0,
  };

  function goTo(step: number) {
    update({ step });
    window.scrollTo({ top: 0 });
  }

  function continueFromStep1() {
    // drop empty groups so naming and the constellation only see real ones,
    // then lay out the constellation shape shown on the next step
    const d = draft!;
    const kept = d.cats.filter((c) => c.words.length > 0);
    const needsPreset = kept.some((c) => !d.positions[c.id]);
    update({
      cats: kept,
      shape: shapeFor(kept.length),
      positions: needsPreset ? presetPositions(kept) : d.positions,
      step: 2,
    });
    window.scrollTo({ top: 0 });
  }

  function addWords(raw: string) {
    const incoming = raw
      .split(/[,\n]/)
      .map((w) => w.trim())
      .filter(Boolean);
    if (!incoming.length) return;
    const existing = new Set(draft!.words.map((w) => w.toLowerCase()));
    const merged = [...draft!.words];
    for (const w of incoming) {
      if (!existing.has(w.toLowerCase())) {
        merged.push(w);
        existing.add(w.toLowerCase());
      }
    }
    update({ words: merged });
  }

  function removeWord(word: string) {
    update({
      words: draft!.words.filter((w) => w !== word),
      cats: draft!.cats.map((c) => ({
        ...c,
        words: c.words.filter((w) => w !== word),
      })),
    });
  }

  /** Add a word to one group, leaving it in the pool and in any other group
   *  it already belongs to (a word may live in more than one group). */
  function addWordToCat(word: string, catId: string) {
    update({
      cats: draft!.cats.map((c) =>
        c.id === catId && !c.words.includes(word)
          ? { ...c, words: [...c.words, word] }
          : c
      ),
    });
  }

  /** Remove a word from a single group only; it stays in the pool. */
  function removeWordFromCat(word: string, catId: string) {
    update({
      cats: draft!.cats.map((c) =>
        c.id === catId ? { ...c, words: c.words.filter((w) => w !== word) } : c
      ),
    });
  }

  function addGroup() {
    if (draft!.cats.length >= 5) return;
    update({
      cats: [
        ...draft!.cats,
        { id: `c${Date.now()}`, name: "", words: [] },
      ],
    });
  }

  function removeGroup(id: string) {
    if (draft!.cats.length <= 3) return;
    update({ cats: draft!.cats.filter((c) => c.id !== id) });
  }

  function startDragCard(e: React.PointerEvent, id: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const x = clamp(((ev.clientX - rect.left) / rect.width) * 100, 12, 88);
      const y = clamp(((ev.clientY - rect.top) / rect.height) * 100, 12, 88);
      setDraft((d) =>
        d ? { ...d, positions: { ...d.positions, [id]: { x, y } } } : d
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const constellation = (
    <div
      ref={canvasRef}
      className="relative mt-4 aspect-[4/3] w-full touch-none overflow-hidden rounded-xl border border-navy/15 bg-paper"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {(() => {
          const order = edgeOrder(draft.cats.length);
          const pts = order
            .map((idx) => draft.positions[draft.cats[idx]?.id])
            .filter(Boolean) as { x: number; y: number }[];
          if (pts.length !== draft.cats.length) return null;
          return (
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
          );
        })()}
      </svg>

      {draft.cats.map((c) => {
        const p = draft.positions[c.id] ?? { x: 50, y: 20 };
        return (
          <div
            key={c.id}
            onPointerDown={(e) => startDragCard(e, c.id)}
            className="absolute max-w-44 -translate-x-1/2 -translate-y-1/2 cursor-grab select-none rounded-lg border border-navy/25 bg-mist px-3 py-2 text-center active:cursor-grabbing"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <p className="font-display text-lg text-navy">
              {c.name || "Unnamed"}
            </p>
          </div>
        );
      })}

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {draft.central.trim() ? (
          <div className="max-w-56 rounded-full border border-brass bg-brass/10 px-5 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-brass">
              Central {draft.central.trim().includes(" ") ? "phrase" : "word"}
            </p>
            <p className="font-display text-lg leading-tight text-navy">
              {draft.central}
            </p>
          </div>
        ) : (
          <div className="rounded-full border border-dashed border-navy/30 px-5 py-3 text-center text-xs text-navy/50">
            Your central word
            <br />
            lands here in the center
          </div>
        )}
      </div>
    </div>
  );

  const poolChip = (w: string) => {
    const isPlaced = placed.has(w);
    return (
      <button
        key={w}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", w);
          e.dataTransfer.effectAllowed = "copy";
          setSelected(w);
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelected(selected === w ? null : w);
        }}
        title="Drag onto a group, or tap to choose which group (or groups) this word belongs to."
        className={`cursor-grab rounded-full px-3 py-1 text-sm transition active:cursor-grabbing ${
          selected === w
            ? "bg-accent text-white ring-2 ring-brass/40"
            : isPlaced
              ? "bg-navy/10 text-navy/70 ring-1 ring-navy/20"
              : "bg-mist text-navy hover:bg-navy/15"
        }`}
      >
        {w}
        {isPlaced && <span className="ml-1 text-navy/40">✓</span>}
      </button>
    );
  };

  const catChip = (w: string, catId: string) => (
    <button
      key={w}
      onClick={(e) => {
        e.stopPropagation();
        removeWordFromCat(w, catId);
      }}
      title="Tap to remove from this group"
      className="rounded-full bg-primary px-3 py-1 text-sm text-white transition hover:bg-navy-deep"
    >
      {w} <span className="text-white/50">×</span>
    </button>
  );

  return (
    <ModuleGate slug="words-i-like">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <ModuleHeader module={m} />
        {(() => {
          const part =
            PARTS.find((p) => p.covers.includes(draft.step)) ?? PARTS[0];
          return (
            <div className="mt-8">
              <p className="mb-2 text-sm uppercase tracking-wider text-brass">
                {part.label}
              </p>
              <VideoSlot title={part.title} videoSrc={part.videoSrc} />
            </div>
          );
        })()}

        <nav className="mt-10 flex flex-wrap gap-2" aria-label="Exercise steps">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = draft.step === n;
            const reachable = n < draft.step || active;
            return (
              <button
                key={label}
                onClick={() => reachable && goTo(n)}
                disabled={!reachable}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  active
                    ? "bg-primary text-white"
                    : reachable
                      ? "bg-mist text-navy hover:bg-navy/15"
                      : "bg-mist/60 text-navy/40"
                }`}
              >
                {n}. {label}
              </button>
            );
          })}
        </nav>

        {draft.step === 1 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl text-navy">
              Discover Words You Like
            </h2>
            <p className="mt-2 text-foreground/80">
              Make a big, long list of words you like. Any word that appeals
              to you belongs here. This is a fun exercise, not a serious
              task, so let your imagination lead. How many? Just go for it,
              but at least 50. The only way to get it wrong is not to play.
            </p>
            <form
              className="mt-5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem(
                  "word"
                ) as HTMLInputElement;
                addWords(input.value);
                input.value = "";
                input.focus();
              }}
            >
              <input
                name="word"
                autoComplete="off"
                placeholder="Type a word and press Enter (commas add several at once)"
                className="flex-1 rounded-md border border-navy/25 bg-paper px-4 py-2.5 outline-none focus:border-navy"
              />
              <button className="rounded-md bg-primary px-5 py-2.5 text-white hover:bg-navy-deep">
                Add
              </button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2">
              {draft.words.map((w) => (
                <span
                  key={w}
                  className="group flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 text-sm text-navy"
                >
                  {w}
                  <button
                    onClick={() => removeWord(w)}
                    aria-label={`Remove ${w}`}
                    className="text-navy/40 hover:text-navy"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-navy/60">
              {draft.words.length} word{draft.words.length === 1 ? "" : "s"} so
              far
              {draft.words.length < 50
                ? `. ${50 - draft.words.length} more to reach 50`
                : ". Keep going if they keep coming"}
            </p>
            {/* Organize is part of the same step */}
            <h2 className="mt-12 font-display text-2xl text-navy">
              Organize Your Words Into Groups
            </h2>
            <p className="mt-2 text-foreground/80">
              Move words into groups based on any natural connection you
              sense. No need to rationalize it; trust your instincts. Drag a
              word onto a group, or tap the word and then tap a group. Keep it
              to 3, 4, or 5 groups. A word can live in more than one group, and
              you don&apos;t have to place every word to move on.
            </p>

            <div className="mt-5 rounded-xl border border-navy/15 bg-paper p-4">
              <p className="text-xs uppercase tracking-wider text-navy/50">
                Your Words
              </p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-navy/50">
                <li>Drag a word onto a group, or tap the word then a group.</li>
                <li>You can add up to 5 groups.</li>
                <li>
                  Every word stays here so you can place it in more than one
                  group. A checkmark means you&apos;ve used it somewhere.
                </li>
              </ol>
              <div className="mt-2 flex min-h-10 flex-wrap gap-2">
                {draft.words.length ? (
                  draft.words.map((w) => poolChip(w))
                ) : (
                  <p className="text-sm text-navy/40">
                    No words yet. Add some in the Discover step.
                  </p>
                )}
              </div>
            </div>

            {/* placement bar: always visible under the pool, above the groups */}
            <div className="mt-4 rounded-xl bg-primary p-4">
              {selected && (
                <p className="mb-3 text-sm text-white/85">
                  Place this word in…
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {draft.cats.map((c, i) => {
                  const inGroup = !!selected && c.words.includes(selected);
                  const over = dragOverCat === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        if (!selected) return;
                        if (inGroup) removeWordFromCat(selected, c.id);
                        else addWordToCat(selected, c.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                        setDragOverCat(c.id);
                      }}
                      onDragLeave={() =>
                        setDragOverCat((cur) => (cur === c.id ? null : cur))
                      }
                      onDrop={(e) => {
                        e.preventDefault();
                        const w = e.dataTransfer.getData("text/plain");
                        if (w) addWordToCat(w, c.id);
                        setDragOverCat(null);
                      }}
                      aria-pressed={inGroup}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        over
                          ? "bg-accent text-white ring-4 ring-brass/40"
                          : inGroup
                            ? "bg-accent text-white hover:bg-accent/85"
                            : selected
                              ? "bg-paper text-navy hover:bg-mist"
                              : "bg-paper text-navy opacity-50"
                      }`}
                    >
                      {inGroup ? "✓ " : ""}Group {i + 1}
                    </button>
                  );
                })}
                {draft.cats.length < 5 && (
                  <button
                    onClick={addGroup}
                    className="rounded-full border-2 border-dashed border-white/50 px-4 py-2 text-sm text-white transition hover:border-white hover:bg-white/10"
                  >
                    + Add a group
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {draft.cats.map((c, i) => {
                const open = !!openGroups[c.id];
                const over = dragOverCat === c.id;
                return (
                  <div
                    key={c.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                      setDragOverCat(c.id);
                    }}
                    onDragLeave={() =>
                      setDragOverCat((cur) => (cur === c.id ? null : cur))
                    }
                    onDrop={(e) => {
                      e.preventDefault();
                      const w = e.dataTransfer.getData("text/plain");
                      if (w) addWordToCat(w, c.id);
                      setDragOverCat(null);
                    }}
                    className={`rounded-xl border bg-paper transition ${
                      over
                        ? "border-brass ring-2 ring-brass/40"
                        : "border-navy/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <button
                        onClick={() =>
                          setOpenGroups((g) => ({ ...g, [c.id]: !open }))
                        }
                        aria-expanded={open}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <span
                          aria-hidden="true"
                          className={`text-navy/40 transition-transform ${
                            open ? "rotate-90" : ""
                          }`}
                        >
                          ▸
                        </span>
                        <span className="font-medium text-navy">
                          Group {i + 1}
                        </span>
                        <span className="text-sm text-navy/50">
                          {c.words.length} word
                          {c.words.length === 1 ? "" : "s"}
                        </span>
                      </button>
                      {draft.cats.length > 3 && (
                        <button
                          onClick={() => removeGroup(c.id)}
                          className="text-xs text-navy/40 hover:text-navy"
                        >
                          remove
                        </button>
                      )}
                    </div>
                    {open && (
                      <div className="flex flex-wrap gap-2 border-t border-navy/10 px-4 py-3">
                        {c.words.length ? (
                          c.words.map((w) => catChip(w, c.id))
                        ) : (
                          <p className="text-sm text-navy/35">
                            No words yet. Tap a word above, then tap this
                            group.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-sm text-navy/50">
              Tip: open a group to see its words; tap a word inside to remove
              it from that group.
            </p>

            <div className="mt-6 flex justify-end">
              <button
                onClick={continueFromStep1}
                disabled={!canContinue[1]}
                className="rounded-md bg-primary px-5 py-2.5 text-white hover:bg-navy-deep disabled:opacity-40"
              >
                Continue to naming →
              </button>
            </div>

          </section>
        )}

        {draft.step === 2 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl text-navy">
              Name Each Group of Words
            </h2>
            <p className="mt-2 text-foreground/80">
              Give each group a name that captures its essence: a word from
              the group, or a new one that embodies its spirit. Avoid generic
              labels. You are beginning to describe what you are all about.
            </p>
            <div className="mt-5 space-y-4">
              {draft.cats.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-navy/15 bg-paper p-4"
                >
                  <input
                    value={c.name}
                    onChange={(e) =>
                      update({
                        cats: draft.cats.map((x) =>
                          x.id === c.id ? { ...x, name: e.target.value } : x
                        ),
                      })
                    }
                    placeholder="Name this group…"
                    className="w-full rounded-md border border-navy/25 px-4 py-2.5 font-display text-lg text-navy outline-none focus:border-navy"
                  />
                  <p className="mt-2 text-sm text-navy/60">
                    {c.words.join(" · ")}
                  </p>
                </div>
              ))}
            </div>
            {/* Central word is part of the same step */}
            <h2 className="mt-12 font-display text-2xl text-navy">
              Uncover Your Central Word or Phrase
            </h2>
            <p className="mt-2 text-foreground/80">
              Your categories give your constellation its shape. As you look
              at it, ask: does this describe you? Do you see yourself here?
            </p>
            {constellation}
            <p className="mt-5 text-foreground/80">
              Now for the fun part. What word or phrase is the cornerstone of
              this entire collection, the thing that drives you
              intrinsically? A personal compass. A guiding star.
            </p>
            <input
              value={draft.central}
              onChange={(e) => update({ central: e.target.value })}
              placeholder="Your central word or phrase…"
              className="mt-5 w-full rounded-md border border-navy/25 bg-paper px-4 py-3 font-display text-xl text-navy outline-none focus:border-navy"
            />
            <div className="mt-6 flex justify-between">
              <button onClick={() => goTo(1)} className="text-navy underline">
                ← Back
              </button>
              <button
                onClick={() => goTo(3)}
                disabled={!canContinue[2]}
                className="rounded-md bg-primary px-5 py-2.5 text-white hover:bg-navy-deep disabled:opacity-40"
              >
                Continue to your story →
              </button>
            </div>
          </section>
        )}

        {draft.step === 3 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl text-navy">
              Your Story: What Are You All About?
            </h2>
            <div className="mt-3 space-y-4 text-foreground/85">
              <p>
                This exercise works from the back of your mind. It asks you
                the question, <em>What are you all about?</em>, without ever
                asking it. Asked straight, that question puts you under
                pressure to get it right. So instead, you made a big long list
                of words you like, and we walked a reductive process until
                just a few named categories surrounded a central word or
                phrase.
              </p>
              <p>
                What I hope you see in this simple shape is an answer:
                something that makes your heart sing, dance, and come alive.
                Ask yourself: <em>is anything missing?</em>{" "}Now that you can
                see it, you might realize there&apos;s a stronger, more
                powerful word for one of your categories. Go back and make
                those changes if you want.
              </p>
            </div>

            {constellation}

            <div className="mt-8 rounded-xl border border-navy/20 bg-paper p-6">
              <label className="font-display text-2xl text-navy">
                What are you all about?
              </label>
              <p className="mt-1 text-sm text-navy/55">
                In a paragraph or two, answer the question in your own words.
                Include a couple of stories about where this has shown up in
                your life.
              </p>
              <RichTextArea
                value={draft.story}
                onChange={(html) => update({ story: html })}
                placeholder="Write your answer here…"
                label="Your story"
                minHeightClass="min-h-48"
              />
            </div>

            <div className="mt-6 space-y-4 text-foreground/85">
              <p>
                But there is one more move. We do not live reductive lives;
                we live integrated ones. We put the whole together and make
                meaning out of it. What you have in front of you is not your
                story yet: these categories are <em>ingredients</em>.
              </p>
              <p>
                You&apos;ll bring them together into a full articulation of
                your Value Creation Mechanism in the final module. For now,
                capture the words and phrases worth keeping below.
              </p>
            </div>

            <div className="mt-6">
              <button onClick={() => goTo(2)} className="text-navy underline">
                ← Back
              </button>
            </div>
            <IngredientCapture
              prompt="Look back over your constellation and your story. Write down a few words or phrases that capture what stood out and will help you return to these insights later. There is no right number, and you can always add more."
              source="words-i-like"
            />

            <CompleteBar
              slug="words-i-like"
              actionLabel="Complete Words I like"
              canComplete={plainText(draft.story).length >= 40}
              blockedHint="Answer 'What are you all about?' and add at least 3 ingredients to finish the exercise."
            />
          </section>
        )}
      </div>
    </ModuleGate>
  );
}
