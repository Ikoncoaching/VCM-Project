"use client";

import RichTextArea from "./RichTextArea";
import RichText from "./RichText";
import { plainText, richHasText } from "@/lib/richtext";

import { useEffect, useRef, useState } from "react";
import { loadDraft, saveDraft } from "@/lib/storage";
import Skeleton from "@/components/Skeleton";

const DRAFT_KEY = "vcm-look-backwards";

/** localStorage shape; the `ingredients` list is read again later by
 *  Words I Like and Pick Your Tool. `sources` records which module added an
 *  ingredient (lowercased key), for modules that require a minimum number of
 *  additions. */
export interface LookBackDraft {
  step: number;
  entries: Record<string, string>;
  ingredients: string[];
  sources?: Record<string, string>;
}

const STEPS = [
  "The Self",
  "What You've Learned",
  "At Your Best",
  "Ingredients",
];

interface JournalStep {
  id: string;
  title: string;
  /** optional framing sentence shown above the quotation */
  quoteLead?: string;
  quote: string;
  lead: string;
  questions: string[];
}

const JOURNAL_STEPS: JournalStep[] = [
  {
    id: "self",
    title: "The Self",
    quoteLead:
      "Kirk talked about the Self being part of the means of production in the modern economy. It's",
    quote:
      "Not just human labor, not just human effort, not just human time, but the human self. Who you are, how you see, how you think, create, relate, interpret reality, how you bring order to chaos and notice what others miss, how you help others move forward.",
    lead: "Journal about one or two specific experiences when who you are, not just your effort or your hours, made the difference for someone.",
    questions: [
      "How did your distinct point of view help solve a problem or create a solution?",
      "Add a contrasting experience: a time when you brought real effort or time but were unsuccessful at creating value. What was missing?",
    ],
  },
  {
    id: "hints",
    title: "What You've Learned",
    quoteLead: "In the video Kirk suggests that",
    quote:
      "You know some of what you enjoy, what you're good at. You are aware of the feedback you've received. You know what frustrates you, what energizes you, what kind of work you would rather never do again.",
    lead: "You already carry hints. Get them out of your head and onto the page: honestly, without polishing.",
    questions: [
      "What energizes you? What are you good at?",
      "What positive or negative feedback have people given you more than once?",
      "What frustrates you? What kind of work would you rather never do again?",
    ],
  },
  {
    id: "best",
    title: "At Your Best",
    quote:
      "What are you actually doing when you're at your best? What changes because you were in the room? What becomes clearer, stronger, freer, more ordered, more courageous, more beautiful, more possible, or more alive because you showed up?",
    lead: "Titles are containers but not your mechanism. Pick a moment when you were at your best and describe how you added value.",
    questions: [
      "What were you actually doing, moment by moment?",
      "What changed because you were there?",
      "What became clearer, stronger, freer, more ordered, more courageous, more beautiful, more possible, or more alive?",
    ],
  },
];

const MIN_ENTRY = 60;
export const MIN_INGREDIENTS = 5;

/** step numbers derived from the journal steps, so removing or adding a
 *  journal step renumbers everything automatically */
const INGREDIENTS_STEP = JOURNAL_STEPS.length + 1;

const wordCount = (s: string) =>
  s.trim() ? s.trim().split(/\s+/).length : 0;

function freshDraft(): LookBackDraft {
  return { step: 1, entries: {}, ingredients: [] };
}

/**
 * "Consider Your History" journaling exercise. Rendered inside the merged
 * Introduction module, below the three videos. It has no header/gate of its
 * own; the parent module owns the completion. It reports whether the harvest
 * is done (>= MIN_INGREDIENTS) via `onDoneChange`.
 */
