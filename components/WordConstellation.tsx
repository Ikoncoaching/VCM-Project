"use client";

/**
 * The shape a client made in Words I Like, drawn as they arranged it.
 *
 * Shared by the coach's program view and the module work page, because it is
 * the one piece of that module that a paragraph cannot stand in for: the
 * arrangement is the output.
 */

export interface ConstellationData {
  central?: string;
  cats?: { id: string; name: string }[];
  positions?: Record<string, { x: number; y: number }>;
}

export default function WordConstellation({
  data,
  className = "",
}: {
  data: ConstellationData | undefined;
  className?: string;
}) {
  if (!data?.cats?.length) return null;
  const cats = data.cats;

  return (
    <div
      className={`rounded-xl border border-navy/15 bg-paper p-6 ${className}`}
    >
      <p className="text-sm uppercase tracking-wider text-brass">
        Word constellation
      </p>
      <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-lg border border-navy/10">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {(() => {
            const n = cats.length;
            // five points read as a star only in this order; anything else
            // joins up the way it was arranged
            const order = n === 5 ? [0, 2, 4, 1, 3] : [...Array(n).keys()];
            const pts = order
              .map((idx) => data.positions?.[cats[idx]?.id])
              .filter(Boolean) as { x: number; y: number }[];
            if (pts.length !== n) return null;
            return (
              <polygon
                points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="#2e5880"
                fillOpacity="0.15"
                fillRule="nonzero"
                stroke="#2e5880"
                strokeWidth="2.5"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          })()}
        </svg>
        {cats.map((c) => {
          const p = data.positions?.[c.id];
          if (!p) return null;
          return (
            <div
              key={c.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border border-navy/25 bg-mist px-3 py-1.5"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span className="font-display text-sm text-navy">{c.name}</span>
            </div>
          );
        })}
        {data.central && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brass bg-brass/10 px-4 py-2">
            <span className="font-display text-navy">{data.central}</span>
          </div>
        )}
      </div>
    </div>
  );
}
