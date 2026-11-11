"use client";
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";
import { Link2, Redo2, Undo2, type LucideIcon } from "lucide-react";

export type RichTool = { label: string; icon: LucideIcon; command: string; block?: string; /** Plain-text indicator: active outside headings and lists. */ paragraph?: boolean };
type Props = {
  id?: string; labelId: string; groupLabel: string; describedBy?: string; tools: RichTool[]; value: string;
  onChange: (html: string) => void; sanitize: (html: string) => string; onBlur?: () => void; invalid?: boolean;
  /** Characters of text allowed; typing past it is reverted. */
  textLimit?: number;
  /** Shift+Enter in a list: "split" inserts a new item with markup (Tareas, unchanged); "item" asks the browser for the next item
   *  (same as Enter); "soft" keeps the browser's line break inside the item. */
  shiftEnter?: "split" | "item" | "soft";
  /** Enables the link tool; `validate` returns the safe address or undefined. */
  link?: { validate: (address: string) => string | undefined };
  /** Enter creates <p> blocks instead of the browser default (<div>). */
  paragraphs?: boolean;
  /** Refresh the active formats whenever the caret or selection moves, not only after typing or clicking. */
  trackSelection?: boolean;
  className?: string;
};
const escapeHtml = (text: string) => text.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Shared WYSIWYG surface (toolbar + contentEditable) used by Tareas and Páginas; callers decide the storage format. */
export function RichTextEditor({ id, labelId, groupLabel, describedBy, tools, value, onChange, sanitize, onBlur, invalid, textLimit, shiftEnter = "split", link, paragraphs, trackSelection, className }: Props) {
  const field = useRef<HTMLDivElement>(null), saved = useRef<Range | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [linking, setLinking] = useState<{ address: string; error?: string; editing: boolean }>();

  useEffect(() => {
    const input = field.current;
    if (input && input.innerHTML !== value) input.innerHTML = sanitize(value);
  }, [value, sanitize]);

  function state() {
    const query = (name: string) => typeof document.queryCommandState === "function" && document.queryCommandState(name);
    const block = typeof document.queryCommandValue === "function" ? String(document.queryCommandValue("formatBlock")).toLowerCase().replace(/[<>]/g, "") : "";
    const inList = query("insertUnorderedList") || query("insertOrderedList");
    const heading = /^h[1-6]$/.test(block);
    // Headings are bold by style: don't report that as the user's bold.
    const next = Object.fromEntries(tools.map(tool => [tool.label, tool.paragraph ? !inList && !heading : tool.block ? block === tool.block : tool.command === "bold" && heading ? false : query(tool.command)]));
    setActive(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
  }
  useEffect(() => {
    if (!trackSelection) return;
    const watch = () => { const node = window.getSelection()?.anchorNode; if (node && field.current?.contains(node)) state(); };
    document.addEventListener("selectionchange", watch);
    return () => document.removeEventListener("selectionchange", watch);
  });
  function sync() {
    const input = field.current;
    if (!input) return;
    if (textLimit !== undefined && [...(input.textContent ?? "")].length > textLimit) { input.innerHTML = sanitize(value); return; }
    onChange(input.innerHTML);
    state();
  }
  function run(command: string, argument?: string) {
    field.current?.focus();
    if (argument === undefined) document.execCommand(command);
    else document.execCommand(command, false, argument);
    sync();
  }
  const format = (tool: RichTool) => tool.paragraph ? run("formatBlock", "<p>") : tool.block ? run("formatBlock", active[tool.label] ? "<p>" : `<${tool.block}>`) : run(tool.command);

  function insertPlainText(event: ClipboardEvent<HTMLDivElement> | DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const transfer = "clipboardData" in event ? event.clipboardData : event.dataTransfer;
    document.execCommand("insertText", false, transfer.getData("text/plain"));
    sync();
  }
  function splitListItem(event: KeyboardEvent<HTMLDivElement>) {
    if (shiftEnter === "soft" || event.key !== "Enter" || !event.shiftKey) return;
    const node = window.getSelection()?.anchorNode;
    const item = (node?.nodeType === 1 ? (node as Element) : node?.parentElement)?.closest("li");
    if (!item || !field.current?.contains(item)) return;
    event.preventDefault();
    if (!/\p{L}/u.test(item.textContent ?? "")) return;
    if (shiftEnter === "item") document.execCommand("insertParagraph");
    else document.execCommand("insertHTML", false, "<br></li><li><br>");
    sync();
  }
  function shortcuts(event: KeyboardEvent<HTMLDivElement>) {
    splitListItem(event);
    if (event.defaultPrevented || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
    const tool = tools.find(item => !item.block && ((event.key === "b" && item.command === "bold") || (event.key === "i" && item.command === "italic")));
    if (tool) { event.preventDefault(); format(tool); }
  }

  function openLink() {
    const selection = window.getSelection();
    saved.current = selection && selection.rangeCount && field.current?.contains(selection.anchorNode) ? selection.getRangeAt(0).cloneRange() : null;
    const node = selection?.anchorNode;
    const current = (node?.nodeType === 1 ? (node as Element) : node?.parentElement)?.closest("a");
    setLinking({ address: current?.getAttribute("href") ?? "https://", editing: !!current });
  }
  function restore() {
    field.current?.focus();
    const selection = window.getSelection();
    if (saved.current && selection) { selection.removeAllRanges(); selection.addRange(saved.current); }
  }
  function applyLink() {
    const safe = linking && link?.validate(linking.address.trim());
    if (!linking || !safe) { setLinking(current => current && { ...current, error: "Escribe una dirección que empiece con https://" }); return; }
    restore();
    if (window.getSelection()?.isCollapsed) document.execCommand("insertHTML", false, `<a href="${escapeHtml(safe)}">${escapeHtml(safe)}</a>`);
    else document.execCommand("createLink", false, safe);
    setLinking(undefined);
    sync();
  }
  function removeLink() { restore(); document.execCommand("unlink"); setLinking(undefined); sync(); }
  function closeLink() { setLinking(undefined); restore(); }

  return <>
    <div className="actions" role="group" aria-label={groupLabel}>
      {tools.map(tool => <button key={tool.label} type="button" className={`btn btn-ghost${active[tool.label] ? " is-active" : ""}`} title={tool.label}
        aria-label={tool.label} aria-pressed={active[tool.label] ?? false} onMouseDown={event => event.preventDefault()} onClick={() => format(tool)}><tool.icon size={16} aria-hidden="true" /></button>)}
      {link && <button type="button" className={`btn btn-ghost${linking ? " is-active" : ""}`} title="Enlace" aria-label="Enlace" aria-expanded={!!linking}
        onMouseDown={event => event.preventDefault()} onClick={() => linking ? closeLink() : openLink()}><Link2 size={16} aria-hidden="true" /></button>}
      <span className="assignment-editor-divider" aria-hidden="true" />
      <button type="button" className="btn btn-ghost" title="Deshacer" aria-label="Deshacer" onMouseDown={event => event.preventDefault()} onClick={() => run("undo")}><Undo2 size={16} aria-hidden="true" /></button>
      <button type="button" className="btn btn-ghost" title="Rehacer" aria-label="Rehacer" onMouseDown={event => event.preventDefault()} onClick={() => run("redo")}><Redo2 size={16} aria-hidden="true" /></button>
    </div>
    {linking && <div className="rich-link-row" role="group" aria-label="Enlace">
      <label className="field-label" htmlFor={`${id ?? "rich"}-link`}>Dirección del enlace</label>
      <input id={`${id ?? "rich"}-link`} className="field" type="url" value={linking.address} autoFocus aria-invalid={linking.error ? true : undefined}
        onChange={event => setLinking({ ...linking, address: event.target.value, error: undefined })}
        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); applyLink(); } if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeLink(); } }} />
      <button type="button" className="btn btn-primary" onClick={applyLink}>Aplicar</button>
      {linking.editing && <button type="button" className="btn btn-ghost" onClick={removeLink}>Quitar enlace</button>}
      <button type="button" className="btn btn-ghost" onClick={closeLink}>Cancelar</button>
      {linking.error && <p className="field-error">{linking.error}</p>}
    </div>}
    <div id={id} ref={field} className={`field assignment-rich-editor${className ? ` ${className}` : ""}`} contentEditable role="textbox" tabIndex={0} aria-multiline="true"
      aria-describedby={describedBy} aria-labelledby={labelId} aria-invalid={invalid || undefined} onInput={sync} onPaste={insertPlainText} onDrop={insertPlainText}
      onFocus={() => { if (paragraphs) document.execCommand?.("defaultParagraphSeparator", false, "p"); }} onBlur={onBlur}
      onKeyDown={shortcuts} onKeyUp={sync} onMouseUp={sync} suppressContentEditableWarning />
  </>;
}
