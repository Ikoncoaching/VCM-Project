"use client";

import RichTextArea from "./RichTextArea";
import { richHasText } from "@/lib/richtext";

import { Fragment, useEffect, useState } from "react";
import { moduleBySlug } from "@/lib/modules";
import { ALL_SCALE_NAMES, BIG_FIVE, ordinal } from "@/lib/bigfive";
import {
  BIG_FIVE_DRAFT_KEY,
  loadBigFiveDraft,
  pushReport,
  readReport,
  uploadMeta,
  type BigFiveDraft,
} from "@/lib/bigFiveReport";
import { saveDraft } from "@/lib/storage";
import ModuleGate from "./ModuleGate";
import ModuleHeader from "./ModuleHeader";
import VideoSlot from "./VideoSlot";
import CompleteBar from "./CompleteBar";
import IngredientCapture from "./IngredientCapture";
import Skeleton from "@/components/Skeleton";
import { sizeLabel } from "@/lib/clientFiles";

/** "Compassion", "Compassion and Extraversion", "A, B and C" */
function listOut(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export default function BigFive() {
  const m = moduleBySlug("big-five")!;
  const [draft, setDraft] = useState<BigFiveDraft | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setDraft(loadBigFiveDraft());
  }, []);

  useEffect(() => {
    if (draft) saveDraft(BIG_FIVE_DRAFT_KEY, draft);
  }, [draft]);

  if (!draft) {
    return <div className="mx-auto max-w-3xl px-6 py-16"><Skeleton /></div>;
  }

  const update = (patch: Partial<BigFiveDraft>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  async function onFile(file: File | undefined) {
    if (!file) return;
    update({ upload: uploadMeta(file) });
    setParsing(true);
    pushReport(file);
    const { scores, parseStatus } = await readReport(file);
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            scores: parseStatus === "parsed" ? scores : prev.scores,
            parseStatus,
          }
        : prev
    );
    setParsing(false);
  }

  function dropHandlers() {
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
      },
      onDragLeave: () => setDragOver(false),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/pdf") onFile(file);
      },
    };
  }

  function setScore(name: string, value: string) {
    const n = value === "" ? null : Math.max(0, Math.min(100, Number(value)));
    setDraft((prev) =>
      prev ? { ...prev, scores: { ...prev.scores, [name]: n } } : prev
    );
  }

  // Everything still outstanding, named. Percentiles are deliberately not in
  // here; see below.
  const blockedItems: string[] = [];
  if (!draft.upload) {
    blockedItems.push("Upload your Understand Myself report.");
  }
  // Percentiles are invited, never required. They used to block completion,
  // and the boxes to enter them only rendered on a clean PDF parse, so a
  // client whose report did not parse was asked for fifteen numbers with
  // nowhere to type them and no way out.
  const missingScores = ALL_SCALE_NAMES.filter(
    (n) => draft.scores[n] === null || draft.scores[n] === undefined
  );
  const unanswered = BIG_FIVE.filter(
    (t) => draft.resonance[t.trait] !== "yes" && draft.resonance[t.trait] !== "no"
  ).map((t) => t.trait);
  if (unanswered.length) {
    blockedItems.push(
      `Say whether the result resonates for ${listOut(unanswered)}.`
    );
  }
  const needWhy = BIG_FIVE.filter(
    (t) =>
      draft.resonance[t.trait] === "no" &&
      !richHasText(draft.whys[t.trait] ?? "")
  ).map((t) => t.trait);
  if (needWhy.length) {
    blockedItems.push(`Say why ${listOut(needWhy)} did not resonate.`);
  }

  const canComplete = blockedItems.length === 0;

  const pct = (name: string) =>
    draft.scores[name] !== null ? `${ordinal(draft.scores[name]!)} percentile` : null;

  return (
    <ModuleGate slug="big-five">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <ModuleHeader module={m} />
        <div className="mt-8">
          <VideoSlot title="The Big Five" videoSrc="/videos/big-five.mp4" />
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-navy/15 bg-paper p-6">
            <p className="text-sm uppercase tracking-wider text-brass">
              Step 1
            </p>
            <h2 className="mt-1 font-display text-2xl text-navy">
              Take the Assessment
            </h2>
            <p className="mt-2 text-foreground/80">
              Complete the Big Five personality assessment at
              understandmyself.com (link below). Set aside about 15 quiet
              minutes and answer honestly; there are no good or bad answers,
              no right or wrong ways to take the survey. Your first
              inclination is probably the most helpful.
            </p>
            <p className="mt-3 rounded-md bg-brass/10 px-4 py-2.5 text-sm text-navy">
              Heads up: the assessment costs about $10, paid directly to
              understandmyself.com.
            </p>
            <a
              href="https://understandmyself.com/personality-assessment"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-md bg-primary px-5 py-2.5 text-white transition hover:bg-navy-deep"
            >
              Open understandmyself.com ↗
            </a>
          </div>

          <div className="rounded-xl border border-navy/15 bg-paper p-6">
            <p className="text-sm uppercase tracking-wider text-brass">
              Step 2
            </p>
            <h2 className="mt-1 font-display text-2xl text-navy">
              Upload Your Report
            </h2>
            <p className="mt-2 text-foreground/80">
              When you finish, download the PDF report and upload it here.
              Then review your report. What resonates with you? What can you
              learn about your temperament? Consider how the different
              elements interact with each other. For instance, if you are
              highly agreeable (always wanting to be polite and bring harmony)
              while also being highly assertive (a sub-aspect of Extraversion:
              knowing your voice and not afraid to use it), how do those work
              together?
            </p>
            <p className="mt-2 text-sm text-navy/50">
              Your report is read right in your browser and never leaves your
              device.
            </p>

            {draft.upload ? (
              <div
                {...dropHandlers()}
                className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 transition ${
                  dragOver ? "bg-brass/15 ring-2 ring-brass" : "bg-mist"
                }`}
              >
                <div>
                  <p className="font-medium text-navy">
                    {draft.upload.fileName}
                  </p>
                  <p className="text-sm text-navy/60">
                    {sizeLabel(draft.upload.sizeKb)} · uploaded{" "}
                    {new Date(draft.upload.uploadedAt).toLocaleDateString()}
                    {parsing && " · reading your report…"}
                  </p>
                </div>
                <label className="cursor-pointer text-sm text-navy underline">
                  Replace file (or drop a new one here)
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                </label>
              </div>
            ) : (
              <label
                {...dropHandlers()}
                className={`mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition ${
                  dragOver
                    ? "border-brass bg-brass/10"
                    : "border-navy/25 hover:border-navy/50"
                }`}
              >
                <span className="text-navy">
                  {dragOver
                    ? "Drop your PDF to upload it"
                    : "Drag and drop your PDF report here, or click to choose it"}
                </span>
                <span className="text-sm text-navy/50">PDF only</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </label>
            )}

            {draft.upload && (
              <div className="mt-4 rounded-lg border border-brass/40 bg-brass/5 p-4">
                <p className="font-medium text-navy">
                  {draft.parseStatus === "parsed"
                    ? "We read your report. Confirm your percentiles:"
                    : "Your percentiles, if you'd like to record them:"}
                </p>
                <p className="mt-1 text-sm text-navy/60">
                  {draft.parseStatus === "parsed"
                    ? "Check these against your PDF and correct anything we misread."
                    : "Optional. You can read them off your PDF, or leave them and carry on."}
                </p>
                <div className="mt-4 divide-y divide-navy/10">
                  {BIG_FIVE.map((t) => (
                    <div
                      key={t.trait}
                      className="grid grid-cols-[1fr_4.5rem] items-center gap-x-3 gap-y-2 py-2.5 sm:grid-cols-[minmax(9rem,1fr)_4.5rem_7rem_4rem_6.5rem_4rem]"
                    >
                      <span className="font-medium text-navy">{t.trait}</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draft.scores[t.trait] ?? ""}
                        onChange={(e) => setScore(t.trait, e.target.value)}
                        className="w-full rounded-md border border-navy/25 px-2 py-1.5 text-center font-medium text-navy outline-none focus:border-navy"
                      />
                      {t.aspects.map((a) => (
                        <Fragment key={a}>
                          <span className="text-right text-sm text-navy/70">
                            {a.toLowerCase()}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={draft.scores[a] ?? ""}
                            onChange={(e) => setScore(a, e.target.value)}
                            className="w-full rounded-md border border-navy/20 px-2 py-1.5 text-center text-navy outline-none focus:border-navy"
                          />
                        </Fragment>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {draft.upload && missingScores.length > 0 && (
              <p className="mt-3 text-sm text-navy/60">
                {missingScores.length === ALL_SCALE_NAMES.length
                  ? "Filling these in is optional, and they make your VCM reflection richer later."
                  : `Still blank: ${listOut(missingScores)}. Adding them is optional.`}
              </p>
            )}

            {draft.parseStatus === "failed" && (
              <p className="mt-4 rounded-lg bg-mist p-3 text-sm text-navy/70">
                We couldn&apos;t read percentiles from that PDF automatically.
                No problem. Enter any you want above, or carry on without them.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-navy/15 bg-paper p-6">
            <p className="text-sm uppercase tracking-wider text-brass">
              Step 3
            </p>
            <h2 className="mt-1 font-display text-2xl text-navy">
              Reflect on Your Results
            </h2>
            <p className="mt-2 text-foreground/80">
              For each of the five aspects, did your result resonate with you?
            </p>

            <div className="mt-4 divide-y divide-navy/10">
              {BIG_FIVE.map((t, i) => (
                <div key={t.trait} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-navy">
                        <span className="mr-2 text-navy/40">{i + 1}.</span>
                        {t.trait}
                        {pct(t.trait) && (
                          <span className="ml-3 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                            {pct(t.trait)}
                          </span>
                        )}
                      </p>
                      <p className="ml-7 mt-1.5 flex flex-wrap gap-2">
                        {t.aspects.map((a) => (
                          <span
                            key={a}
                            className="rounded-full bg-mist px-3 py-1 text-xs text-navy/80"
                          >
                            {a.toLowerCase()}
                            {draft.scores[a] !== null && (
                              <span className="ml-1.5 font-semibold text-navy">
                                {ordinal(draft.scores[a]!)}
                              </span>
                            )}
                          </span>
                        ))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(["yes", "no"] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() =>
                            setDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    resonance: {
                                      ...prev.resonance,
                                      [t.trait]: v,
                                    },
                                  }
                                : prev
                            )
                          }
                          className={`rounded-full px-5 py-1.5 text-sm capitalize transition ${
                            draft.resonance[t.trait] === v
                              ? v === "yes"
                                ? "bg-primary text-white"
                                : "bg-accent text-white"
                              : "border border-navy/25 bg-paper text-navy hover:border-navy"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  {draft.resonance[t.trait] === "no" && (
                    <div className="mt-3">
                      <label className="text-sm text-navy/70">
                        If no, why?
                      </label>
                      <RichTextArea
                        value={draft.whys[t.trait] ?? ""}
                        placeholder=""
                        label="If no, why?"
                        minHeightClass="min-h-24"
                        onChange={(html) =>
                          setDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  whys: {
                                    ...prev.whys,
                                    [t.trait]: html,
                                  },
                                }
                              : prev
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <IngredientCapture
          prompt="Take a little time with what this assessment showed you. Write down a few words or phrases that capture what stood out and will help you return to these insights later. There is no right number, and you can always add more."
          source="big-five"
        />

        <CompleteBar
          slug="big-five"
          actionLabel="Complete this module"
          canComplete={canComplete}
          blockedHint="A few things are still open on this module."
          blockedItems={blockedItems}
        />
      </div>
    </ModuleGate>
  );
}
