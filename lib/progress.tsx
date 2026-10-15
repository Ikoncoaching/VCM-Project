"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { MODULES, legacyWatchedVideos, migrateCompleted } from "./modules";
import { scopedKey } from "./storage";

const STORAGE_KEY = "vcm-progress";
const INTRO_KEY = "vcm-introduction";

/**
 * Modules 1–3 merged into one Introduction module: rewrite an old completion
 * list to the new shape and seed the intro watched-video checklist from any
 * old watch-module completions. Safe to run repeatedly.
 */
export function applyProgressMigration(raw: string[]): string[] {
  const seed = legacyWatchedVideos(raw);
  let watched: string[] = [];
  try {
    const existing = JSON.parse(
      window.localStorage.getItem(scopedKey(INTRO_KEY)) ?? "{}"
    ) as { watched?: string[] };
    watched = [...new Set([...(existing.watched ?? []), ...seed])];
    if (seed.length > 0) {
      window.localStorage.setItem(
        scopedKey(INTRO_KEY),
        JSON.stringify({ ...existing, watched })
      );
    }
  } catch {
    // best effort
  }
  const migrated = migrateCompleted(raw, watched);
  try {
    window.localStorage.setItem(scopedKey(STORAGE_KEY), JSON.stringify(migrated));
  } catch {
    // best effort
  }
  return migrated;
}

interface ProgressState {
  ready: boolean;
  completed: string[];
  isCompleted: (slug: string) => boolean;
  isUnlocked: (slug: string) => boolean;
  markComplete: (slug: string) => void;
  /** the reverse: uncheck a module the client marked done by mistake */
  markIncomplete: (slug: string) => void;
}

const ProgressContext = createContext<ProgressState | null>(null);

/**
 * A user's completed module slugs from the server, readable by the owner and
 * by the coach (RLS), so the portal's section strip counts the same for a
 * client and for view-as. Fails soft to empty.
 */
export async function getCompletedSlugs(userId: string): Promise<Set<string>> {
  const { supabase } = await import("./supabase/client");
  const sb = supabase();
  if (!sb) return new Set();
  const { data } = await sb
    .from("module_progress")
    .select("slug")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.slug));
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function refresh() {
      try {
        // the client's list while the coach is inside their workspace
        const raw = window.localStorage.getItem(scopedKey(STORAGE_KEY));
        setCompleted(raw ? applyProgressMigration(JSON.parse(raw) as string[]) : []);
      } catch {
        setCompleted([]);
      }
      setReady(true);
    }
    // read now, then re-read once the server finishes hydrating localStorage
    // after a fresh sign-in (signOut clears it, so the first read is empty)
    refresh();
    window.addEventListener("vcm-hydrated", refresh);
    return () => window.removeEventListener("vcm-hydrated", refresh);
  }, []);

  const markComplete = useCallback((slug: string) => {
    setCompleted((prev) => {
      if (prev.includes(slug)) return prev;
      const next = [...prev, slug];
      try {
        window.localStorage.setItem(scopedKey(STORAGE_KEY), JSON.stringify(next));
      } catch {
        // best-effort locally
      }
      return next;
    });
    // mirror to the backend when configured (no-op otherwise)
    import("./sync").then(({ pushCompletion }) => pushCompletion(slug));
  }, []);

  const markIncomplete = useCallback((slug: string) => {
    setCompleted((prev) => {
      if (!prev.includes(slug)) return prev;
      const next = prev.filter((s) => s !== slug);
      try {
        window.localStorage.setItem(scopedKey(STORAGE_KEY), JSON.stringify(next));
      } catch {
        // best-effort locally
      }
      return next;
    });
    import("./sync").then(({ pullCompletion }) => pullCompletion(slug));
  }, []);

  const isCompleted = useCallback(
    (slug: string) => completed.includes(slug),
    [completed]
  );

  const isUnlocked = useCallback(
    (slug: string) => {
      const m = MODULES.find((x) => x.slug === slug);
      if (!m) return false;
      // a completed module never re-locks, even if a new module was
      // inserted before it after the fact
      if (completed.includes(slug)) return true;
      if (m.number === 1) return true;
      const prev = MODULES.find((x) => x.number === m.number - 1);
      return prev ? completed.includes(prev.slug) : false;
    },
    [completed]
  );

  return (
    <ProgressContext.Provider
      value={{
        ready,
        completed,
        isCompleted,
        isUnlocked,
        markComplete,
        markIncomplete,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressState {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
