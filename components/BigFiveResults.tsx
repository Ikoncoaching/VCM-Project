"use client";

import { BIG_FIVE, ordinal } from "@/lib/bigfive";

/**
 * A client's Big Five, grouped the way the assessment is structured: each of
 * the five traits, then its two sub-aspects underneath.
 *
 * The generic renderer could only list fifteen percentiles in whatever order
 * they were stored, which says nothing about which aspect belongs to which
 * trait. That grouping is the whole point of the instrument.
 *
 * Shared by the coach's program view and the module work page.
 */

export interface BigFiveData {
  scores?: Record<string, number | null>;
  resonance?: Record<string, string>;
  whys?: Record<string, string>;
}

/**
 * What understandmyself.com calls each scale, which is what the client reads on
 * their own PDF. The stored keys keep the original Aspect Scale names, since
 * that is what the parser writes and the client confirmed, so only the labels
 * are translated here.
 */
const LABELS: Record<string, string> = {
  "Openness to Experience": "Openness",
  Openness: "Aesthetics",
};
const label = (name: string) => LABELS[name] ?? name;

export default function BigFiveResults({
  data,
  pdfUrl,
  className = "",
}: {
  data: BigFiveData | undefined;
  pdfUrl?: string;
  className?: string;
}) {
  const scores = data?.scores;
  if (!scores || Object.keys(scores).length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-navy/15 bg-paper p-6 ${className}`}
    >
      <p className="text-sm uppercase tracking-wider text-brass">Big Five</p>

      <div className="mt-3 divide-y divide-navy/10">
        {BIG_FIVE.map((t) => {
          const traitScore = scores[t.trait];
          const resonance = data?.resonance?.[t.trait];
          return (
            <div key={t.trait} className="py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-lg text-navy">
                  {label(t.trait)}
                </p>
                <span className="flex items-center gap-2">
                  {resonance && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${
                        resonance === "yes"
                          ? "bg-mist text-navy/70"
                          : "bg-brass/20 text-brass"
                      }`}
                    >
                      {resonance === "yes" ? "resonated" : "did not resonate"}
                    </span>
                  )}
                  {traitScore != null && (
                    <span className="rounded-full bg-primary px-3 py-0.5 text-sm font-semibold text-white">
                      {ordinal(traitScore)}
                    </span>
                  )}
                </span>
              </div>

              <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {t.aspects.map((a) => (
                  <div
                    key={a}
                    className="flex items-baseline justify-between gap-3 border-l-2 border-navy/10 pl-3"
                  >
                    <dt className="text-sm text-navy/70">{label(a)}</dt>
                    <dd className="shrink-0 text-sm font-medium text-navy">
                      {scores[a] != null ? ordinal(scores[a]!) : "not given"}
                    </dd>
                  </div>
                ))}
              </dl>

              {resonance === "no" && data?.whys?.[t.trait] && (
                <p className="mt-2 border-l-2 border-brass/40 pl-3 text-sm italic text-navy/70">
                  {data.whys[t.trait]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {pdfUrl && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-navy underline"
        >
          View full report PDF ↗
        </a>
      )}
    </div>
  );
}
