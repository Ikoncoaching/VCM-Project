"use client";

import Link from "next/link";
import { moduleBySlug } from "@/lib/modules";
import { useProgress } from "@/lib/progress";
import { useAuth } from "./AuthProvider";
import Skeleton from "@/components/Skeleton";

/** Wraps module content; shows a locked notice if earlier modules are unfinished. */
export default function ModuleGate({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const { ready, isUnlocked } = useProgress();
  const { profile } = useAuth();
  const m = moduleBySlug(slug);

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-6 py-16"><Skeleton /></div>;
  }

  // the coach (admin) can preview any module out of order
  if (m && profile?.is_admin) {
    return <>{children}</>;
  }

  if (!m || !isUnlocked(slug)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="font-display text-3xl text-navy">This Module Is Locked</p>
        <p className="mt-3 text-navy/70">
          Modules open in order. Finish the one before this to continue.
        </p>
        <Link
          href="/journey/modules"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-white hover:bg-navy-deep"
        >
          Back to your journey
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
