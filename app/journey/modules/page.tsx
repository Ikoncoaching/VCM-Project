"use client";

import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { useProgress } from "@/lib/progress";
import { useAuth } from "@/components/AuthProvider";
import Skeleton from "@/components/Skeleton";

export default function JourneyModulesPage() {
  const { ready, isCompleted, isUnlocked, completed } = useProgress();
  const { enabled, loading, profile } = useAuth();

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-6 py-16"><Skeleton /></div>;
  }

  const done = completed.length;
  const allDone = done === MODULES.length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/journey?stay=1"
        className="text-sm text-navy/60 hover:text-navy"
      >
        ← Overview
      </Link>
      <h1 className="mt-4 font-display text-4xl text-navy">Your Journey</h1>
      <p className="mt-3 text-navy/70">
        Modules open in order as you complete each one.
      </p>

      {enabled && !loading && !profile && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brass/50 bg-brass/10 p-4">
          <p className="text-navy">
            <strong>Sign in to save your work.</strong> Right now it only
            lives in this browser.
          </p>
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-navy-deep"
          >
            Sign in
          </Link>
        </div>
      )}

      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-mist">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(done / MODULES.length) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-navy/60">
        {done} of {MODULES.length} complete
      </p>

      <ol className="relative mt-10 space-y-4">
        <div
          className="absolute bottom-10 left-[37px] top-10 border-l-2 border-dashed border-brass/70"
          aria-hidden="true"
        />
        {MODULES.map((m) => {
          const completedM = isCompleted(m.slug);
          const unlocked = isUnlocked(m.slug);
          const current = unlocked && !completedM;

          const inner = (
            <div
              className={`flex items-start gap-5 rounded-xl border p-5 transition ${
                current
                  ? "border-navy/30 bg-paper shadow-sm hover:border-navy/60"
                  : completedM
                    ? "border-navy/10 bg-paper hover:border-navy/40"
                    : "border-navy/10 bg-sand opacity-60"
              }`}
            >
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                  completedM
                    ? "bg-accent text-white"
                    : current
                      ? "bg-primary text-white"
                      : "bg-mist text-navy/50"
                }`}
              >
                {completedM ? "✓" : m.number}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h2 className="font-display text-xl text-navy">{m.title}</h2>
                  <span className="text-xs uppercase tracking-wider text-navy/50">
                    {m.kind === "watch" ? "watch" : "exercise"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-navy/70">{m.subtitle}</p>
                <p className="mt-1 text-sm text-navy/50">{m.cardBlurb}</p>
              </div>
              <div className="ml-auto self-center text-sm text-navy/50">
                {completedM ? "Review" : current ? "Start →" : "Locked"}
              </div>
            </div>
          );

          return (
            <li key={m.slug}>
              {unlocked ? (
                <Link href={`/journey/${m.slug}`}>{inner}</Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ol>

      {allDone && (
        <div className="mt-10 rounded-xl border border-brass/40 bg-brass/10 p-6">
          <h2 className="font-display text-2xl text-navy">
            You&apos;ve Completed the Journey
          </h2>
          <p className="mt-2 text-navy/75">
            Your Big Five report, word constellation, and tool are the raw
            material for the conversations ahead.
          </p>
        </div>
      )}
    </div>
  );
}
