"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import TopoTexture from "./TopoTexture";

/**
 * When a magic-link sign-in cannot complete (the link expired, was already
 * used, or is otherwise invalid), Supabase redirects back with the failure in
 * the URL fragment, e.g. `#error=access_denied&error_code=otp_expired`, and no
 * session. Without this, the visitor just lands on the signed-out front door
 * with no hint that anything went wrong. This surfaces a clear retry state on
 * whatever route the link happened to land on.
 *
 * The error lives in the URL fragment, which the server never sees, so we read
 * it with useSyncExternalStore: the server snapshot is null and the client
 * snapshot reads the URL, which keeps hydration clean (no mismatch). This
 * component sits in the root layout, which App Router keeps mounted across
 * navigations, so "Request a new link" dismisses the notice via local state
 * (the layout would not otherwise re-render to re-read the now-clean URL).
 */

const noopSubscribe = () => () => {};

function readAuthError(): string | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  return (
    hash.get("error_code") ||
    query.get("error_code") ||
    hash.get("error") ||
    query.get("error")
  );
}

function friendlyMessage(code: string): string {
  const c = code.toLowerCase();
  if (c.includes("expired") || c.includes("otp")) {
    return "That sign-in link has expired. Sign-in links are good for a short time and can only be used once.";
  }
  if (c.includes("access_denied")) {
    return "That sign-in link has expired or has already been used.";
  }
  return "We could not complete your sign-in with that link.";
}

export default function AuthErrorNotice() {
  const code = useSyncExternalStore(noopSubscribe, readAuthError, () => null);
  const [dismissed, setDismissed] = useState(false);

  if (!code || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-br from-navy-deep via-navy-deep-tint to-primary">
      <TopoTexture opacity={0.1} />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-24 text-center">
        <h1 className="font-display text-4xl text-white">
          Sign-In Didn&apos;t Complete
        </h1>
        <p className="mt-4 text-white/75">{friendlyMessage(code)}</p>
        <Link
          href="/login"
          onClick={() => setDismissed(true)}
          className="mt-8 rounded-md bg-accent px-6 py-3 font-display text-lg text-navy-deep transition hover:bg-accent/85"
        >
          Request a new link
        </Link>
      </div>
    </div>
  );
}
