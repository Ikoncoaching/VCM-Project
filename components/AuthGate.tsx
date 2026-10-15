"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import FrontDoor from "./FrontDoor";
import Skeleton from "./Skeleton";

/** pages an anonymous visitor may see: the welcome page and the sign-in flow */
const PUBLIC_PATHS = ["/", "/login"];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { enabled, loading, profile } = useAuth();

  // without backend keys the app runs in local preview mode
  if (!enabled || PUBLIC_PATHS.includes(pathname)) return <>{children}</>;

  if (loading) {
    return <div className="mx-auto max-w-3xl px-6 py-24"><Skeleton /></div>;
  }

  if (!profile) {
    return (
      <FrontDoor>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brass">
            The VCM Project
          </p>
          <h1 className="mt-3 font-display text-3xl text-white">
            Sign In to Continue
          </h1>
          <p className="mt-4 text-sm text-white/70">
            Your work is saved to your account. Sign in with your email to pick
            up where you left off, or to begin.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-md bg-accent px-6 py-3 font-display text-lg text-white transition hover:bg-accent/85"
          >
            Sign in
          </Link>
          <p className="mt-6 text-xs text-white/50">
            <Link href="/" className="underline hover:text-white">
              About the project
            </Link>
          </p>
        </div>
      </FrontDoor>
    );
  }

  return <>{children}</>;
}
