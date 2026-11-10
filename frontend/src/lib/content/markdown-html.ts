import { Fragment, createElement, type ReactElement, type ReactNode } from "react";
import { AcademicMarkdown } from "../../components/content/academic-markdown.tsx";
import { markdownUrl } from "./markdown-policy.ts";

/**
 * Adapter between the stored Markdown and the visual editor's HTML. Storage never changes: pages stay Markdown, the
 * HTML only lives while editing. Rendering reuses the reader's own pipeline (react-markdown + remark-gfm + URL policy);
 * only the HTML → Markdown direction is written here, for the small subset the editor can produce.
 */
const BLOCKS = new Set(["p", "h2", "h3", "h4", "ul", "ol", "li"]);
const INLINE = new Set(["strong", "em", "a", "br"]);
const RENAMED: Record<string, string> = { div: "p", b: "strong", i: "em" };
const inert = (html: string) => { const doc = document.implementation.createHTMLDocument(""); doc.body.innerHTML = html; return doc; };

const VOID = new Set(["br", "hr", "img", "input"]);
const text = (value: string) => value.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
/** Walks the React element tree react-markdown returns (calling the reader's own components) instead of rendering it. */
function toHtml(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return text(String(node));
  if (Array.isArray(node)) return node.map(toHtml).join("");
  const element = node as ReactElement<{ children?: ReactNode; href?: string; className?: string }>;
  if (typeof element.type === "function") return toHtml((element.type as (props: unknown) => ReactNode)(element.props));
  if ((element.type as unknown) === Fragment) return toHtml(element.props.children);
  if (typeof element.type !== "string") return "";
  const attrs = (element.props.className ? ` class="${text(element.props.className)}"` : "") + (element.type === "a" && element.props.href ? ` href="${text(element.props.href)}"` : "");
  return VOID.has(element.type) ? `<${element.type}>` : `<${element.type}${attrs}>${toHtml(element.props.children)}</${element.type}>`;
}

export function markdownToHtml(markdown: string): string {
  return inert(toHtml(createElement(AcademicMarkdown, { source: markdown }))).querySelector(".academic-markdown")?.innerHTML ?? "";
}

/** Keeps only the formatting the editor supports (no attributes except a validated link); anything else is unwrapped. */
export function safePageHtml(html: string): string {
  const doc = inert(html), out = doc.createElement("div");
  const copy = (from: Node, into: Node) => {
    for (const node of Array.from(from.childNodes)) {
      if (node.nodeType === 3) { into.appendChild(doc.createTextNode(node.textContent ?? "")); continue; }
      if (node.nodeType !== 1) continue;
      const source = node as Element, tag = source.tagName.toLowerCase(), name = RENAMED[tag] ?? tag;
      if (name === "a") {
        const href = markdownUrl(source.getAttribute("href") ?? "");
        if (!href) { copy(source, into); continue; }
        const link = doc.createElement("a"); link.setAttribute("href", href); copy(source, link); into.appendChild(link); continue;
      }
      if (!BLOCKS.has(name) && !INLINE.has(name)) { copy(source, into); continue; }
      const element = doc.createElement(name); copy(source, element); into.appendChild(element);
    }
  };
  copy(doc.body, out);
  return out.innerHTML;
}

/** True when the HTML uses anything the editor cannot represent (tables, code, quotes, images, deeper headings…). */
function unsupported(html: string): boolean {
  const doc = inert(html);
  return Array.from(doc.body.querySelectorAll("*")).some(el => {
    const name = el.tagName.toLowerCase();
    return !BLOCKS.has(name) && !INLINE.has(name) && !(name in RENAMED) || (name === "a" && !markdownUrl(el.getAttribute("href") ?? ""));
  });
}

