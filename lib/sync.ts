"use client";

import { supabase, backendEnabled } from "./supabase/client";
import { unscopeKey, actingAsUser } from "./storage";

/**
 * localStorage keys that hold module work, mapped to module_data slugs.
 * The slugs match Atlas, where these modules came from, so work could be
 * moved between the two if that is ever wanted.
 */
export const DRAFT_KEYS: Record<string, string> = {
  "vcm-introduction": "introduction",
  "vcm-look-backwards": "look-backwards",
  "vcm-big-five": "big-five",
  "vcm-enneagram": "enneagram",
  "vcm-words-i-like": "words-i-like",
  "vcm-pick-your-tool": "pick-your-tool",
  "vcm-articulate": "articulate",
  "vcm-watched": "watched",
};

const PROGRESS_KEY = "vcm-progress";

/**
 * Pull the signed-in person's work and progress down from the server into
 * localStorage (server wins). The module components keep reading
 * localStorage exactly as before; they never need to know about the backend.
 */
export async function hydrateFromServer(userId: string): Promise<void> {
  const sb = supabase();
  if (!sb) return;

  const [{ data: rows }, { data: progress }] = await Promise.all([
    sb.from("module_data").select("slug, data").eq("user_id", userId),
    sb.from("module_progress").select("slug").eq("user_id", userId),
  ]);

  for (const row of rows ?? []) {
    const key = Object.keys(DRAFT_KEYS).find((k) => DRAFT_KEYS[k] === row.slug);
    if (!key) continue;
    try {
      window.localStorage.setItem(key, JSON.stringify(row.data));
    } catch {
      // best effort
    }
  }
  if (progress) {
    try {
      window.localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify(progress.map((p) => p.slug))
      );
    } catch {
      // best effort
    }
    const { applyProgressMigration } = await import("./progress");
    applyProgressMigration(progress.map((p) => p.slug));
  }

  // localStorage is now populated. Tell any React state that read it before
  // hydration finished (the progress context, module drafts) to re-read.
  window.dispatchEvent(new Event("vcm-hydrated"));
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** what the save indicator shows; "saving" covers the debounce wait too */
export type SaveState = "saving" | "saved" | "error";

/** the newest value handed to pushDraft per key, so a flush can send it */
const pending = new Map<string, unknown>();

export function announce(storageKey: string, state: SaveState): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("vcm-save-state", { detail: { key: storageKey, state } })
  );
}

async function send(storageKey: string): Promise<void> {
  const { baseKey } = unscopeKey(storageKey);
  const slug = DRAFT_KEYS[baseKey];
  if (!slug || !pending.has(storageKey)) return;
  const value = pending.get(storageKey);
  const sb = supabase();
  if (!sb) return;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return;
  const { error } = await sb.from("module_data").upsert({
    user_id: auth.user.id,
    slug,
    data: value,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    // leave it pending: the next keystroke, or the next flush, retries it
    announce(storageKey, "error");
    return;
  }
  pending.delete(storageKey);
  announce(storageKey, "saved");
}

/**
 * Push everything still waiting on its debounce. Without this, work typed in
 * the last second before a tab closes reaches localStorage but never the
 * server, so it is there on this device and missing on the next one.
 */
export function flushDrafts(): void {
  for (const key of [...timers.keys()]) {
    clearTimeout(timers.get(key));
    timers.delete(key);
    void send(key);
  }
}

let flushBound = false;
function bindFlush(): void {
  if (flushBound || typeof window === "undefined") return;
  flushBound = true;
  window.addEventListener("pagehide", flushDrafts);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushDrafts();
  });
}

/** debounced upsert of one module's draft to the server */
export function pushDraft(storageKey: string, value: unknown): void {
  if (!backendEnabled) return;
  const { baseKey } = unscopeKey(storageKey);
  if (!DRAFT_KEYS[baseKey]) return;
  bindFlush();
  pending.set(storageKey, value);
  announce(storageKey, "saving");
  clearTimeout(timers.get(storageKey));
  timers.set(
    storageKey,
    setTimeout(() => {
      timers.delete(storageKey);
      void send(storageKey);
    }, 1200)
  );
}

/** record a module completion on the server, reporting through the save pill */
export async function pushCompletion(slug: string): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return;
  const key = `vcm-progress-${slug}`;
  announce(key, "saving");
  const { error } = await sb
    .from("module_progress")
    .upsert({ user_id: actingAsUser() ?? auth.user.id, slug });
  if (error) console.error("module_progress save failed:", error.message);
  announce(key, error ? "error" : "saved");
}

/** take a module completion back off the server */
export async function pullCompletion(slug: string): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return;
  const key = `vcm-progress-${slug}`;
  announce(key, "saving");
  const { error } = await sb
    .from("module_progress")
    .delete()
    .eq("user_id", actingAsUser() ?? auth.user.id)
    .eq("slug", slug);
  if (error) console.error("module_progress delete failed:", error.message);
  announce(key, error ? "error" : "saved");
}

/** upload a report PDF to private storage at reports/{uid}/{slug}.pdf */
export async function pushReportPdf(slug: string, file: File): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return;
  await sb.storage
    .from("reports")
    .upload(`${auth.user.id}/${slug}.pdf`, file, {
      upsert: true,
      contentType: "application/pdf",
    });
}
