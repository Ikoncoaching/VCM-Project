/**
 * Big Five report parsing (understandmyself.com PDF reports).
 * Extraction happens entirely in the browser; the PDF is never uploaded
 * to a server. Parsed percentiles are shown to the member for
 * confirmation and can be corrected manually.
 */

export interface TraitDef {
  trait: string;
  aspects: [string, string];
}

export const BIG_FIVE: TraitDef[] = [
  { trait: "Agreeableness", aspects: ["Compassion", "Politeness"] },
  { trait: "Extraversion", aspects: ["Enthusiasm", "Assertiveness"] },
  { trait: "Conscientiousness", aspects: ["Industriousness", "Orderliness"] },
  { trait: "Openness to Experience", aspects: ["Openness", "Intellect"] },
  { trait: "Neuroticism", aspects: ["Withdrawal", "Volatility"] },
];

export const ALL_SCALE_NAMES: string[] = BIG_FIVE.flatMap((t) => [
  t.trait,
  ...t.aspects,
]);

export type Scores = Record<string, number | null>;

export function emptyScores(): Scores {
  return Object.fromEntries(ALL_SCALE_NAMES.map((n) => [n, null]));
}

/** ordinal or bare number followed by "percentile", e.g. "92nd percentile" */
const PCT = "(\\d{1,3})(?:\\s*(?:st|nd|rd|th))?\\s+percentile";

/**
 * What understandmyself.com calls each scale. Its report renames two of them
 * from the original Big Five Aspects Scale: the factor is "Openness" (not
 * "Openness to Experience"), and that factor's aspects are "Intellect" and
 * "Aesthetics" (what the original called "Openness"). Without these the two
 * openness rows come back blank, or the aspect steals the factor's score.
 */
const ALIASES: Record<string, string[]> = {
  "Openness to Experience": ["openness to experience", "openness"],
  // newer reports call this aspect "aesthetics"; older ones keep "openness",
  // which is why bare "openness" is tried last, and only for the aspect
  Openness: ["aesthetics", "openness/aesthetics", "openness"],
};

const aliasesFor = (name: string) => ALIASES[name] ?? [name.toLowerCase()];

/**
 * Match a scale name even when the PDF has broken it across text fragments.
 * pdfjs emits text run by run, and where a run splits mid-word (which depends
 * on the fonts available on the reader's machine, so it varies from computer
 * to computer) joining the runs inserts a space inside the word: "compassion"
 * arrives as "com passion". Allowing optional whitespace between characters
 * makes the match survive that.
 */
const esc = (s: string) =>
  s
    .split("")
    .map((ch) =>
      /\s/.test(ch) ? "\\s+" : ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    .join("\\s*");

/** bare "openness" must not match the factor "openness to experience" */
const guard = (alias: string) =>
  alias === "openness" ? "(?!\\s+to\\s+experience)" : "";

/**
 * The report states each score as "Your score puts you at the 35th percentile
 * for agreeableness" — the scale name comes AFTER the number, and a sentence
 * boundary usually sits between the two. This is the authoritative phrasing,
 * so try it first.
 */
function findByPercentileFor(text: string, name: string): number | null {
  for (const alias of aliasesFor(name)) {
    const re = new RegExp(
      `${PCT}\\s+for\\s+(?:the\\s+)?${esc(alias)}\\b${guard(alias)}`,
      "gi"
    );
    const hits: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const v = Number(m[1]);
      if (v >= 0 && v <= 100) hits.push(v);
    }
    if (hits.length) return hits[0];
  }
  return null;
}

/** Fallback: the scale name shortly before a percentile, the older phrasing. */
function findNameBefore(text: string, name: string, exclude?: RegExp): number | null {
  for (const alias of aliasesFor(name)) {
    const re = new RegExp(`${esc(alias)}\\b${guard(alias)}[^.]{0,160}?${PCT}`, "gi");
    const candidates: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (exclude && exclude.test(m[0])) continue;
      const v = Number(m[1]);
      if (v >= 0 && v <= 100) candidates.push(v);
    }
    if (candidates.length) {
      // the member's own score is the most-repeated number near the name
      const freq = new Map<number, number>();
      for (const c of candidates) freq.set(c, (freq.get(c) ?? 0) + 1);
      return [...freq.entries()].sort((a, b) => b[1] - a[1] || 0)[0][0];
    }
  }
  return null;
}

/**
 * Last resort for the five factors: the "my scores" summary on page one, a
 * bare list like "Agreeableness 35 Extraversion 89 ...".
 */
function findInSummary(text: string, name: string): number | null {
  const i = text.toLowerCase().indexOf("my scores");
  if (i === -1) return null;
  const block = text.slice(i, i + 400);
  for (const alias of aliasesFor(name)) {
    const m = new RegExp(
      `${esc(alias)}\\b${guard(alias)}\\s+(\\d{1,3})\\b`,
      "i"
    ).exec(block);
    if (m) {
      const v = Number(m[1]);
      if (v >= 0 && v <= 100) return v;
    }
  }
  return null;
}

/**
 * pdfjs maps some ligatures to characters that break word matching: the "fi"
 * in "scientific" comes through as a NUL. Repair those before parsing.
 */
function normalize(raw: string): string {
  return raw
    .replace(/\u0000/g, "fi")
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/\s+/g, " ");
}

export function parseReportText(raw: string): Scores {
  const text = normalize(raw);
  const scores = emptyScores();
  for (const { trait, aspects } of BIG_FIVE) {
    scores[trait] =
      findByPercentileFor(text, trait) ??
      findNameBefore(text, trait) ??
      findInSummary(text, trait);
    for (const aspect of aspects) {
      // the aspect "Openness" must not swallow the factor "Openness to Experience"
      const exclude =
        aspect === "Openness" ? /openness\s+to\s+experience/i : undefined;
      scores[aspect] =
        findByPercentileFor(text, aspect) ??
        findNameBefore(text, aspect, exclude);
    }
  }
  return scores;
}

/** extract text from a PDF file in the browser via pdfjs-dist */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() })
    .promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((it) => ("str" in it ? (it as { str: string }).str : ""))
        .join(" ")
    );
  }
  return pages.join("\n");
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
