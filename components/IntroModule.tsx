"use client";

import { useState } from "react";
import { INTRO_VIDEOS, moduleBySlug } from "@/lib/modules";
import ModuleGate from "./ModuleGate";
import ModuleHeader from "./ModuleHeader";
import VideoSlot from "./VideoSlot";
import CompleteBar from "./CompleteBar";
import ConsiderYourHistory from "./LookBackwards";

/**
 * The merged Introduction module: three watch-only videos followed by the
 * Consider Your History journaling exercise. The videos are not ticked off
 * one by one; completing the module rests on the journaling harvest.
 */
export default function IntroModule() {
  const m = moduleBySlug("introduction");
  const [historyDone, setHistoryDone] = useState(false);

  if (!m) return null;

  return (
    <ModuleGate slug="introduction">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <ModuleHeader module={m} />
        <p className="mt-6 text-lg leading-relaxed text-foreground/85">
          Three short films to set the table: the big picture first, then two
          metaphors that will change what you notice. Watch them, then roll up
          your sleeves. The journaling below is where this starts becoming
          yours.
        </p>

        <ol className="mt-12 space-y-14">
          {INTRO_VIDEOS.map((v, i) => (
            <li key={v.id}>
              <p className="text-xs uppercase tracking-[0.25em] text-brass">
                Film {i + 1} of {INTRO_VIDEOS.length}
              </p>
              <h2 className="mt-1.5 font-display text-3xl text-navy">
                {v.title}
              </h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-foreground/80">
                {v.framing}
              </p>
              <div className="mt-5">
                <VideoSlot title={v.title} videoSrc={v.videoSrc} />
              </div>
            </li>
          ))}
        </ol>

        <ConsiderYourHistory onDoneChange={setHistoryDone} />

        <CompleteBar
          slug="introduction"
          actionLabel="Complete Introduction"
          canComplete={historyDone}
          blockedHint="Harvest at least 5 ingredients below to finish."
        />
      </div>
    </ModuleGate>
  );
}
