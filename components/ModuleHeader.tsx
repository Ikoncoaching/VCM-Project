"use client";

import Link from "next/link";
import { MODULES, type ModuleDef } from "@/lib/modules";
import { useProgress } from "@/lib/progress";
import BackHome from "./BackHome";

export default function ModuleHeader({ module: m }: { module: ModuleDef }) {
  const { isCompleted } = useProgress();
  const prev = MODULES.find((x) => x.number === m.number - 1);
  const next = MODULES.find((x) => x.number === m.number + 1);
  // the forward link only appears once the next module has been completed
  const showNext = next && isCompleted(next.slug);

  return (
    <div>
      <div className="flex justify-end">
        <BackHome />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
        <Link href="/journey/modules" className="text-sm text-navy/60 hover:text-navy">
          ← All modules
        </Link>
        {prev && (
          <Link href={`/journey/${prev.slug}`} className="text-sm text-navy/60 hover:text-navy">
            ← Back: {prev.title}
          </Link>
        )}
        {showNext && (
          <Link href={`/journey/${next.slug}`} className="text-sm text-navy/60 hover:text-navy">
            Next: {next.title} →
          </Link>
        )}
      </div>
      {/* where they are in the journey, as a shape rather than a sentence */}
      <div className="mt-6 flex items-center gap-3">
        <p className="text-sm uppercase tracking-[0.25em] text-brass">
          Module {m.number} of {MODULES.length}
        </p>
        <div className="flex flex-1 items-center gap-1.5">
          {MODULES.map((x) => {
            const state =
              x.number === m.number
                ? "bg-accent"
                : isCompleted(x.slug)
                  ? "bg-navy/45"
                  : "bg-navy/12";
            return (
              <span
                key={x.slug}
                title={`${x.number}. ${x.title}`}
                className={`h-1.5 flex-1 rounded-full ${state}`}
              />
            );
          })}
        </div>
      </div>
      <h1 className="mt-2 font-display text-4xl text-navy">{m.title}</h1>
      <p className="mt-2 text-lg text-navy/70">{m.subtitle}</p>
    </div>
  );
}
