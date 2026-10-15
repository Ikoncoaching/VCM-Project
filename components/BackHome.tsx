"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

const BTN =
  "rounded-md bg-primary px-3 py-1.5 text-sm text-white transition hover:bg-navy-deep";

/** Back is browser history; Home is the module list, or the coach's list for Kirk. */
export default function BackHome() {
  const router = useRouter();
  const { profile } = useAuth();
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
      <button type="button" onClick={() => router.back()} className={BTN}>
        Back
      </button>
      <Link href={profile?.is_admin ? "/coach" : "/journey/modules"} className={BTN}>
        Home
      </Link>
    </div>
  );
}
