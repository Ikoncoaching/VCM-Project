"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A tiny cross-component store for "have I watched this video" flags, keyed by
 * a stable video id. Persists to localStorage and syncs to the server like the
 * module drafts (see DRAFT_KEYS["vcm-watched"]). Any number of VideoSlots can
 * read and write it; they stay in step via a window event.
 */
const KEY = "vcm-watched";
const EVENT = "vcm-watched-change";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

function write(list: string[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // best effort locally
  }
  import("@/lib/sync")
    .then(({ pushDraft }) => pushDraft(KEY, list))
    .catch(() => {});
  window.dispatchEvent(new Event(EVENT));
}

/** Returns [watched, setWatched] for one video id. An empty id is inert. */
export function useWatched(id: string) {
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setList(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("vcm-hydrated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("vcm-hydrated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const watched = id ? list.includes(id) : false;

  const setWatched = useCallback(
    (value: boolean) => {
      if (!id) return;
      const cur = read();
      const next = value
        ? cur.includes(id)
          ? cur
          : [...cur, id]
        : cur.filter((x) => x !== id);
      write(next);
      setList(next);
    },
    [id]
  );

  return [watched, setWatched] as const;
}
