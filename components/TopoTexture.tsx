/* eslint-disable @next/next/no-img-element */
/**
 * Topographic map texture per the brand bible: Kirk's actual Ikon map
 * artwork (white thin strokes), screen-blended at low opacity over blue
 * gradients. map-1 is landscape, map-2 is portrait.
 */
export default function TopoTexture({
  opacity = 0.1,
  variant = 1,
}: {
  opacity?: number;
  variant?: 1 | 2;
}) {
  return (
    <img
      src={`/maps/map-${variant}.svg`}
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      style={{ opacity, mixBlendMode: "screen" }}
    />
  );
}
