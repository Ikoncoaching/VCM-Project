"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopoTexture from "@/components/TopoTexture";
import { useProgress } from "@/lib/progress";
import { DRAFT_KEYS } from "@/lib/sync";
import Skeleton from "@/components/Skeleton";

const FilmIcon = () => (
  <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
    <rect x="7" y="12" width="34" height="24" rx="4" fill="none" stroke="#fff" strokeWidth="2.5" />
    <path d="M21 20l9 4-9 4z" fill="#ce9b41" />
  </svg>
);

const GatherIcon = () => (
  <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
    <g stroke="#fff" strokeWidth="2" opacity="0.9">
      <line x1="10" y1="12" x2="24" y2="24" />
      <line x1="38" y1="12" x2="24" y2="24" />
      <line x1="11" y1="34" x2="24" y2="24" />
      <line x1="37" y1="34" x2="24" y2="24" />
    </g>
    <circle cx="10" cy="12" r="3" fill="#fff" />
    <circle cx="38" cy="12" r="3" fill="#fff" />
    <circle cx="11" cy="34" r="3" fill="#fff" />
    <circle cx="37" cy="34" r="3" fill="#fff" />
    <circle cx="24" cy="24" r="5" fill="#ce9b41" />
  </svg>
);

const MechanismIcon = () => (
  <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
    <g fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round">
      <circle cx="24" cy="24" r="7" />
      <path d="M24 10v-4M24 42v-4M10 24H6M42 24h-4M14 14l-3-3M37 37l-3-3M34 14l3-3M11 37l3-3" />
    </g>
    <circle cx="24" cy="24" r="2.5" fill="#ce9b41" />
  </svg>
);

const STEPS = [
  { title: "Watch the Videos", Icon: FilmIcon },
  { title: "Gather your ingredients", Icon: GatherIcon },
  { title: "Articulate your VCM", Icon: MechanismIcon },
];

/** localStorage keys that only exist once a client has opened/worked a module */
const MODULE_DRAFT_KEYS = Object.keys(DRAFT_KEYS).filter(
  (k) => k !== "vcm-watched"
);

/**
 * The VCM Project's intro / overview page. Shown only the first time (before
 * the client has opened any module). Once they've engaged a module, this
 * redirects straight to the module list so they can continue. A `?stay` param
 * (used by the "Overview" link) always shows the intro without redirecting.
 */
export default function VcmIntroPage() {
  const { ready, completed } = useProgress();
  const router = useRouter();
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const stay = new URLSearchParams(window.location.search).has("stay");
    const hasDraft = MODULE_DRAFT_KEYS.some((k) =>
      window.localStorage.getItem(k)
    );
    const engaged = completed.length > 0 || hasDraft;
    if (engaged && !stay) {
      router.replace("/journey/modules");
    } else {
      setDecided(true);
    }
  }, [ready, completed, router]);

  if (!decided) {
    return <div className="mx-auto max-w-3xl px-6 py-24"><Skeleton /></div>;
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy-deep-tint to-primary">
        <TopoTexture opacity={0.1} />
        <div className="relative mx-auto max-w-3xl px-6 py-24">
          <Link
            href="/"
            className="text-sm text-white/60 hover:text-white"
          >
            ← Back
          </Link>
          <p className="mt-6 text-sm uppercase tracking-[0.25em] text-brass">
            The Value Creation Mechanism Project
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
          <div className="mt-10">
            <Link
              href="/journey/modules"
              className="inline-block rounded-md bg-accent px-6 py-3 font-display text-lg text-navy-deep transition hover:bg-accent/85"
            >
              Begin the journey
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-5 text-xl leading-relaxed text-foreground/85">
          <p>
            You know you bring something valuable to your work and
            relationships. Putting it into words is the hard part.
          </p>
          <p>
            Your <strong className="text-navy">Value Creation Mechanism</strong>{" "}
            is the repeatable way you make things better: the pattern
            underneath your title, personality, and strengths, and not
            reducible to any one of them.
          </p>
          <p>
            Once you can name it, you can develop it and put it to work with
            intention.
          </p>
        </div>
      </section>

      <section className="border-t border-navy/10 bg-mist/40">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-center font-display text-3xl text-navy">
            How It Works
          </h2>
          <ol className="relative mt-12 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-6">
            <div
              className="absolute left-[16.66%] right-[16.66%] top-10 hidden border-t-2 border-dashed border-brass/60 sm:block"
              aria-hidden="true"
            />
            {STEPS.map(({ title, Icon }, i) => (
              <li
                key={title}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-sm ring-8 ring-mist/40">
                  <Icon />
                </span>
                <span className="mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent font-display text-xs text-navy-deep">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-display text-xl text-navy">{title}</h3>
              </li>
            ))}
          </ol>
          <p className="mt-14 text-center text-sm text-navy/60">
            Six modules, self-paced. Two of the assessments are purchased
            directly from their providers, about $10 and $20.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy-deep-tint to-primary">
        <TopoTexture opacity={0.1} />
        <div className="relative mx-auto flex max-w-3xl flex-wrap items-end gap-x-8 gap-y-6 px-6 py-20 text-left">
          <h2 className="font-display text-4xl leading-tight text-white">
            Discover Your Value Creation Mechanism
          </h2>
          <Link
            href="/journey/modules"
            className="inline-block rounded-md bg-accent px-6 py-3 font-display text-lg text-navy-deep transition hover:bg-accent/85"
          >
            Begin the journey
          </Link>
        </div>
      </section>
    </div>
  );
}
