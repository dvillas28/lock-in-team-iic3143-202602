"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered } from "lucide-react";
import { markdownEdit, type EditAction } from "../../lib/content/markdown-edit.ts";
import { AcademicMarkdown } from "./academic-markdown.tsx";

const tools: { action: EditAction; label: string; Icon: typeof Bold }[] = [
  { action: "h2", label: "Título", Icon: Heading2 },
  { action: "h3", label: "Subtítulo", Icon: Heading3 },
  { action: "bold", label: "Negrita", Icon: Bold },
  { action: "italic", label: "Cursiva", Icon: Italic },
  { action: "ul", label: "Lista con viñetas", Icon: List },
  { action: "ol", label: "Lista numerada", Icon: ListOrdered },
  { action: "link", label: "Enlace", Icon: Link2 },
];

/** Formatting toolbar + preview over a plain Markdown textarea (same visual language as the Tareas editor). */
export function MarkdownEditor({ name, defaultValue, value, onInput, onBlur, labelId, describedBy, invalid }: Readonly<{
  name: string; defaultValue: string; value: string; onInput: (value: string) => void; onBlur: () => void;
  labelId: string; describedBy?: string; invalid: boolean;
}>) {
  const field = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  function apply(action: EditAction) {
    const area = field.current;
    if (!area) return;
    area.focus();
    const edit = markdownEdit(area.value, area.selectionStart, area.selectionEnd, action);
    area.setSelectionRange(edit.from, edit.to);
    // execCommand keeps the browser undo stack; the fallback covers environments without it.
    if (typeof document.execCommand !== "function" || !document.execCommand("insertText", false, edit.insert)) {
      area.setRangeText(edit.insert, edit.from, edit.to, "end");
      area.dispatchEvent(new (area.ownerDocument.defaultView?.Event ?? Event)("input", { bubbles: true }));
    }
    area.setSelectionRange(edit.start, edit.end);
  }
  function shortcut(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    const action = event.key === "b" ? "bold" : event.key === "i" ? "italic" : undefined;
    if (action) { event.preventDefault(); apply(action); }
  }
  return <div className="stack assignment-editor-text page-editor-text">
    <div className="page-editor-bar">
      <div className="actions" role="group" aria-label="Formato del contenido">
        {tools.map(({ action, label, Icon }) => <button key={action} type="button" className="btn btn-ghost" title={label} aria-label={label}
          disabled={preview} onMouseDown={event => event.preventDefault()} onClick={() => apply(action)}><Icon size={16} aria-hidden="true" /></button>)}
      </div>
      <div className="tab-group" role="group" aria-label="Modo del editor">
        <button type="button" className={`tab-btn${preview ? "" : " active"}`} aria-pressed={!preview} onClick={() => setPreview(false)}>Escribir</button>
        <button type="button" className={`tab-btn${preview ? " active" : ""}`} aria-pressed={preview} onClick={() => setPreview(true)}>Vista previa</button>
      </div>
    </div>
    <textarea ref={field} className="field page-editor-area" name={name} defaultValue={defaultValue} hidden={preview} aria-labelledby={labelId}
      aria-describedby={describedBy} aria-invalid={invalid || undefined} onInput={event => onInput(event.currentTarget.value)} onBlur={onBlur} onKeyDown={shortcut} />
    {preview && <div className="page-editor-preview field" aria-label="Vista previa de la página" tabIndex={0}>
      {value.trim() ? <AcademicMarkdown source={value} /> : <p className="hint">Aún no hay contenido para mostrar.</p>}
    </div>}
  </div>;
}
