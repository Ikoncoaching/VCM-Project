"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Extension, type Editor } from "@tiptap/core";
import {
  sanitizeHtml,
  MAX_INDENT,
  hasContent,
  safeHref,
  TEXT_COLORS,
  type TextColor,
  type TextSize,
} from "@/lib/sanitize";

/**
 * The formatting box for every prose field (RICHTEXT.md, Kirk 2026-09-28):
 * bold, italic, underline, two heading levels, bulleted and numbered
 * lists, links, and color and size from fixed choices. Tiptap underneath;
 * the same props as the box it replaced, so a caller changes nothing.
 *
 * Uncontrolled: the initial HTML is set once on mount, so the parent
 * remounts it (via `key`) when a fresh server copy hydrates in. What it
 * emits is sanitized on every change, so the draft never holds browser
 * artifacts, and every render of it is sanitized again on the way out.
 */
export { sanitizeHtml, hasContent };

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Every line is its own paragraph. A heading or a list applies to a whole
 * paragraph, so a block of lines held together by line breaks (text
 * written before the box, or pasted from a document) would take a heading
 * as one piece (Kirk, 2026-09-28: "it turns all text to heading"). A line
 * break inside a paragraph therefore becomes a paragraph boundary, on
 * load and on paste, and a blank line an empty paragraph.
 */
export function linesToParagraphs(html: string): string {
  return html.replace(/<br\s*\/?>/gi, "</p><p>");
}

/** Drafts written before the rich editor are plain text; convert on load.
 *  A draft holding any tag the editor (old or new) produces is HTML and
 *  goes through the sanitizer; anything else is escaped, each line made a
 *  paragraph. */
export function toEditorHtml(value: string): string {
  if (!value) return "";
  const looksLikeHtml = /<(b|strong|i|em|u|br|div|p|span|h3|h4|ul|ol|li|a)[\s/>]/i.test(value);
  if (looksLikeHtml) return sanitizeHtml(linesToParagraphs(value));
  return value
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

/**
 * Color and size as marks with data attributes and fixed values, never an
 * inline style (the sanitizer would strip a style anyway).
 */
const Styled = TextStyle.extend({
  // the stock mark only reads a span that carries an inline style; ours
  // carry data attributes, so a stored color or size must be read back by
  // those, or it is lost on the next load
  parseHTML() {
    return [
      {
        tag: "span[data-color], span[data-size]",
        consuming: false,
      },
    ];
  },
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-color"),
        renderHTML: (attrs) => (attrs.color ? { "data-color": attrs.color } : {}),
      },
      size: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-size"),
        renderHTML: (attrs) => (attrs.size ? { "data-size": attrs.size } : {}),
      },
    };
  },
});

/**
 * Indent on a paragraph or heading, in steps, carried as data-indent (the
 * sanitizer allows 1 to MAX_INDENT; .prose-atlas draws it; Word gets a
 * left indent). Inside a list the same buttons nest and unnest the item.
 */
const Indent = Extension.create({
  name: "indent",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => {
              const n = Number(el.getAttribute("data-indent"));
              return Number.isInteger(n) && n > 0 ? Math.min(n, MAX_INDENT) : 0;
            },
            renderHTML: (attrs) => (attrs.indent ? { "data-indent": attrs.indent } : {}),
          },
        },
      },
    ];
  },
});

/** the step the block at the selection sits at, or null outside a paragraph or heading */
function indentAt(editor: Editor): { type: string; indent: number } | null {
  const node = editor.state.selection.$from.parent;
  if (node.type.name !== "paragraph" && node.type.name !== "heading") return null;
  return { type: node.type.name, indent: Number(node.attrs.indent) || 0 };
}

/** one step in: a list item nests, a paragraph or heading moves right */
export function indent(editor: Editor): boolean {
  if (editor.isActive("listItem")) return editor.chain().focus().sinkListItem("listItem").run();
  const at = indentAt(editor);
  if (!at || at.indent >= MAX_INDENT) return false;
  return editor.chain().focus().updateAttributes(at.type, { indent: at.indent + 1 }).run();
}

/** one step out: a list item unnests (and leaves the list at the top), a block moves left */
export function outdent(editor: Editor): boolean {
  if (editor.isActive("listItem")) return editor.chain().focus().liftListItem("listItem").run();
  const at = indentAt(editor);
  if (!at || at.indent <= 0) return false;
  return editor.chain().focus().updateAttributes(at.type, { indent: at.indent - 1 }).run();
}

