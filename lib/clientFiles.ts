"use client";

import { supabase } from "./supabase/client";

/**
 * Files a client has uploaded, read straight from the private `reports`
 * bucket (files live at reports/{user_id}/{name}). The coach is granted
 * select on the whole bucket by the "reports readable by admin" policy in
 * migration.sql, so this needs no new SQL.
 *
 * Deliberately lists the folder rather than probing known module slugs: a
 * file the client uploaded should be reachable whether or not they went on
 * to mark the module complete, and whether or not it came from a module we
 * know about.
 */
export type ClientFile = {
  /** file name inside the client's folder, e.g. "big-five.pdf" */
  name: string;
  /** name without its extension; matches a module slug for assessment reports */
  slug: string;
  sizeKb: number | null;
  uploadedAt: string | null;
  /** signed URL, valid one hour */
  url: string;
};

const SIGNED_URL_TTL = 3600;

export async function getClientFiles(userId: string): Promise<ClientFile[]> {
  const sb = supabase();
  if (!sb) return [];

  const { data: entries, error } = await sb.storage
    .from("reports")
    .list(userId, { limit: 100, sortBy: { column: "name", order: "asc" } });
  // fail soft: a storage error must never break the client record
  if (error || !entries) return [];

  // sub-folders come back with a null id; keep real files only
  const files = entries.filter((e) => e.id);
  if (files.length === 0) return [];

  const signed = await Promise.all(
    files.map(async (f) => {
      const { data } = await sb.storage
        .from("reports")
        .createSignedUrl(`${userId}/${f.name}`, SIGNED_URL_TTL);
      if (!data?.signedUrl) return null;
      const size = (f.metadata as { size?: number } | null)?.size;
      return {
        name: f.name,
        slug: f.name.replace(/\.[^.]+$/, ""),
        sizeKb: typeof size === "number" ? Math.max(1, Math.round(size / 1024)) : null,
        uploadedAt: f.updated_at ?? f.created_at ?? null,
        url: data.signedUrl,
      } satisfies ClientFile;
    })
  );

  return signed.filter((f): f is ClientFile => f !== null);
}

/** "406 KB" up to a megabyte, then "2.0 MB": nobody reads 2096 KB */
export function sizeLabel(sizeKb: number): string {
  if (sizeKb < 1024) return `${sizeKb} KB`;
  return `${(sizeKb / 1024).toFixed(1)} MB`;
}
