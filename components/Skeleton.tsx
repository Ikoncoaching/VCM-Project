/**
 * Pulsing placeholder bars, shown wherever a page is waiting on its data.
 *
 * Every loading state used to be an empty div holding blank space, which
 * reads as a broken page for the seconds it lasts. The bars say "coming"
 * without words. `title` draws a wider heading bar first; turn it off for
 * small in-content slots.
 */
export default function Skeleton({
  lines = 3,
  title = true,
}: {
  lines?: number;
  title?: boolean;
}) {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-3">
      {title && <div className="h-7 w-2/5 rounded-md bg-navy/10" />}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 rounded-md bg-navy/10 ${
            i === lines - 1 ? "w-3/5" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}