export default function ConsiderYourHistory({
  onDoneChange,
}: {
  onDoneChange?: (done: boolean) => void;
}) {
  const [draft, setDraft] = useState<LookBackDraft | null>(null);
  const [selection, setSelection] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Re-read when the server finishes filling localStorage, the same as every
  // other module does. Without it this one mounted against an empty
  // localStorage on a fresh browser and never picked the real draft up.
  useEffect(() => {
    const read = () => {
      const loaded = loadDraft<LookBackDraft>(DRAFT_KEY);
      setDraft(loaded ? { ...freshDraft(), ...loaded } : freshDraft());
    };
    read();
    window.addEventListener("vcm-hydrated", read);
    return () => window.removeEventListener("vcm-hydrated", read);
  }, []);

  // Save only what the client actually changed. This used to save on every
  // draft change including the first, so mounting before hydration wrote the
  // empty starting draft straight over their saved ingredients.
  const dirty = useRef(false);
  useEffect(() => {
    if (draft && dirty.current) saveDraft(DRAFT_KEY, draft);
  }, [draft]);

  const ingredientCount = draft?.ingredients.length ?? 0;
  useEffect(() => {
    onDoneChange?.(ingredientCount >= MIN_INGREDIENTS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredientCount]);

  if (!draft) {
    return <div className="mt-12"><Skeleton /></div>;
  }

  const update = (patch: Partial<LookBackDraft>) => {
    dirty.current = true;
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const setEntry = (id: string, value: string) =>
    update({ entries: { ...draft.entries, [id]: value } });

  const entryOk = (id: string) =>
    plainText(draft.entries[id] ?? "").length >= MIN_ENTRY;

  const canContinue: Record<number, boolean> = {};
  JOURNAL_STEPS.forEach((js, i) => {
    canContinue[i + 1] = entryOk(js.id);
  });

  function goTo(step: number) {
    update({ step });
    topRef.current?.scrollIntoView({ block: "start" });
  }

  function addIngredients(raw: string) {
    const incoming = raw
      .split(/[,\n]/)
      .map((w) => w.trim().replace(/\s+/g, " "))
      .filter((w) => w.length > 0 && w.length <= 80);
    if (!incoming.length) return;
    const existing = new Set(draft!.ingredients.map((w) => w.toLowerCase()));
    const merged = [...draft!.ingredients];
    for (const w of incoming) {
      if (!existing.has(w.toLowerCase())) {
        merged.push(w);
        existing.add(w.toLowerCase());
      }
    }
    update({ ingredients: merged });
  }

  function removeIngredient(w: string) {
    update({ ingredients: draft!.ingredients.filter((x) => x !== w) });
  }

  function captureSelection() {
    const text = window.getSelection()?.toString().trim() ?? "";
    setSelection(text.length >= 2 && text.length <= 80 ? text : "");
  }

  const journalStep = JOURNAL_STEPS[draft.step - 1];

  const entryCards = (ids: string[]) => (
    <div className="mt-5 space-y-4" onMouseUp={captureSelection}>
      {ids.map((id) => {
        const js = JOURNAL_STEPS.find((s) => s.id === id);
        const text = draft.entries[id] ?? "";
        if (!richHasText(text)) return null;
        return (
          <div key={id} className="rounded-xl border border-navy/15 bg-paper p-5">
            <p className="text-xs uppercase tracking-wider text-brass">
              {js?.title ?? "Patterns"}
            </p>
            <RichText html={text} className="mt-2 leading-relaxed text-foreground/85" />
          </div>
        );
      })}
    </div>
  );

  return (
    <div ref={topRef} className="mt-14 border-t border-navy/10 pt-12">
      <p className="text-sm uppercase tracking-[0.25em] text-brass">
        Your turn
      </p>
      <h2 className="mt-1.5 font-display text-3xl text-navy">
        Consider Your History
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-foreground/85">
        The films asked big questions. Now go looking for your own answers.
        You have already created value, more times than you remember, and the
        evidence is sitting in your history. Three short pieces of writing,
        then you harvest what you found.
      </p>
      <p className="mt-3 leading-relaxed text-foreground/75">
        Nobody is grading this. Write badly on purpose if it helps. What you
        are after are{" "}
        <strong className="text-navy">ingredients</strong>: words, phrases and
        moments you will use later, when you put the whole thing together.
      </p>

      <nav className="mt-10 flex flex-wrap gap-2" aria-label="Exercise steps">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = draft.step === n;
          // a step counts as done once it holds something worth keeping
          const js = JOURNAL_STEPS[i];
          const done = js
            ? entryOk(js.id)
            : draft.ingredients.length >= MIN_INGREDIENTS;
          return (
            <button
              key={label}
              onClick={() => goTo(n)}
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition ${
                active
                  ? "bg-primary text-white"
                  : done
                    ? "bg-brass/15 text-navy hover:bg-brass/25"
                    : "bg-mist text-navy hover:bg-navy/15"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  done
                    ? "bg-accent text-white"
                    : active
                      ? "bg-white/25 text-white"
                      : "bg-navy/10 text-navy/50"
                }`}
              >
                {done ? "✓" : n}
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      {draft.step <= JOURNAL_STEPS.length && journalStep && (
        <section className="mt-8">
          <h3 className="font-display text-2xl text-navy">
            {journalStep.title}
          </h3>
          <blockquote className="mt-4 rounded-xl border-l-4 border-brass bg-mist/60 p-5 leading-relaxed text-navy/85">
            {journalStep.quoteLead ? (
              <span className="not-italic">{journalStep.quoteLead} </span>
            ) : null}
            <span className="italic">“{journalStep.quote}”</span>
          </blockquote>
          <p className="mt-4 text-foreground/80">{journalStep.lead}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-foreground/75">
            {journalStep.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
          <RichTextArea
            value={draft.entries[journalStep.id] ?? ""}
            onChange={(html) => setEntry(journalStep.id, html)}
            placeholder="Write freely. Specifics beat summaries. Nobody is grading this."
            label={journalStep.title}
            minHeightClass="min-h-64"
            className="mt-5"
          />
          <p className="mt-2 text-sm text-navy/50">
            {wordCount(plainText(draft.entries[journalStep.id] ?? ""))} words
            {!canContinue[draft.step] && ". A few honest sentences is plenty"}
          </p>
          <div className="mt-6 flex justify-between">
            {draft.step > 1 ? (
              <button
                onClick={() => goTo(draft.step - 1)}
                className="text-navy underline"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={() => goTo(draft.step + 1)}
              className="rounded-md bg-primary px-5 py-2.5 text-white transition hover:bg-navy-deep"
            >
              Continue →
            </button>
          </div>
        </section>
      )}

      {draft.step === INGREDIENTS_STEP && (
        <section className="mt-8">
          <h3 className="font-display text-2xl text-navy">
            Harvest Your Ingredients
          </h3>
          <p className="mt-2 text-foreground/80">
            Pull the important elements out of everything you wrote: words,
            phrases, moments, capacities. These are{" "}
            <strong className="text-navy">ingredients</strong>, not conclusions:
            raw material you&apos;ll reach for later when you put the whole
            thing together.
          </p>
          <p className="mt-3 text-foreground/80">
            Highlight text in your entries below and drag and drop it into your
            ingredients section, or type ingredients in directly. Aim for at
            least {MIN_INGREDIENTS}. More is better.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const text = e.dataTransfer.getData("text/plain");
              if (text) addIngredients(text);
            }}
            className={`sticky top-2 z-10 mt-5 rounded-xl border bg-sand p-4 shadow-sm transition ${
              dragOver ? "border-brass ring-2 ring-brass" : "border-brass/60"
            }`}
          >
            {dragOver && (
              <p className="mb-2 text-center text-sm font-medium text-brass">
                Drop to add to your ingredients
              </p>
            )}
            <p className="text-xs uppercase tracking-wider text-brass">
              My ingredients · {draft.ingredients.length}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {draft.ingredients.length ? (
                draft.ingredients.map((w) => (
                  <span
                    key={w}
                    className="flex items-center gap-1.5 rounded-full bg-brass/15 px-3 py-1 text-sm text-navy"
                  >
                    {w}
                    <button
                      onClick={() => removeIngredient(w)}
                      aria-label={`Remove ${w}`}
                      className="text-navy/40 hover:text-navy"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-sm text-navy/40">Nothing harvested yet.</p>
              )}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem(
                  "ingredient"
                ) as HTMLInputElement;
                addIngredients(input.value);
                input.value = "";
                input.focus();
              }}
            >
              <input
                name="ingredient"
                autoComplete="off"
                placeholder="Type an ingredient (commas add several at once)"
                className="flex-1 rounded-md border border-navy/25 bg-paper px-4 py-2 text-sm outline-none focus:border-navy"
              />
              <button className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-navy-deep">
                Add
              </button>
            </form>
            {selection && (
              <button
                onClick={() => {
                  addIngredients(selection);
                  setSelection("");
                  window.getSelection()?.removeAllRanges();
                }}
                className="mt-2 rounded-md border border-brass bg-brass/10 px-4 py-2 text-sm text-navy hover:bg-brass/20"
              >
                + Add “{selection.length > 40 ? `${selection.slice(0, 40)}…` : selection}”
              </button>
            )}
          </div>

          {entryCards(["self", "hints", "best"])}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={() => goTo(JOURNAL_STEPS.length)}
              className="text-navy underline"
            >
              ← Back
            </button>
            <p
              className={`text-sm font-medium ${
                ingredientCount >= MIN_INGREDIENTS ? "text-navy/60" : "text-brass"
              }`}
            >
              {ingredientCount} of {MIN_INGREDIENTS} harvested
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
