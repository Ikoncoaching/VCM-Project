"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import Skeleton from "@/components/Skeleton";
import { supabase } from "@/lib/supabase/client";
import { MODULES } from "@/lib/modules";

interface Row {
  id: string;
  name: string;
  email: string;
  joined: string;
  completed: number;
  lastWorked: string | null;
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "never";

/**
 * Everyone who has signed in, how far they are, and when they last worked.
 * Read only, for Kirk's account. RLS gives an admin select on profiles,
 * module_progress and module_data; nothing here writes.
 */
export default function CoachPage() {
  const { enabled, loading, profile } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!enabled || !profile?.is_admin) return;
    (async () => {
      const sb = supabase();
      if (!sb) return;
      const [{ data: people }, { data: prog }, { data: work }] = await Promise.all([
        sb.from("profiles").select("id, email, full_name, created_at, is_admin").order("created_at", { ascending: false }),
        sb.from("module_progress").select("user_id, slug"),
        sb.from("module_data").select("user_id, updated_at"),
      ]);
      const done = new Map<string, number>();
      for (const p of prog ?? []) done.set(p.user_id, (done.get(p.user_id) ?? 0) + 1);
      const last = new Map<string, string>();
      for (const w of work ?? []) {
        const cur = last.get(w.user_id);
        if (!cur || w.updated_at > cur) last.set(w.user_id, w.updated_at);
      }
      setRows(
        (people ?? [])
          .filter((p) => !p.is_admin)
          .map((p) => ({
            id: p.id,
            name: p.full_name || "",
            email: p.email,
            joined: p.created_at,
            completed: done.get(p.id) ?? 0,
            lastWorked: last.get(p.id) ?? null,
          }))
      );
    })();
  }, [enabled, profile]);

  if (loading) return <div className="mx-auto max-w-4xl px-6 py-24"><Skeleton /></div>;
  if (!enabled || !profile?.is_admin) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="font-display text-3xl text-navy">Coaches Only</p>
        <Link href="/journey/modules" className="mt-4 inline-block text-navy underline">Back to the journey</Link>
      </div>
    );
  }

  const needle = q.trim().toLowerCase();
  const shown = (rows ?? []).filter(
    (r) => !needle || r.name.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle)
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-navy">Participants</h1>
      <p className="mt-1 text-navy/60">
        Everyone who has signed in to the VCM Project, newest first.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email"
        className="mt-6 w-full rounded-md border border-navy/25 bg-paper px-4 py-2 text-navy placeholder:text-navy/40 focus:border-navy focus:outline-none sm:max-w-sm"
      />
      {rows === null ? (
        <div className="mt-8"><Skeleton lines={4} /></div>
      ) : shown.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-navy/25 bg-paper p-6 text-navy/55">
          {rows.length === 0 ? "Nobody has signed in yet." : "No one matches that search."}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-navy/10 rounded-xl border border-navy/15 bg-paper">
          {shown.map((r) => (
            <li key={r.id}>
              <Link href={`/coach/${r.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-navy/5">
                <div className="min-w-0">
                  <p className="font-display text-lg text-navy">{r.name || r.email}</p>
                  {r.name && <p className="truncate text-sm text-navy/55">{r.email}</p>}
                </div>
                <div className="flex items-center gap-6 text-sm text-navy/60">
                  <span>{r.completed} of {MODULES.length} complete</span>
                  <span>Last worked {when(r.lastWorked)}</span>
                  <span>Joined {when(r.joined)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
