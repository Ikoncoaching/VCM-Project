"use client";

import RichTextArea from "./RichTextArea";
import { richHasText } from "@/lib/richtext";

import { useEffect, useState } from "react";
import { moduleBySlug } from "@/lib/modules";
import { ENNEAGRAM_TYPES, typeByNumber } from "@/lib/enneagram";
import { loadDraft, saveDraft } from "@/lib/storage";
import ModuleGate from "./ModuleGate";
import ModuleHeader from "./ModuleHeader";
import VideoSlot from "./VideoSlot";
import CompleteBar from "./CompleteBar";
import IngredientCapture from "./IngredientCapture";
import Skeleton from "@/components/Skeleton";
import { sizeLabel } from "@/lib/clientFiles";

const DRAFT_KEY = "vcm-enneagram";

interface Upload {
  fileName: string;
  sizeKb: number;
  uploadedAt: string;
}

interface EnneagramDraft {
  typeNumber: number | null;
  upload: Upload | null;
  resonates: "yes" | "no" | null;
  resonateWhy: string;
  level: number | null;
  levelWhy: string;
  peakReflection: string;
  edgeReflection: string;
}

function emptyDraft(): EnneagramDraft {
  return {
    typeNumber: null,
    upload: null,
    resonates: null,
    resonateWhy: "",
    level: null,
    levelWhy: "",
    peakReflection: "",
    edgeReflection: "",
  };
}

