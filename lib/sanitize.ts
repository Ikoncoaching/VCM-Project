/**
 * The one HTML sanitizer for anything stored as rich text.
 *
 * Every render of stored HTML goes through this, on the way in (the editor)
 * and again on the way out (any dangerouslySetInnerHTML), because a value in
 * module_data may have been written by something other than the editor: the
 * owner can write their own row straight through Supabase. What a client
 * stores must never run as script in the coach's browser.
 *
 * What may stay (RICHTEXT.md, Kirk's decisions of 2026-09-28): text
 * formatting, two heading levels, lists, links to http, https and mailto
 * addresses, and color and size from fixed choices carried as data
 * attributes, never as inline styles. Everything else is unwrapped to its
 * text, and every other attribute is dropped.
 *
 * Browser only: it parses with a <template>, which is what makes it safe
 * (nothing in template content executes). Callers render on the client.
 */

/** tags the editor may keep; everything else is unwrapped to its children */
const ALLOWED_TAGS = new Set([
  "B", "STRONG", "I", "EM", "U", "BR", "DIV", "P",
  "H3", "H4", "UL", "OL", "LI", "A", "SPAN",
]);

/** the fixed choices a person can color or size text with */
export const TEXT_COLORS = ["navy", "blue", "gold", "green", "red", "muted"] as const;
export const TEXT_SIZES = ["small", "large"] as const;
/** how far a paragraph or heading may be indented, in steps */
export const MAX_INDENT = 4;
export type TextColor = (typeof TEXT_COLORS)[number];
export type TextSize = (typeof TEXT_SIZES)[number];
const COLOR_SET = new Set<string>(TEXT_COLORS);
const SIZE_SET = new Set<string>(TEXT_SIZES);

/** a link may point only here: nothing that runs, nothing that is a file */
export function safeHref(href: string | null): string | null {
  if (!href) return null;
  const v = href.trim();
  if (/^(https?:\/\/|mailto:)/i.test(v)) return v;
  return null;
}

/** Strip everything but the allowed formatting and its few attributes. */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const walk = (node: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        walk(el);
        if (!ALLOWED_TAGS.has(el.tagName)) {
          el.replaceWith(...el.childNodes);
          continue;
        }
        const keep: Record<string, string> = {};
        if (el.tagName === "A") {
          const href = safeHref(el.getAttribute("href"));
          if (!href) {
            // a link nowhere safe is just its text
            el.replaceWith(...el.childNodes);
            continue;
          }
          keep.href = href;
          keep.target = "_blank";
          keep.rel = "noopener noreferrer";
        }
        if (el.tagName === "P" || el.tagName === "H3" || el.tagName === "H4") {
          const indent = Number(el.getAttribute("data-indent"));
          if (Number.isInteger(indent) && indent >= 1 && indent <= MAX_INDENT) {
            keep["data-indent"] = String(indent);
          }
        }
        if (el.tagName === "SPAN") {
          const color = el.getAttribute("data-color");
          const size = el.getAttribute("data-size");
          if (color && COLOR_SET.has(color)) keep["data-color"] = color;
          if (size && SIZE_SET.has(size)) keep["data-size"] = size;
          if (!keep["data-color"] && !keep["data-size"]) {
            // a span carrying nothing we honor is just its text
            el.replaceWith(...el.childNodes);
            continue;
          }
        }
        for (const a of [...el.attributes]) el.removeAttribute(a.name);
        for (const [k, v] of Object.entries(keep)) el.setAttribute(k, v);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    }
  };
  walk(tpl.content);
  return tpl.innerHTML;
}

/** true when the HTML holds actual text, not just tags and whitespace */
export function hasContent(html: string): boolean {
  if (!html) return false;
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").trim().length > 0;
}

/** the words alone, for anything that reads a rich field as text */
export function textOf(html: string): string {
  if (!html) return "";
  const div = document.createElement("div");
  // a space where a block or a line break ends, so words do not run together
  div.innerHTML = html.replace(/<\/(p|h3|h4|li|div)>|<br\s*\/?>/gi, "$& ");
  return (div.textContent ?? "").replace(/\s+/g, " ").trim();
}
