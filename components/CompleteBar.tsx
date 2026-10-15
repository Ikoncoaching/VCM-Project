"use client";

import Link from "next/link";
import { nextModule } from "@/lib/modules";
import { useProgress } from "@/lib/progress";

interface CompleteBarProps {
  slug: string;
  /** Label for the completion button, e.g. "Mark as watched" */
  actionLabel: string;
  /** Completion is allowed only when this is true */
  canComplete?: boolean;
  /** Hint shown when completion is not yet allowed */
  blockedHint?: string;
  /** What is still outstanding, listed so they know exactly what to finish */
  blockedItems?: string[];
}

export default function CompleteBar({
  slug,
  actionLabel,
  canComplete = true,
  blockedHint,
  blockedItems,
}: CompleteBarProps) {
  const { isCompleted, markComplete } = useProgress();
  const next = nextModule(slug);
  const done = isCompleted(slug);

  return (
    <div className="mt-10 rounded-xl border border-navy/15 bg-paper p-5">
      {done ? (
        // a finished module should feel like something happened, and should
        // hand them straight to whatever comes next
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-lg text-white">
              ✓
            </span>
            <div>
              <p className="font-display text-xl text-navy">
                {next ? "That's another one done" : "That's the whole journey"}
              </p>
              <p className="text-sm text-navy/60">
                {next
                  ? `Module ${next.number} is open: ${next.title}.`
                  : "Every module complete. Go back and reread what you wrote."}
              </p>
            </div>
          </div>
          {next ? (
            <Link
              href={`/journey/${next.slug}`}
              className="rounded-md bg-primary px-5 py-2.5 text-white transition hover:bg-navy-deep"
            >
              Keep going: {next.title} →
            </Link>
          ) : (
            <Link href="/journey/modules" className="text-navy underline">
              Back to your journey
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-navy/60">
              {canComplete
                ? next
                  ? `Completing this unlocks module ${next.number}: ${next.title}.`
                  : "This is the final module."
                : (blockedHint ?? "Finish the work above to continue.")}
            </p>
            <button
              onClick={() => markComplete(slug)}
              disabled={!canComplete}
              className="rounded-md bg-primary px-5 py-2.5 text-white transition hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              {actionLabel}
            </button>
          </div>

          {/* name what is outstanding, so nothing has to be hunted for */}
          {!canComplete && blockedItems && blockedItems.length > 0 && (
            <div className="mt-4 rounded-lg border border-brass/40 bg-brass/5 p-4">
              <p className="text-sm font-medium text-navy">
                Still to finish:
              </p>
              <ul className="mt-2 space-y-1.5">
                {blockedItems.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm leading-relaxed text-navy/75"
                  >
                    <span aria-hidden="true" className="text-brass">
                      •
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