export default function Enneagram() {
  const m = moduleBySlug("enneagram")!;
  const [draft, setDraft] = useState<EnneagramDraft | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const loaded = loadDraft<EnneagramDraft>(DRAFT_KEY);
    setDraft(loaded ? { ...emptyDraft(), ...loaded } : emptyDraft());
  }, []);

  useEffect(() => {
    if (draft) saveDraft(DRAFT_KEY, draft);
  }, [draft]);

  if (!draft) {
    return <div className="mx-auto max-w-3xl px-6 py-16"><Skeleton /></div>;
  }

  const update = (patch: Partial<EnneagramDraft>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const type = draft.typeNumber ? typeByNumber(draft.typeNumber) : undefined;

  function onFile(file: File | undefined) {
    if (!file) return;
    update({
      upload: {
        fileName: file.name,
        sizeKb: Math.round(file.size / 1024),
        uploadedAt: new Date().toISOString(),
      },
    });
    import("@/lib/sync").then(({ pushReportPdf }) =>
      pushReportPdf("enneagram", file)
    );
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

  const canComplete =
    !!draft.typeNumber &&
    !!draft.upload &&
    (draft.resonates === "yes" ||
      (draft.resonates === "no" && richHasText(draft.resonateWhy))) &&
    draft.level !== null;

  const typeCard = type && (
    <div className="mt-6 overflow-hidden rounded-xl bg-gradient-to-br from-navy-deep via-navy-deep-tint to-primary p-6 text-white">
      <div className="flex items-baseline gap-4">
        <span className="font-display text-5xl text-brass">{type.number}</span>
        <div>
          <p className="font-display text-2xl">
            {type.name}
            <span className="ml-3 font-sans text-lg font-normal italic text-brass">
              {type.need.toLowerCase()}
            </span>
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-3 text-lg leading-relaxed text-white/90">
        {type.summary.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
      <p className="mt-4 border-t border-white/15 pt-3 text-sm text-white/60">
        Summary informed by The Enneagram Institute&apos;s Type {type.number}{" "}
        profile.{" "}
        <a
          href={type.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brass underline hover:text-brass/80"
        >
          Explore the full profile ↗
        </a>
      </p>
    </div>
  );

  return (
    <ModuleGate slug="enneagram">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <ModuleHeader module={m} />
        <div className="mt-8">
          <VideoSlot title="The Enneagram" videoSrc="/videos/enneagram.mp4" />
        </div>

        <p className="mt-6 text-lg leading-relaxed text-foreground/85">
          The Big Five measured your temperament. The Enneagram goes after
          something different: the engine underneath: the core fear and core
          desire that have been driving the pattern all along. One more set of
          ingredients for articulating your VCM.
        </p>

        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-navy/15 bg-paper p-6">
            <p className="text-sm uppercase tracking-wider text-brass">
              Step 1
            </p>
            <h2 className="mt-1 font-display text-2xl text-navy">
              Take the RHETI
            </h2>
            <p className="mt-2 text-foreground/80">
              Take the official RHETI test at the Enneagram Institute: 144
              paired statements, about 40 quiet minutes. When you finish,
              download your PDF report: it scores you across all nine types.
            </p>
            <p className="mt-3 rounded-md bg-brass/10 px-4 py-2.5 text-sm text-navy">
              Heads up: the RHETI costs about $20, paid directly to the
              Enneagram Institute.
            </p>
            <a
              href="https://www.enneagraminstitute.com/rheti"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-md bg-primary px-5 py-2.5 text-white transition hover:bg-navy-deep"
            >
              Open enneagraminstitute.com ↗
            </a>
          </div>

          <div className="rounded-xl border border-navy/15 bg-paper p-6">
            <p className="text-sm uppercase tracking-wider text-brass">
              Step 2
            </p>
            <h2 className="mt-1 font-display text-2xl text-navy">
              Enter Your Result
            </h2>
            <div className="mt-4">
              <label className="text-sm font-medium text-navy">
                Your dominant type
              </label>
              <select
                value={draft.typeNumber ?? ""}
                onChange={(e) =>
                  update({ typeNumber: Number(e.target.value) || null })
                }
                className="mt-1 block rounded-md border border-navy/25 bg-paper px-4 py-2.5 text-navy outline-none focus:border-navy"
              >
                <option value="">Choose…</option>
                {ENNEAGRAM_TYPES.map((t) => (
                  <option key={t.number} value={t.number}>
                    {t.number} · {t.name} · {t.need.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              {draft.upload ? (
                <div
                  {...dropHandlers()}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 transition ${
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
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center text-sm transition ${
                    dragOver
                      ? "border-brass bg-brass/10"
                      : "border-navy/25 hover:border-navy/50"
                  }`}
                >
                  <span className="text-navy">
                    {dragOver
                      ? "Drop your PDF to upload it"
                      : "Drag and drop your RHETI PDF report here, or click to choose it"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
          </div>

          {typeCard}

          {type && (
            <>
              <div className="rounded-xl border border-navy/15 bg-paper p-6">
                <p className="text-sm uppercase tracking-wider text-brass">
                  Step 3
                </p>
                <h2 className="mt-1 font-display text-2xl text-navy">
                  Does the Engine Resonate?
                </h2>
                <p className="mt-2 text-foreground/80">
                  A fear of <em>{type.fear}</em>, driving a desire{" "}
                  <em>{type.desire}</em>. Does that engine sound like yours?
                </p>
                <div className="mt-4 flex gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => update({ resonates: v })}
                      className={`rounded-full px-6 py-2 text-sm capitalize transition ${
                        draft.resonates === v
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
                {draft.resonates === "no" && (
                  <div className="mt-4">
                    <label className="text-sm text-navy/70">If no, why?</label>
                    <RichTextArea
                      value={draft.resonateWhy}
                      onChange={(html) => update({ resonateWhy: html })}
                      placeholder=""
                      label="If no, why?"
                      minHeightClass="min-h-24"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-navy/15 bg-paper p-6">
                <p className="text-sm uppercase tracking-wider text-brass">
                  Step 4
                </p>
                <h2 className="mt-1 font-display text-2xl text-navy">
                  The Levels of Development
                </h2>
                <p className="mt-2 text-foreground/80">
                  Every type lives on a ladder. The same underlying pattern
                  can show up healthy, average, or unhealthy: same water,
                  different resolution. Read the nine levels of your type,
                  then answer honestly:{" "}
                  <strong className="text-navy">
                    What level best represents your current experience?
                  </strong>
                </p>

                <div className="mt-5 space-y-5">
                  {(["Healthy", "Average", "Unhealthy"] as const).map(
                    (group) => (
                      <div key={group}>
                        <p
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            group === "Healthy"
                              ? "text-navy"
                              : group === "Average"
                                ? "text-brass"
                                : "text-fuchsia"
                          }`}
                        >
                          {group} levels
                        </p>
                        <div className="mt-2 space-y-2">
                          {type.levels
                            .filter((l) => l.group === group)
                            .map((l) => (
                              <button
                                key={l.level}
                                onClick={() => update({ level: l.level })}
                                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                                  draft.level === l.level
                                    ? "border-navy bg-mist"
                                    : "border-navy/15 bg-paper hover:border-navy/40"
                                }`}
                              >
                                <span
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                    draft.level === l.level
                                      ? "bg-primary text-white"
                                      : "bg-mist text-navy/60"
                                  }`}
                                >
                                  {l.level}
                                </span>
                                <span className="flex-1">
                                  <span className="block text-[15px] font-medium leading-snug text-navy">
                                    {l.text}
                                  </span>
                                  <span className="mt-1 block text-[14px] leading-snug text-foreground/70">
                                    {l.detail}
                                  </span>
                                </span>
                                <span
                                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                                    draft.level === l.level
                                      ? "bg-accent text-white"
                                      : "border border-navy/25 text-navy/60"
                                  }`}
                                >
                                  {draft.level === l.level
                                    ? "My match"
                                    : "Select"}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-5 border-t border-navy/10 pt-4">
                  <p className="text-sm text-navy/55">
                    Levels adapted from the Riso-Hudson Levels of Development, ©
                    The Enneagram Institute.
                  </p>
                  <a
                    href={type.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block rounded-md bg-primary px-5 py-2.5 text-sm text-white transition hover:bg-navy-deep"
                  >
                    Read the original ↗
                  </a>
                </div>
              </div>

            </>
          )}
        </div>

        <IngredientCapture
          prompt="Sit with what your type revealed about how you create value. Write down a few words or phrases that capture what stood out and will help you return to these insights later. There is no right number, and you can always add more."
          source="enneagram"
        />

        <CompleteBar
          slug="enneagram"
          actionLabel="Complete this module"
          canComplete={canComplete}
          blockedHint="Enter your type, upload your report, answer the resonance check, select your level, write your peak reflection, and add at least 3 ingredients to finish."
        />
      </div>
    </ModuleGate>
  );
}