/** the editor's extensions, shared with the tests that load stored HTML */
export function editorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [3, 4] },
      blockquote: false,
      code: false,
      codeBlock: false,
      horizontalRule: false,
      strike: false,
      link: {
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      },
    }),
    Styled,
    Indent,
  ];
}

const COLOR_LABEL: Record<TextColor, string> = {
  navy: "Ink",
  blue: "Blue",
  gold: "Gold",
  green: "Green",
  red: "Red",
  muted: "Muted",
};

export default function RichTextArea({
  initialHtml,
  value,
  onChange,
  placeholder,
  label,
  minHeightClass = "min-h-64",
  readOnly = false,
  className = "",
  autoFocus = false,
  resizable = false,
}: {
  /** the draft on mount; the parent remounts by key when a new one loads */
  initialHtml?: string;
  /**
   * or the draft as it stands: when it changes to something the box does
   * not already hold (a server copy hydrating in, another person's save
   * merged), the box takes it. While the person types, what comes back is
   * what the box emitted, so nothing moves. The simpler way in for a field
   * that was a controlled textarea (RICHTEXT.md, Stage B).
   */
  value?: string;
  onChange: (html: string) => void;
  placeholder: string;
  label: string;
  minHeightClass?: string;
  /** shown, not editable: the toolbar hides and the surface reads as text */
  readOnly?: boolean;
  className?: string;
  autoFocus?: boolean;
  /** a drag handle at the bottom right corner to make the box taller */
  resizable?: boolean;
}) {
  const [colorsOpen, setColorsOpen] = useState(false);
  // the key handler is built before the editor exists, so it reads it here
  const editorRef = useRef<Editor | null>(null);
  // re-render the toolbar's active states on every transaction
  const [, setTick] = useState(0);

  const editor = useEditor({
    // no server render of the editable surface: the page is client-side
    // and the box mounts with its draft
    immediatelyRender: false,
    extensions: editorExtensions(),
    content: toEditorHtml(value ?? initialHtml ?? ""),
    editable: !readOnly,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      // a pasted document's line breaks become paragraphs, so a heading
      // can be given to one line of it
      transformPastedHTML: linesToParagraphs,
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        class: `prose-atlas w-full rounded-md border border-navy/25 bg-paper px-4 py-3 leading-relaxed outline-none focus:border-navy ${minHeightClass}${resizable ? " resize-y overflow-auto" : ""}`,
      },
      handleKeyDown: (_view, event) => {
        // Tab indents, Shift+Tab outdents; Shift+Tab with nothing to
        // outdent still leaves the box, so the keyboard can move on
        if (event.key !== "Tab" || !editorRef.current) return false;
        if (event.shiftKey) {
          const did = outdent(editorRef.current);
          if (did) event.preventDefault();
          return did;
        }
        event.preventDefault();
        indent(editorRef.current);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => onChange(sanitizeHtml(ed.getHTML())),
    onTransaction: () => setTick((t) => t + 1),
  });

  // an outside change to the value: take it without emitting
  useEffect(() => {
    if (!editor || value === undefined) return;
    const incoming = toEditorHtml(value);
    if (sanitizeHtml(editor.getHTML()) === sanitizeHtml(incoming)) return;
    if (!hasContent(incoming) && !hasContent(editor.getHTML())) return;
    editor.commands.setContent(incoming, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  if (!editor) {
    return <div className={`mt-3 rounded-md border border-navy/15 bg-paper ${minHeightClass} ${className}`} />;
  }
  if (readOnly) {
    return (
      <div className={`mt-3 ${className}`}>
        <EditorContent editor={editor} />
      </div>
    );
  }

  const btn = (active: boolean) =>
    `rounded-md border px-2.5 py-1 text-sm transition ${
      active
        ? "border-navy bg-navy text-paper"
        : "border-navy/25 bg-paper text-navy hover:border-navy"
    }`;
  const keep = (e: React.MouseEvent) => e.preventDefault(); // keep the selection

  const setLink = () => {
    const current = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link to (a web address or an email):", current ?? "https://");
    if (url === null) return;
    const href = safeHref(url.trim() === "https://" ? "" : url);
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const setColor = (color: TextColor | null) => {
    setColorsOpen(false);
    const size = editor.getAttributes("textStyle").size ?? null;
    editor.chain().focus().setMark("textStyle", { color, size }).run();
    if (!color && !size) editor.chain().focus().unsetMark("textStyle").run();
  };
  const setSize = (size: TextSize | null) => {
    const color = editor.getAttributes("textStyle").color ?? null;
    editor.chain().focus().setMark("textStyle", { color, size }).run();
    if (!color && !size) editor.chain().focus().unsetMark("textStyle").run();
  };
  const currentColor = (editor.getAttributes("textStyle").color as TextColor | null) ?? null;
  const currentSize = (editor.getAttributes("textStyle").size as TextSize | null) ?? null;

  return (
    <div className={`mt-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Formatting">
        <button type="button" onMouseDown={keep} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl/Cmd+B)" aria-label="Bold" aria-pressed={editor.isActive("bold")} className={`${btn(editor.isActive("bold"))} w-9 font-bold`}>B</button>
        <button type="button" onMouseDown={keep} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl/Cmd+I)" aria-label="Italic" aria-pressed={editor.isActive("italic")} className={`${btn(editor.isActive("italic"))} w-9 italic`}>I</button>
        <button type="button" onMouseDown={keep} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl/Cmd+U)" aria-label="Underline" aria-pressed={editor.isActive("underline")} className={`${btn(editor.isActive("underline"))} w-9 underline`}>U</button>
        <span className="mx-1 h-5 w-px bg-navy/15" aria-hidden="true" />
        <button type="button" onMouseDown={keep} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading" aria-pressed={editor.isActive("heading", { level: 3 })} className={btn(editor.isActive("heading", { level: 3 }))}>Heading</button>
        <button type="button" onMouseDown={keep} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} title="Subheading" aria-pressed={editor.isActive("heading", { level: 4 })} className={btn(editor.isActive("heading", { level: 4 }))}>Subheading</button>
        <span className="mx-1 h-5 w-px bg-navy/15" aria-hidden="true" />
        <button type="button" onMouseDown={keep} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bulleted list" aria-label="Bulleted list" aria-pressed={editor.isActive("bulletList")} className={btn(editor.isActive("bulletList"))}>• List</button>
        <button type="button" onMouseDown={keep} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list" aria-label="Numbered list" aria-pressed={editor.isActive("orderedList")} className={btn(editor.isActive("orderedList"))}>1. List</button>
        <button type="button" onMouseDown={keep} onClick={() => outdent(editor)} title="Outdent (Shift+Tab)" aria-label="Outdent" className={btn(false)}>&larr; Out</button>
        <button type="button" onMouseDown={keep} onClick={() => indent(editor)} title="Indent (Tab)" aria-label="Indent" className={btn(false)}>&rarr; In</button>
        <span className="mx-1 h-5 w-px bg-navy/15" aria-hidden="true" />
        <button type="button" onMouseDown={keep} onClick={setLink} title="Link" aria-pressed={editor.isActive("link")} className={btn(editor.isActive("link"))}>Link</button>
        <span className="relative">
          <button type="button" onMouseDown={keep} onClick={() => setColorsOpen((o) => !o)} title="Text color" aria-haspopup="true" aria-expanded={colorsOpen} className={btn(!!currentColor)}>
            <span className="inline-block h-3 w-3 rounded-full border border-navy/30 align-middle" data-color={currentColor ?? undefined} style={{ background: "currentColor" }} />{" "}
            Color
          </button>
          {colorsOpen && (
            <span className="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-md border border-navy/15 bg-paper p-1.5 shadow-md">
              {TEXT_COLORS.map((c) => (
                <button key={c} type="button" onMouseDown={keep} onClick={() => setColor(c)} title={COLOR_LABEL[c]} aria-label={COLOR_LABEL[c]} className={`prose-atlas h-6 w-6 rounded-full border ${currentColor === c ? "border-navy" : "border-navy/20"}`}>
                  <span data-color={c} className="block h-full w-full rounded-full" style={{ background: "currentColor" }} />
                </button>
              ))}
              <button type="button" onMouseDown={keep} onClick={() => setColor(null)} title="No color" className="ml-1 rounded px-2 text-xs text-navy/60 hover:text-navy">None</button>
            </span>
          )}
        </span>
        <select
          value={currentSize ?? ""}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => setSize((e.target.value || null) as TextSize | null)}
          title="Text size"
          aria-label="Text size"
          className="rounded-md border border-navy/25 bg-paper px-2 py-1 text-sm text-navy outline-none focus:border-navy"
        >
          <option value="small">Small</option>
          <option value="">Normal</option>
          <option value="large">Large</option>
        </select>
      </div>
      <div className="relative mt-2">
        {editor.isEmpty && (
          <span aria-hidden="true" className="pointer-events-none absolute left-4 top-3 z-10 text-navy/40">
            {placeholder}
          </span>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
