"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase, backendEnabled } from "@/lib/supabase/client";
import { hydrateFromServer } from "@/lib/sync";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
}

interface AuthState {
  /** false = backend not configured; the app runs in local preview mode */
  enabled: boolean;
  loading: boolean;
  profile: Profile | null;
  /** emails a sign-in code */
  signIn: (email: string) => Promise<{ error?: string }>;
  /** exchanges that code for a session */
  verifyCode: (email: string, code: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(backendEnabled);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    let cancelled = false;

    async function load() {
      const { data: auth } = await sb!.auth.getUser();
      if (cancelled) return;
      if (!auth.user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      await hydrateFromServer(auth.user.id);
      const { data: p } = await sb!
        .from("profiles")
        .select("id, email, full_name, is_admin")
        .eq("id", auth.user.id)
        .single();
      if (cancelled) return;
      setProfile(p ?? null);
      setLoading(false);
    }

    load();
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") load();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string) => {
    const sb = supabase();
    if (!sb) return { error: "Backend not configured yet." };
    // anyone with an email may start the project: a new address creates an
    // account on first sign-in (Kirk, 2026-10-15)
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/journey` },
    });
    return error ? { error: error.message } : {};
  }, []);

  /**
   * Codes rather than clickable links, because corporate mail scanners
   * pre-fetch links and burn the single-use token before the person clicks.
   */
  const verifyCode = useCallback(async (email: string, code: string) => {
    const sb = supabase();
    if (!sb) return { error: "Backend not configured yet." };
    const { error } = await sb.auth.verifyOtp({ email, token: code, type: "email" });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    const sb = supabase();
    if (!sb) return;
    await sb.auth.signOut();
    for (const k of Object.keys(window.localStorage)) {
      if (k.startsWith("vcm-")) window.localStorage.removeItem(k);
    }
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{ enabled: backendEnabled, loading, profile, signIn, verifyCode, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
