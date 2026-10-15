"use client";

import { useEffect, useState } from "react";
import type { SaveState } from "@/lib/sync";

/**
 * A quiet line telling a client their work is safe.
 *
 * The saving has always happened; what was missing was any evidence of it, so
 * the page asked for trust it never earned. This listens to the sync layer and
 * says what is actually true, including when a save fails.
 *
 * Idle shows the plain promise rather than a stale "Saved", so a client
 * returning to a page they finished last week is not told something odd.
 *
 * Without a draftKey it is the workspace-wide receipt instead: mounted once
 * in the shell, it listens to every module's saves and floats a small pill
 * over the corner of the page. Idle renders nothing, so pages where nothing
 * saves never make a promise they cannot demonstrate. Bookkeeping keys are
 * ignored: opening a page records itself through the same pipe, and "Saved"
 * on arrival, before a word is typed, reads as a glitch.
 */

/** keys that record housekeeping, not work a client typed */
const BOOKKEEPING = new Set([
  "vcm-opened",
  "vcm-sections",
  "vcm-coach-seen",
  "vcm-coach-reviewed",
]);

export default function SaveStatus({ draftKey }: { draftKey?: string }) {
  const [state, setState] = useState<SaveState | null>(null);
  const [at, setAt] = useState<Date | null>(null);
  // re-render every 30s so "Saved 2 minutes ago" keeps up with the clock
  const [, tick] = useState(0);

  useEffect(() => {
    const onState = (e: Event) => {
      const d = (e as CustomEvent<{ key: string; state: SaveState }>).detail;
      if (!d) return;
      if (draftKey ? d.key !== draftKey : BOOKKEEPING.has(d.key)) return;
      setState(d.state);
      if (d.state === "saved") setAt(new Date());
    };
    window.addEventListener("vcm-save-state", onState);
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => {
      window.removeEventListener("vcm-save-state", onState);
      clearInterval(t);
    };
  }, [draftKey]);

  // the floating pill: nothing until a save happens, then the same three
  // states in a corner card that stays put as the page scrolls
  if (!draftKey) {
    if (state === null) return null;
    return (
      <div
        role="status"
        className="fixed bottom-4 right-4 z-40 rounded-full border border-navy/15 bg-paper px-4 py-2 text-sm shadow-md"
      >
        {state === "saving" ? (
          <span className="flex items-center gap-2 text-navy/70">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass"
            />
            Saving...
          </span>
        ) : state === "error" ? (
          <span className="text-red-700">
            Not synced. Your work is safe on this device.
          </span>
        ) : (
          <span className="text-navy/70">
            <span className="text-brass" aria-hidden="true">
              &#10003;
            </span>{" "}
            Saved{at ? ` ${ago(at)}` : ""}
          </span>
        )}
      </div>
    );
  }

  if (state === "saving") {
    return (
      <p className="mt-2 flex items-center gap-2 text-navy/60">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass"
        />
        Saving...
      </p>
    );
  }

  if (state === "error") {
    return (
      <p className="mt-2 text-red-700" role="status">
        We could not reach the server just now. Your work is safe on this
        device and will sync when you are back online.
      </p>
    );
  }

  if (state === "saved") {
    return (
      <p className="mt-2 text-navy/60" role="status">
        <span className="text-brass" aria-hidden="true">
          &#10003;
        </span>{" "}
        Saved{at ? ` ${ago(at)}` : ""}, and synced to your other devices.
      </p>
    );
  }

  return (
    <p className="mt-2 text-navy/60">
      Your work saves automatically and syncs across your devices.
    </p>
  );
}

/** "just now" for the first minute, then minutes, then the clock time */
function ago(when: Date): string {
  const mins = Math.floor((Date.now() - when.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins === 1) return "a minute ago";
  if (mins < 60) return `${mins} minutes ago`;
  return `at ${when.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
