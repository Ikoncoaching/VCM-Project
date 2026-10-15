"use client";

import RichText from "./RichText";

/**
 * A client's saved work for one module, rendered read only for the coach.
 *
 * Deliberately generic: every module stores its own shape in module_data, and
 * a viewer that only knew a handful of them would silently show nothing for
 * the rest. This walks whatever was saved and lays it out with readable
 * labels, so a new module is visible the day it ships. Modules that deserve a
 * bespoke view can get one later without changing anything here.
 *
 * Rich text is sanitized again on the way in. It is sanitized when written,
 * but that happens in the client's own browser, and a client owns their
 * module_data row, so nothing stops them writing raw HTML straight to the API.
 * This is the coach's session, and the coach is an admin.
 */

/** bookkeeping a coach should not have to look at */
const SKIP_KEYS = new Set([
  "id",
  "ids",
  "positions",
  "parseStatus",
  "loadNonce",
  "sizeKb",
  "uploadedAt",
  "quarter",
]);

/** keys whose humanized form would read badly */
const LABELS: Record<string, string> = {
  list: "Their Is List",
  listDone: "Marked part one complete",
  situations: "Noticing Journal",
  story: "The story",
  values: "Values they drew out",
  goals: "Goals they drew out",
  whys: "Where it did not land, and why",
  resonance: "Did this resonate?",
  scores: "Percentiles",
  keyResults: "Key results",
  toolName: "Their tool",
  typeNumber: "Enneagram type",
  central: "Central word",
  cats: "Categories",
  fileName: "Uploaded file",
  text: "",
  done: "Done",
  body: "",
};

function humanize(key: string): string {
  if (key in LABELS) return LABELS[key];
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const looksLikeHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s);

/** nothing worth showing: unanswered fields are skipped rather than listed */
function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "" || v.trim() === "<br>";
  if (Array.isArray(v)) return v.length === 0 || v.every(isEmpty);
  if (typeof v === "object") return Object.values(v).every(isEmpty);
  return false;
}

/** an unanswered field, when the whole module is being shown */
function Blank() {
  return <p className="text-sm italic text-navy/35">Not written yet</p>;
}

function Value({
  value,
  showEmpty = false,
}: {
  value: unknown;
  showEmpty?: boolean;
}) {
  // An empty array or object still has a shape worth showing: four blank
  // journal situations are four things asked, not one thing missing. Those
  // fall through to the branches below, which walk them slot by slot.
  if (
    showEmpty &&
    isEmpty(value) &&
    typeof value !== "boolean" &&
    !(Array.isArray(value) && value.length > 0) &&
    !(value && typeof value === "object" && !Array.isArray(value))
  ) {
    return <Blank />;
  }
  if (typeof value === "boolean") {
    return <p className="text-foreground/85">{value ? "Yes" : "No"}</p>;
  }
  if (typeof value === "number") {
    return <p className="text-foreground/85">{value}</p>;
  }
  if (typeof value === "string") {
    if (looksLikeHtml(value)) {
      return (
        <RichText html={value} className="text-sm leading-relaxed text-foreground/85" />
      );
    }
    return (
      <p className="whitespace-pre-wrap leading-relaxed text-foreground/85">
        {value}
      </p>
    );
  }
  if (Array.isArray(value)) {
    // Showing the whole module keeps every slot, so four journal situations
    // read as four, three of them still to write, rather than as one.
    const items = showEmpty ? value : value.filter((v) => !isEmpty(v));
    return (
      <ol className="space-y-3">
        {items.map((v, i) => (
          <li key={i} className="border-l-2 border-navy/15 pl-3">
            {/* numbered only when nothing was filtered out, so "3" is the
                third slot rather than the third thing that happened to be
                written in */}
            {showEmpty && (
              <p className="text-[11px] uppercase tracking-wide text-navy/35">
                {i + 1}
              </p>
            )}
            <Value value={v} showEmpty={showEmpty} />
          </li>
        ))}
      </ol>
    );
  }
  if (value && typeof value === "object") {
    return (
      <Fields
        data={value as Record<string, unknown>}
        nested
        showEmpty={showEmpty}
      />
    );
  }
  return null;
}

/**
 * Fields that are writing, whatever their length, and so are never squeezed
 * into the compact table: a short answer is still prose, and the table drops
 * the line breaks that make it readable.
 */
const PROSE_KEYS = new Set([
  "list",
  "coachAdditions",
  "story",
  "text",
  "body",
  "situations",
]);

/** short scalars only, e.g. the fifteen Big Five percentiles */
function isCompact(entries: [string, unknown][]): boolean {
  if (entries.length < 3) return false;
  return entries.every(
    ([k, v]) =>
      !PROSE_KEYS.has(k) &&
      (typeof v === "number" ||
        typeof v === "boolean" ||
        // a value carrying its own line breaks is not a table cell
        (typeof v === "string" &&
          v.length <= 24 &&
          !v.includes("\n") &&
          !looksLikeHtml(v)))
  );
}

function Fields({
  data,
  nested = false,
  showEmpty = false,
}: {
  data: Record<string, unknown>;
  nested?: boolean;
  showEmpty?: boolean;
}) {
  const entries = Object.entries(data).filter(
    ([k, v]) => !SKIP_KEYS.has(k) && (showEmpty || !isEmpty(v))
  );
  if (entries.length === 0) return null;

  // a run of short values reads as a table, not as a stack of headed blocks.
  // Not while blanks are being shown: a table of empty cells says nothing
  // about what was asked, which is the whole point of showing them.
  if (!showEmpty && isCompact(entries)) {
    return (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-baseline justify-between gap-2">
            <dt className="truncate text-xs uppercase tracking-wide text-navy/40">
              {humanize(key)}
            </dt>
            <dd className="shrink-0 text-sm text-foreground/85">
              {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div className={nested ? "space-y-2" : "space-y-5"}>
      {entries.map(([key, value]) => {
        const label = humanize(key);
        return (
          <div key={key}>
            {label && (
              <p
                className={
                  nested
                    ? "text-xs uppercase tracking-wide text-navy/40"
                    : "text-xs uppercase tracking-wider text-brass"
                }
              >
                {label}
              </p>
            )}
            <div className={label ? "mt-1" : ""}>
              <Value value={value} showEmpty={showEmpty} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ModuleWork({
  data,
  showEmpty = false,
}: {
  data: unknown;
  /** show every field the module holds, unanswered ones included. The coach
   *  reads a module to see what was asked as much as what was written, and a
   *  view that hides the blanks cannot tell them apart from what was never
   *  asked at all. */
  showEmpty?: boolean;
}) {
  if (!data || typeof data !== "object") {
    return (
      <p className="rounded-xl border border-dashed border-navy/25 bg-mist/40 p-6 text-navy/55">
        Nothing saved here yet.
      </p>
    );
  }
  if (!showEmpty && isEmpty(data)) {
    return (
      <p className="rounded-xl border border-dashed border-navy/25 bg-mist/40 p-6 text-navy/55">
        Nothing saved here yet.
      </p>
    );
  }
  const body = (
    <Fields data={data as Record<string, unknown>} showEmpty={showEmpty} />
  );
  return (
    body ?? (
      <p className="rounded-xl border border-dashed border-navy/25 bg-mist/40 p-6 text-navy/55">
        Nothing saved here yet.
      </p>
    )
  );
}
