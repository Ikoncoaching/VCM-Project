"use client";

import Link from "next/link";
import TopoTexture from "@/components/TopoTexture";
import { useAuth } from "@/components/AuthProvider";
import { MODULES } from "@/lib/modules";

const IKON_URL = "https://ikoncoaching.com";

/**
 * The welcome page: what the VCM Project is, in Kirk's framing, and the way
 * in. Public. A signed-in person gets a Continue button instead of Sign in.
 */
export default function WelcomePage() {
  const { enabled, loading, profile } = useAuth();
  const signedIn = enabled && !loading && !!profile;

  const cta = (label: string) => (
    <Link
      href={signedIn ? "/journey/modules" : enabled ? "/login" : "/journey"}
      className="inline-block rounded-md bg-accent px-6 py-3 font-display text-lg text-white transition hover:bg-accent/85"
    >
      {signedIn ? "Continue your journey" : label}
    </Link>
  );

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy-deep-tint to-primary">
        <TopoTexture opacity={0.1} />
        <div className="relative mx-auto max-w-3xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.25em] text-brass">
            Welcome to the Value Creation Mechanism Project
          </p>
          <h1 className="mt-4 font-display text-6xl leading-tight text-white">
            What Are{" "}
            <span className="relative inline-block">
              You
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/underline-stroke.png"
                alt=""
                aria-hidden="true"
                className="absolute -bottom-1.5 left-0 h-[0.18em] w-full"
              />
            </span>{" "}
            All About?
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-white/85">
            Discover your Value Creation Mechanism (VCM), the distinctive way
            you create value, then learn to name it, value it, and deliver it.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            {cta("Begin the project")}
            <a href={IKON_URL} className="text-sm text-white/70 underline hover:text-white">
              Learn about Ikon Coaching
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-5 text-xl leading-relaxed text-foreground/85">
          <p>
            You know you bring something valuable to your work and your
            relationships. Putting it into words is the hard part.
          </p>
          <p>
            For most of history, value was created from land, then from
            factories and capital. Today it is increasingly created from the
            human self: who you are and how you operate is part of what you
            deliver. Delivering yourself to the world for the benefit of others
            is the modern economic act.
          </p>
          <p>
            Your <strong className="text-navy">Value Creation Mechanism</strong>{" "}
            is the repeatable way you make things better: the pattern underneath
            your title, your personality, and your strengths, and not reducible
            to any one of them. It is invisible to you for the same reason a
            fish cannot see water: you have always had it in abundance.
          </p>
          <p>
            Once you can name it, you can develop it and put it to work with
            intention.
          </p>
        </div>
      </section>

      <section className="border-t border-navy/10 bg-mist/40">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-center font-display text-3xl text-navy">The Journey</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-navy/70">
            {MODULES.length} modules, self-paced, opening in order as you
            complete each one. Watch the films, gather your ingredients, then
            articulate your VCM.
          </p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2">
            {MODULES.map((m) => (
              <li key={m.slug} className="flex gap-4 rounded-xl border border-navy/10 bg-paper p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
                  {m.number}
                </span>
                <div>
                  <h3 className="font-display text-lg text-navy">{m.title}</h3>
                  <p className="mt-1 text-sm text-navy/65">{m.cardBlurb}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-center text-sm text-navy/60">
            Two of the assessments are purchased directly from their providers,
            about $10 and $20. Everything else is included.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy-deep-tint to-primary">
        <TopoTexture opacity={0.1} />
        <div className="relative mx-auto flex max-w-3xl flex-wrap items-end justify-between gap-x-8 gap-y-6 px-6 py-20">
          <div>
            <h2 className="font-display text-4xl leading-tight text-white">
              Discover Your Value Creation Mechanism
            </h2>
            <p className="mt-3 text-white/70">
              Sign in with your email. No password, no account to set up.
            </p>
          </div>
          {cta("Begin the project")}
        </div>
      </section>
    </div>
  );
}
