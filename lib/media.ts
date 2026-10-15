"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase/client";

/**
 * Protected course media: the module videos and the coach-training PDFs.
 *
 * They live in the private "course-media" bucket (supabase/migrations/20260910000400_course_media.sql), so a
 * page cannot point a <video> or <iframe> straight at them. It asks for a
 * signed URL instead, and storage RLS answers: the coach always, a client
 * when the owning module is assigned to them. A refusal is a null URL, and
 * the slot shows its "coming soon" face rather than a broken player.
 *
 * Paths in the catalog still read like the old public ones
 * ("/videos/fish-and-water.mp4"), so nothing in lib/ had to change; this
 * file knows which of those prefixes are protected.
 */

export const MEDIA_BUCKET = "course-media";

/** signed URLs live this long; a page open longer than that re-signs */
const TTL_SECONDS = 60 * 60;

const PROTECTED_PREFIXES = ["/videos/", "/coach-training/"];

/** the bucket path for a catalog src, or null when it is an ordinary URL */
export function mediaPathFor(src: string | undefined): string | null {
  if (!src) return null;
  if (!PROTECTED_PREFIXES.some((p) => src.startsWith(p))) return null;
  // the diagrams under /coach-training stay public; only the PDFs moved
  if (src.startsWith("/coach-training/") && !src.endsWith(".pdf")) return null;
  return src.replace(/^\//, "");
}

/** one signed URL for a bucket path; null while loading or when refused */
export async function signedMediaUrl(path: string): Promise<string | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(path, TTL_SECONDS);
  if (error) {
    console.error("course media refused:", path, error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

/**
 * Resolve a catalog src to something a media element can load. An ordinary
 * URL comes straight back; a protected one is signed first. `state` says
 * which of the three the caller is looking at.
 */
export function useMediaUrl(src: string | undefined): {
  url: string | null;
  state: "loading" | "ready" | "refused";
} {
  const path = mediaPathFor(src);
  const [url, setUrl] = useState<string | null>(path ? null : (src ?? null));
  const [state, setState] = useState<"loading" | "ready" | "refused">(
    path ? "loading" : src ? "ready" : "refused"
  );

  useEffect(() => {
    if (!path) {
      setUrl(src ?? null);
      setState(src ? "ready" : "refused");
      return;
    }
    let live = true;
    setState("loading");
    signedMediaUrl(path).then((u) => {
      if (!live) return;
      setUrl(u);
      setState(u ? "ready" : "refused");
    });
    // re-sign before the URL expires, for a page left open
    const t = setInterval(() => {
      signedMediaUrl(path).then((u) => live && u && setUrl(u));
    }, (TTL_SECONDS - 300) * 1000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [path, src]);

  return { url, state };
}
