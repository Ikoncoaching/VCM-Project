"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

const IKON_URL = "https://ikoncoaching.com";

/**
 * The top bar: the project's name at the left, a link back to Ikon Coaching
 * and the account controls at the right. Kept to one line so the modules,
 * which are long pages, start near the top.
 */
export default function SiteHeader() {
  const { enabled, profile, signOut } = useAuth();
  return (
    <header className="relative border-b border-white/10 bg-gradient-to-br from-navy-deep via-navy-deep-tint to-primary">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
        <Link href="/" className="flex flex-col items-start" aria-label="The VCM Project, home">
          <span className="font-display text-xl leading-none text-white">The VCM Project</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-brass">
            by Ikon Coaching
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-white/75">
          <a href={IKON_URL} className="hover:text-white">
            ikoncoaching.com
          </a>
          {enabled && profile ? (
            <>
              <Link href="/journey/modules" className="hover:text-white">
                My journey
              </Link>
              {profile.is_admin && (
                <Link href="/coach" className="hover:text-white">
                  Participants
                </Link>
              )}
              <button
                type="button"
                onClick={signOut}
                title={profile.email}
                className="rounded-md border border-white/25 px-3 py-1 text-white/85 transition hover:border-white hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : enabled ? (
            <Link
              href="/login"
              className="rounded-md bg-accent px-3 py-1 text-white transition hover:bg-accent/85"
            >
              Sign in
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
