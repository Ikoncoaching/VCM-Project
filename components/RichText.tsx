"use client";

import { sanitizeHtml } from "@/lib/sanitize";

/**
 * Stored rich text on a page: sanitized on the way out, styled by
 * .prose-atlas (app/globals.css) for headings, lists, links, and the fixed
 * colors and sizes. Use this wherever a rich field is
 * shown rather than edited (RICHTEXT.md).
 */
export default function RichText({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={`prose-atlas ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
