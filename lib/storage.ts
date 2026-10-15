/**
 * Where a module's work is kept: localStorage, mirrored to the server.
 *
 * Normally that is the signed-in person's own work and the key is the plain
 * one the module asks for. When the coach is working inside a client's module
 * the key is namespaced with that client's id instead, which does two things:
 * the coach's own drafts under the plain keys are never touched, and the owner
 * of the write travels with the key rather than sitting in a variable that a
 * debounced save could read a second later, after the coach has moved on.
 * See `send` in lib/sync.ts, which reads the owner back off the key.
 */

const AS_PREFIX = "vcm-as:";

/** whose work the module components are currently reading and writing */
let actingAs: string | null = null;

/**
 * Point the draft layer at a client's work, or back at the signed-in user.
 * Set before the module mounts; the acting-as shell owns this.
 */
export function setActingAs(userId: string | null): void {
  actingAs = userId;
}

export function actingAsUser(): string | null {
  return actingAs;
}

/** the localStorage key to use for this draft key right now */
export function scopedKey(key: string): string {
  return actingAs ? `${AS_PREFIX}${actingAs}:${key}` : key;
}

/** the owner and the plain key behind a possibly namespaced one */
export function unscopeKey(key: string): { ownerId: string | null; baseKey: string } {
  if (!key.startsWith(AS_PREFIX)) return { ownerId: null, baseKey: key };
  const rest = key.slice(AS_PREFIX.length);
  const i = rest.indexOf(":");
  if (i === -1) return { ownerId: null, baseKey: key };
  return { ownerId: rest.slice(0, i), baseKey: rest.slice(i + 1) };
}

export function loadDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(scopedKey(key));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveDraft<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  const stored = scopedKey(key);
  try {
    window.localStorage.setItem(stored, JSON.stringify(value));
  } catch {
    // storage full or unavailable; drafts are best-effort locally
  }
  // mirror to the backend when configured (no-op otherwise)
  import("./sync").then(({ pushDraft }) => pushDraft(stored, value));
}

/**
 * The stored key for a draft when the owner is known up front.
 *
 * The acting-as shell sets a global that every module reads through. A board
 * that renders inside the coach's own record cannot use that global without
 * pointing the coach's own bookkeeping drafts at the client too, so it names
 * the owner explicitly instead: a client id namespaces the key, and null means
 * whatever the global says, which for a client is their own plain key.
 */
export function keyFor(ownerId: string | null | undefined, key: string): string {
  return ownerId ? `${AS_PREFIX}${ownerId}:${key}` : scopedKey(key);
}

export function loadDraftFor<T>(
  ownerId: string | null | undefined,
  key: string
): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(ownerId, key));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveDraftFor<T>(
  ownerId: string | null | undefined,
  key: string,
  value: T
): void {
  if (typeof window === "undefined") return;
  const stored = keyFor(ownerId, key);
  try {
    window.localStorage.setItem(stored, JSON.stringify(value));
  } catch {
    // best effort locally; the server copy is what lasts
  }
  // the owner rides on the key, so the sync layer sends it to the right person
  import("./sync").then(({ pushDraft }) => pushDraft(stored, value));
}

/** write straight into a client's namespace, for hydrating it */
export function writeScoped<T>(userId: string, key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${AS_PREFIX}${userId}:${key}`,
      JSON.stringify(value)
    );
  } catch {
    // best effort
  }
}

/** drop everything cached for one client, so a stale copy is never read */
export function clearScoped(userId: string): void {
  if (typeof window === "undefined") return;
  const prefix = `${AS_PREFIX}${userId}:`;
  for (const k of Object.keys(window.localStorage)) {
    if (k.startsWith(prefix)) window.localStorage.removeItem(k);
  }
}
