"use client";
import { useState } from "react";
import { Bold, Heading2, Heading3, Italic, List, ListOrdered, Pilcrow } from "lucide-react";
import { htmlToMarkdown, markdownToHtml, safePageHtml } from "../../lib/content/markdown-html.ts";
import { markdownUrl } from "../../lib/content/markdown-policy.ts";
import { RichTextEditor, type RichTool } from "../rich-text/rich-text-editor.tsx";

const tools: RichTool[] = [
  { label: "Párrafo", icon: Pilcrow, command: "formatBlock", paragraph: true },
  { label: "Título", icon: Heading2, command: "formatBlock", block: "h2" },
  { label: "Subtítulo", icon: Heading3, command: "formatBlock", block: "h3" },
  { label: "Negrita", icon: Bold, command: "bold" },
  { label: "Cursiva", icon: Italic, command: "italic" },
  { label: "Lista con viñetas", icon: List, command: "insertUnorderedList" },
  { label: "Lista numerada", icon: ListOrdered, command: "insertOrderedList" },
];

/**
 * Edit the formatted page directly. The page is still stored as Markdown: the saved text is rebuilt from the editor on
 * every change, and while the document is visually unchanged the original text is kept byte for byte.
 */
export function VisualMarkdownEditor({ name, initial, onInput, onBlur, labelId, describedBy, invalid }: Readonly<{
  name: string; initial: string; onInput: (markdown: string) => void; onBlur: () => void; labelId: string; describedBy?: string; invalid: boolean;
}>) {
  const [start] = useState(() => { const html = safePageHtml(markdownToHtml(initial)); return { initial, html, canonical: htmlToMarkdown(html) }; });
  const [html, setHtml] = useState(start.html), [markdown, setMarkdown] = useState(start.initial);
  function change(next: string) {
    setHtml(next);
    const rebuilt = htmlToMarkdown(next);
    const saved = rebuilt === start.canonical ? start.initial : rebuilt;
    setMarkdown(saved);
    onInput(saved);
  }
  return <>
    <input type="hidden" name={name} value={markdown} />
    <RichTextEditor labelId={labelId} groupLabel="Formato del contenido" describedBy={describedBy} tools={tools} value={html} onChange={change}
      sanitize={safePageHtml} onBlur={onBlur} invalid={invalid} link={{ validate: markdownUrl }} paragraphs trackSelection shiftEnter="item" className="page-rich-editor" />
  </>;
}
