"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import ModuleWork from "@/components/ModuleWork";
import Skeleton from "@/components/Skeleton";
import { supabase } from "@/lib/supabase/client";
import { getClientFiles } from "@/lib/clientFiles";
import { MODULES } from "@/lib/modules";

type Data = Record<string, unknown>;

/** the modules shown, in order: the catalog plus the journaling step */
const SHOWN = [
  MODULES[0],
  { slug: "look-backwards", number: 0, title: "Consider Your History", subtitle: "", kind: "exercise" as const, cardBlurb: "" },
  ...MODULES.slice(1),
];

/**
 * One participant's work, read only: each module, whether it is complete,
 * what they saved in it, and any report they uploaded.
 */
export default function ParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { enabled, loading, profile } = useAuth();
  const [name, setName] = useState("");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [work, setWork] = useState<Record<string, Data> | null>(null);
  const [pdfs, setPdfs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled || !profile?.is_admin) return;
    (async () => {
      const sb = supabase();
      if (!sb) return;
      const [{ data: p }, { data: prog }, { data: rows }, files] = await Promise.all([
        sb.from("profiles").select("full_name, email").eq("id", id).maybeSingle(),
        sb.from("module_progress").select("slug").eq("user_id", id),
        sb.from("module_data").select("slug, data").eq("user_id", id),
        getClientFiles(id),
      ]);
      setName(p?.full_name || p?.email || "this participant");
      setCompleted(new Set((prog ?? []).map((r) => r.slug)));
      const w: Record<string, Data> = {};
      for (const r of rows ?? []) w[r.slug] = r.data as Data;
      setWork(w);
      const map: Record<string, string> = {};
      for (const f of files) map[f.slug] = f.url;
      setPdfs(map);
    })();
  }, [enabled, profile, id]);

  if (loading) return <div className="mx-auto max-w-3xl px-6 py-24"><Skeleton /></div>;
  if (!enabled || !profile?.is_admin) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="font-display text-3xl text-navy">Coaches Only</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/coach" className="text-sm text-navy/60 hover:text-navy">← All participants</Link>
      <h1 className="mt-3 font-display text-3xl text-navy">{name}</h1>
      <p className="mt-1 text-navy/60">
        {completed.size} of {MODULES.length} modules complete. Their work, read only.
      </p>
      {work === null ? (
        <div className="mt-8"><Skeleton lines={4} /></div>
      ) : (
        <div className="mt-8 space-y-6">
          {SHOWN.map((m) => {
            const done = completed.has(m.slug);
            const data = work[m.slug];
            return (
              <section key={m.slug} className="rounded-xl border border-navy/15 bg-paper p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl text-navy">
                    {m.number ? `${m.number}. ` : ""}{m.title}
                  </h2>
                  <span className={`text-xs uppercase tracking-wider ${done ? "text-brass" : "text-navy/40"}`}>
                    {done ? "Complete" : data ? "Started" : "Not started"}
                  </span>
                </div>
                {pdfs[m.slug] && (
                  <a href={pdfs[m.slug]} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-navy underline">
                    Uploaded report (PDF)
                  </a>
                )}
                <div className="mt-4">
                  <ModuleWork data={data} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