const lineStart = /^(\s*)(?:([-+*>])|(#{1,6})(?=\s|$)|(\d+)([.)])(?=\s|$)|(=+|-+)\s*$)/;
function escapeText(text: string) {
  return text.replace(/ /g, " ").replace(/[\\`*_[\]<>&~]/g, "\\$&")
    .split("\n").map(line => line.replace(lineStart, (m, space, mark, hashes, digits, dot, rule) =>
      space + (mark ? "\\" + mark : hashes ? "\\" + hashes : digits ? digits + "\\" + dot : "\\" + rule))).join("\n");
}
function wrap(marker: string, inner: string) {
  const body = inner.trim();
  if (!body) return inner;
  return inner.slice(0, inner.length - inner.trimStart().length) + marker + body + marker + inner.slice(inner.trimEnd().length);
}
function inline(parent: Node): string {
  let out = "";
  const nodes = Array.from(parent.childNodes);
  nodes.forEach((node, index) => {
    if (node.nodeType === 3) {
      const afterBreak = (nodes[index - 1] as Element | undefined)?.tagName?.toLowerCase() === "br";
      out += escapeText(afterBreak ? (node.textContent ?? "").replace(/^\n/, "") : node.textContent ?? "");
      return;
    }
    const el = node as Element, name = el.tagName.toLowerCase();
    if (name === "br") { if (index < nodes.length - 1) out += "  \n"; return; }
    if (name === "strong") out += wrap("**", inline(el));
    else if (name === "em") out += wrap("*", inline(el));
    else if (name === "a") out += `[${inline(el)}](${(el.getAttribute("href") ?? "").replace(/\(/g, "%28").replace(/\)/g, "%29")})`;
    else out += inline(el);
  });
  return out;
}
function list(el: Element): string {
  const ordered = el.tagName.toLowerCase() === "ol";
  return Array.from(el.children).filter(child => child.tagName.toLowerCase() === "li").map((item, index) => {
    const marker = ordered ? `${index + 1}. ` : "- ", pad = " ".repeat(marker.length);
    const text = document.implementation.createHTMLDocument("").createElement("div");
    const nested: string[] = [];
    for (const child of Array.from(item.childNodes)) {
      const name = child.nodeType === 1 ? (child as Element).tagName.toLowerCase() : "";
      if (name === "ul" || name === "ol") nested.push(list(child as Element));
      else text.appendChild(child.cloneNode(true));
    }
    const content = inline(text).replace(/\s+$/, "");
    if (!content && !nested.length) return "";
    const lines = [marker + content.split("\n").join("\n" + pad)];
    for (const block of nested) lines.push(block.split("\n").map(line => pad + line).join("\n"));
    return lines.join("\n");
  }).filter(Boolean).join("\n");
}
function blocks(parent: Node): string[] {
  const out: string[] = [];
  let run = document.implementation.createHTMLDocument("").createElement("div");
  const flush = () => { const text = inline(run).trim(); if (text) out.push(text); run = run.ownerDocument.createElement("div"); };
  for (const node of Array.from(parent.childNodes)) {
    const name = node.nodeType === 1 ? (node as Element).tagName.toLowerCase() : "";
    if (/^h[2-4]$/.test(name)) { flush(); const text = inline(node).trim(); if (text) out.push("#".repeat(Number(name[1]) - 1) + " " + text); }
    else if (name === "p") { flush(); const text = inline(node).trim(); if (text) out.push(text); }
    else if (name === "ul" || name === "ol") { flush(); const text = list(node as Element); if (text) out.push(text); }
    else run.appendChild(node.cloneNode(true));
  }
  flush();
  return out;
}

export function htmlToMarkdown(html: string): string {
  return blocks(inert(safePageHtml(html)).body).join("\n\n");
}

const flat = (html: string) => html.replace(/<li><p>/g, "<li>").replace(/<\/p><\/li>/g, "</li>").replace(/\s+/g, " ").replace(/> </g, "><").trim();
/** The page can be edited visually only if Markdown → editor → Markdown renders exactly the same document. */
export function canEditVisually(markdown: string): boolean {
  if (!markdown.trim()) return true;
  try {
    const before = markdownToHtml(markdown);
    if (unsupported(before)) return false;
    return flat(safePageHtml(before)) === flat(safePageHtml(markdownToHtml(htmlToMarkdown(before))));
  } catch { return false; }
}
