/**
 * Pure helpers for rich fields, usable where there is no DOM (the export
 * model, the company helpers, tests). The sanitizer itself stays in
 * lib/sanitize.ts and needs a browser.
 */

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " ",
};

/** the words alone: tags gone, blocks separated by a space, entities decoded */
export function plainText(html: string): string {
  if (!html) return "";
  // text written before the box may hold angle brackets of its own; only
  // what the box produced is read as markup
  if (!looksLikeRichHtml(html)) return html.replace(/\s+/g, " ").trim();
  return html
    .replace(/<\/(p|h3|h4|li|div)>|<br\s*\/?>/gi, "$& ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

/** true when a rich field holds words, not only markup */
export function richHasText(html: string): boolean {
  return plainText(html).length > 0;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Any prose field as HTML: what the box produced as it is, and text written
 * before the box escaped and made paragraphs, so one renderer serves both.
 */
export function toRichHtml(s: string): string {
  if (!s) return "";
  if (looksLikeRichHtml(s)) return s;
  // each line its own paragraph, as the box does on load
  return s
    .trim()
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

/** what a rich field is: HTML from the box, or plain text written before it */
export function looksLikeRichHtml(s: string): boolean {
  return /<(b|strong|i|em|u|br|div|p|span|h3|h4|ul|ol|li|a)[\s/>]/i.test(s);
}
