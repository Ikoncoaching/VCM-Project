"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** true once Kirk has completed SETUP-SUPABASE.md and keys are in .env.local */
export const backendEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!backendEnabled) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Implicit flow: the magic link carries the session in the URL hash,
        // so a link requested on one device still signs in when opened on
        // another (laptop -> phone). PKCE would tie the link to the exact
        // browser that requested it. This app is entirely client-side, so it
        // needs no server-side cookie session (which is what forced PKCE).
        flowType: "implicit",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}
