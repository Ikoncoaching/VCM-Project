"use client";

import {
  BIG_FIVE,
  emptyScores,
  extractPdfText,
  parseReportText,
  type Scores,
} from "./bigfive";
import { loadDraft, saveDraft } from "./storage";

/**
 * The Understand Myself report: where it is stored and how it is recorded.
 *
 * Two modules collect the same report (the standalone survey in the intro
 * section and VCM module 3.2), and a client pays for the assessment once, so
 * both write the same PDF and the same draft. Uploading in either place shows
 * up as done in the other. Everything that has to agree between them lives
 * here; each module only decides how to present it.
 */

export const BIG_FIVE_DRAFT_KEY = "vcm-big-five";

/** the report lives at reports/{user_id}/big-five.pdf */
export const BIG_FIVE_REPORT_SLUG = "big-five";

export interface BigFiveUpload {
  fileName: string;
  sizeKb: number;
  uploadedAt: string;
}

export type Resonance = Record<string, "yes" | "no" | null>;
export type Whys = Record<string, string>;
export type ParseStatus = "none" | "parsed" | "failed";

export interface BigFiveDraft {
  upload: BigFiveUpload | null;
  resonance: Resonance;
  whys: Whys;
  scores: Scores;
  parseStatus: ParseStatus;
}

export function emptyResonance(): Resonance {
  return Object.fromEntries(BIG_FIVE.map((t) => [t.trait, null]));
}

export function loadBigFiveDraft(): BigFiveDraft {
  const raw = loadDraft<Record<string, unknown>>(BIG_FIVE_DRAFT_KEY);
  const base: BigFiveDraft = {
    upload: null,
    resonance: emptyResonance(),
    whys: {},
    scores: emptyScores(),
    parseStatus: "none",
  };
  if (!raw) return base;
  if ("fileName" in raw)
    return { ...base, upload: raw as unknown as BigFiveUpload };
  const loaded = raw as Partial<BigFiveDraft>;
  const resonance = { ...emptyResonance(), ...(loaded.resonance ?? {}) };
  // older drafts keyed this trait as plain "Openness"
  const legacy = (loaded.resonance ?? {}) as Record<string, "yes" | "no" | null>;
  if (
    legacy["Openness"] !== undefined &&
    resonance["Openness to Experience"] === null
  ) {
    resonance["Openness to Experience"] = legacy["Openness"];
  }
  return {
    ...base,
    upload: loaded.upload ?? null,
    resonance,
    whys: loaded.whys ?? {},
    scores: { ...emptyScores(), ...(loaded.scores ?? {}) },
    parseStatus: loaded.parseStatus ?? "none",
  };
}

/** what the reader sees about the file they just chose */
export function uploadMeta(file: File): BigFiveUpload {
  return {
    fileName: file.name,
    sizeKb: Math.round(file.size / 1024),
    uploadedAt: new Date().toISOString(),
  };
}

/** send the PDF to private storage; fire and forget, as the modules do */
export function pushReport(file: File): void {
  import("./sync").then(({ pushReportPdf }) =>
    pushReportPdf(BIG_FIVE_REPORT_SLUG, file)
  );
}

/** read the percentiles out of the PDF, in the browser */
export async function readReport(
  file: File
): Promise<{ scores: Scores; parseStatus: ParseStatus }> {
  try {
    const scores = parseReportText(await extractPdfText(file));
    const found = Object.values(scores).filter((v) => v !== null).length;
    return found > 0
      ? { scores, parseStatus: "parsed" }
      : { scores: emptyScores(), parseStatus: "failed" };
  } catch {
    return { scores: emptyScores(), parseStatus: "failed" };
  }
}

/**
 * Record a report end to end and persist it: store the file, note the upload,
 * and read the percentiles into the shared draft so module 3.2 can prefill
 * them. Used by the standalone survey, which keeps no state of its own; 3.2
 * drives the same steps through its own React state instead.
 */
export async function recordReport(file: File): Promise<BigFiveUpload> {
  const upload = uploadMeta(file);
  saveDraft(BIG_FIVE_DRAFT_KEY, { ...loadBigFiveDraft(), upload });
  pushReport(file);

  const { scores, parseStatus } = await readReport(file);
  // re-read: the parse is slow enough that 3.2 may have written in between
  const current = loadBigFiveDraft();
  saveDraft(BIG_FIVE_DRAFT_KEY, {
    ...current,
    upload,
    scores: parseStatus === "parsed" ? scores : current.scores,
    parseStatus,
  });
  return upload;
}
