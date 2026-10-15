"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import FrontDoor from "@/components/FrontDoor";

// Supabase's code length is a dashboard setting (6 to 10 digits)
const CODE_MIN = 6;
const CODE_MAX = 10;

export default function LoginPage() {
  const { enabled, loading, profile, signIn, verifyCode } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  // the session syncs across tabs, so once signed in anywhere this tab moves on
  useEffect(() => {
    if (enabled && !loading && profile) {
      router.replace(profile.is_admin ? "/coach" : "/journey");
    }
  }, [enabled, loading, profile, router]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn(email.trim());
    setBusy(false);
    if (res.error) setError(res.error);
    else setStep("code");
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await verifyCode(email.trim(), code.trim());
    setBusy(false);
    if (res.error) setError(res.error);
  }

  async function resend() {
    setBusy(true);
    setError("");
    setResent(false);
    const res = await signIn(email.trim());
    setBusy(false);
    if (res.error) setError(res.error);
    else setResent(true);
  }

  const field =
    "w-full rounded-md border border-white/25 bg-white/10 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-brass";
  const button =
    "w-full rounded-md bg-accent px-6 py-3 font-display text-lg text-white transition hover:bg-accent/85 disabled:opacity-50";

  return (
    <FrontDoor>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-brass">The VCM Project</p>
        <h1 className="mt-3 font-display text-4xl text-white">Sign In</h1>

        {!enabled ? (
          <p className="mt-6 rounded-lg bg-white/10 p-4 text-sm text-white/80">
            The backend is not connected. The app is running in local preview
            mode; see SETUP.md.
          </p>
        ) : step === "email" ? (
          <>
            <p className="mt-3 text-white/75">
              Enter your email and we will send you a sign-in code. No password
              needed. If this is your first time, that is all it takes to begin.
            </p>
            <form onSubmit={sendCode} className="mt-6 space-y-3">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={field}
              />
              <button disabled={busy} className={button}>
                {busy ? "Sending…" : "Email Me a Code"}
              </button>
              {error && <p className="text-sm text-fuchsia">{error}</p>}
            </form>
          </>
        ) : (
          <>
            <p className="mt-3 text-white/75">
              We sent a sign-in code to <strong>{email}</strong>. Enter it
              below. The code is good for one hour.
            </p>
            <form onSubmit={submitCode} className="mt-6 space-y-3">
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={CODE_MAX}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_MAX))}
                placeholder="Your code"
                className={`${field} text-center font-display text-3xl tracking-[0.3em]`}
              />
              <button disabled={busy || code.length < CODE_MIN} className={button}>
                {busy ? "Checking…" : "Sign In"}
              </button>
              {error && <p className="text-sm text-fuchsia">{error}</p>}
              {resent && !error && (
                <p className="text-sm text-brass">A new code is on its way. Use the newest one.</p>
              )}
              <div className="flex justify-between pt-1 text-sm">
                <button type="button" onClick={resend} disabled={busy} className="text-white/70 underline hover:text-white disabled:opacity-50">
                  Send a new code
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("email"); setCode(""); setError(""); setResent(false); }}
                  className="text-white/70 underline hover:text-white"
                >
                  Use a different email
                </button>
              </div>
            </form>
          </>
        )}
        <p className="mt-8 text-center text-xs text-white/50">
          <Link href="/" className="underline hover:text-white">About the project</Link>
        </p>
      </div>
    </FrontDoor>
  );
}
