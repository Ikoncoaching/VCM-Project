"use client";

import { useEffect, useState } from "react";
import { moduleBySlug } from "@/lib/modules";
import { loadDraft, saveDraft } from "@/lib/storage";
import type { LookBackDraft } from "./LookBackwards";
import {
  getModuleResults,
  groupModuleResults,
  type ModuleResult,
} from "@/lib/moduleResults";
import {
  EnneagramResult,
  WordsILikeResult,
} from "./ModuleResultCards";
import ModuleGate from "./ModuleGate";
import ModuleHeader from "./ModuleHeader";
import RichTextArea, { hasContent } from "./RichTextArea";
import VideoSlot from "./VideoSlot";
import CompleteBar from "./CompleteBar";
import Skeleton from "@/components/Skeleton";

const DRAFT_KEY = "vcm-articulate";

interface ArticulateDraft {
  articulation: string;
  /** the template scaffold: the move, the source, the gift */
  tplMove?: string;
  tplSource?: string;
  tplGift?: string;
}

/** a blank you can fill with as many words as you need (grows on demand) */
function GrowField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      placeholder={placeholder}
      className="mt-1 block w-full resize-y rounded-md border border-brass/60 bg-brass/5 px-3 py-2 text-base leading-relaxed text-navy outline-none focus:border-brass focus:bg-brass/10"
    />
  );
}

export default function Articulate() {
  const m = moduleBySlug("articulate")!;
  const [draft, setDraft] = useState<ArticulateDraft | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [results, setResults] = useState<ModuleResult[]>([]);

  useEffect(() => {
    const load = () => {
      setDraft(
        (prev) =>
          prev ?? loadDraft<ArticulateDraft>(DRAFT_KEY) ?? { articulation: "" }
      );
      const lb = loadDraft<LookBackDraft>("vcm-look-backwards");
      setIngredients(lb?.ingredients ?? []);
      setResults(getModuleResults());
    };
    load();
    // the ingredient list is gathered across every module; re-read it once the
    // server hydrates localStorage on a fresh sign-in so all of them show here
    window.addEventListener("vcm-hydrated", load);
    return () => window.removeEventListener("vcm-hydrated", load);
  }, []);

  useEffect(() => {
    if (draft) saveDraft(DRAFT_KEY, draft);
  }, [draft]);

  if (!draft) {
    return <div className="mx-auto max-w-3xl px-6 py-16"><Skeleton /></div>;
  }

  /** one card of result chips, or nothing when that module has no results */
  const chipGroup = (name: string) => {
    const g = groupModuleResults(results).find((x) => x.group === name);
    if (!g) return null;
    return (
      <div className="mt-6 rounded-xl border border-navy/15 bg-paper p-6">
        <p className="text-xs uppercase tracking-wider text-brass">{g.group}</p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {g.items.map((label) => (
            <span
              key={label}
              className="rounded-full border border-navy/15 bg-mist px-4 py-1.5 text-navy"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ModuleGate slug="articulate">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <ModuleHeader module={m} />

        <div className="mt-8">
          <VideoSlot
            title="Articulate your Value Creation Mechanism"
            videoSrc="/videos/articulate.mp4"
          />
        </div>

        <p className="mt-8 text-lg leading-relaxed text-foreground/85">
          Everything has led here. Across this journey you examined your
          history, your temperament, your type, your words, and your tool. And
          all along the way you gathered ingredients. Here they are, in one
          place. Read them slowly. Let them remind you of what you have seen.
        </p>

        {/* Everything they have to work with, under one heading: what the
            assessment modules produced, then the words they added by hand. */}
        <h2 className="mt-10 font-display text-3xl text-navy">
          Your Ingredients
        </h2>

        {/* in the order the modules are worked: temperament, type, words,
            then the tool that came out of them */}
        {chipGroup("Big Five")}
        <EnneagramResult />
        <WordsILikeResult />
        {chipGroup("Your Tool")}

        <div className="mt-8 rounded-xl border border-brass/60 bg-brass/5 p-6">
          <p className="text-xs uppercase tracking-wider text-brass">
            Ingredients You Added
          </p>
          {ingredients.length ? (
            <div className="mt-3 flex flex-wrap gap-2.5">
              {ingredients.map((w) => (
                <span
                  key={w}
                  className="rounded-full bg-paper px-4 py-1.5 text-navy"
                >
                  {w}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-navy/50">
              No ingredients yet. Revisit the earlier modules to gather them.
            </p>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-navy/15 bg-paper p-6">
          <p className="text-xs uppercase tracking-wider text-brass">
            Start with the template
          </p>
          <p className="mt-2 text-foreground/80">
            Before you write the whole thing, fill in these three blanks: the
            move, the source, and the gift. Use as many words as you need. This
            is scaffolding to get you started, not your final answer.
          </p>
          <div className="mt-5 space-y-5 text-lg leading-relaxed text-navy">
            <div>
              <span className="font-display">I make things better by</span>
              <GrowField
                value={draft.tplMove ?? ""}
                onChange={(v) => setDraft({ ...draft, tplMove: v })}
                placeholder="the move — what you actually do that leaves things better"
              />
            </div>
            <div>
              <span className="font-display">It comes from</span>
              <GrowField
                value={draft.tplSource ?? ""}
                onChange={(v) => setDraft({ ...draft, tplSource: v })}
                placeholder="the source — why this move is distinctly yours"
              />
            </div>
            <div>
              <span className="font-display">
                And at its best, it
              </span>
              <GrowField
                value={draft.tplGift ?? ""}
                onChange={(v) => setDraft({ ...draft, tplGift: v })}
                placeholder="the gift — what changes for others because you were there"
              />
              <span className="font-display">for the people around me.</span>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4 text-lg leading-relaxed text-foreground/85">
          <p>
            Now, pull it together and articulate your Value Creation Mechanism
            in your own words. Not a job title. Not a list of strengths. The
            distinctive way you engage the world that tends to make things
            better. Write it the way you would say it to someone who matters.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-navy/20 bg-paper p-6">
          <label className="font-display text-2xl text-navy">
            My Value Creation Mechanism
          </label>
          <RichTextArea
            value={draft.articulation}
            onChange={(html) => setDraft({ articulation: html })}
            placeholder="This is the articulation you will keep sharpening for the rest of your life. Start it here."
            label="My Value Creation Mechanism"
            minHeightClass="min-h-64"
          />
        </div>

        <CompleteBar
          slug="articulate"
          actionLabel="Complete the journey"
          canComplete={hasContent(draft.articulation)}
          blockedHint="Write your articulation to complete the journey."
        />
      </div>
    </ModuleGate>
  );
}
