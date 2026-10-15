import Image from "next/image";

/**
 * The ground under the front door, the sign-in gate and the login form:
 * Kirk's contour map, full bleed, drawn in light lines over the brand blue,
 * (Kirk, 2026-09-15: a mapping feel). The card sits on a translucent navy
 * panel so the words read over the lines.
 *
 * The map is line art exported black on white; inverting it and screening
 * it over the gradient turns the lines white and the ground transparent,
 * with no edited asset to maintain.
 */
export default function FrontDoor({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy-deep-tint to-primary">
      {/* a string path, not a static import: CI's tsc runs without
          next-env.d.ts, which is where the image module types come from */}
      <Image
        src="/maps/atlas-topo.png"
        width={2200}
        height={1109}
        alt=""
        aria-hidden="true"
        priority
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ filter: "invert(1)", mixBlendMode: "screen", opacity: 0.42 }}
      />
      {/* a soft fade at the edges, so the map reads as terrain receding
          rather than a texture that stops at the frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,0.35) 100%)",
        }}
      />
      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center px-6 py-20">
        <div className="rounded-2xl border border-white/10 bg-navy-deep/75 px-8 py-10 backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
