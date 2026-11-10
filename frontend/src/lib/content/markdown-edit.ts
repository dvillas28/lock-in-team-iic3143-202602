/** Pure text edits behind the page editor toolbar: pages stay plain Markdown, teachers just never have to type the syntax. */
export type EditAction = "h2" | "h3" | "bold" | "italic" | "ul" | "ol" | "link";
export type Edit = { from: number; to: number; insert: string; start: number; end: number };

const inline = (value: string, start: number, end: number, marker: string): Edit => {
  const before = value.slice(start - marker.length, start), after = value.slice(end, end + marker.length);
  const insideBold = marker === "*" && value[start - 2] === "*" && value[end + 1] === "*";
  if (before === marker && after === marker && !insideBold) {
    const selected = value.slice(start, end), from = start - marker.length;
    return { from, to: end + marker.length, insert: selected, start: from, end: from + selected.length };
  }
  const text = value.slice(start, end) || "texto";
  return { from: start, to: end, insert: marker + text + marker, start: start + marker.length, end: start + marker.length + text.length };
};

const lineEdit = (value: string, start: number, end: number, apply: (lines: string[]) => string[]): Edit => {
  const from = value.lastIndexOf("\n", start - 1) + 1, found = value.indexOf("\n", end), to = found === -1 ? value.length : found;
  const insert = apply(value.slice(from, to).split("\n")).join("\n");
  return { from, to, insert, start: from, end: from + insert.length };
};

const prefixed = (lines: string[], test: RegExp, add: (line: string, index: number) => string, strip: RegExp) => {
  const filled = lines.filter(line => line.trim());
  if (filled.length && filled.every(line => test.test(line))) return lines.map(line => line.replace(test, ""));
  let n = 0;
  return lines.map(line => line.trim() ? add(line.replace(strip, ""), n++) : line);
};

export function markdownEdit(value: string, start: number, end: number, action: EditAction): Edit {
  switch (action) {
    case "bold": return inline(value, start, end, "**");
    case "italic": return inline(value, start, end, "*");
    case "h2": case "h3": {
      const mark = action === "h2" ? "# " : "## ";
      const edit = lineEdit(value, start, end, lines => prefixed(lines, new RegExp(`^${mark}`), line => mark + line, /^#{1,6}\s+/));
      return edit.insert === "" ? { ...edit, insert: mark, end: edit.from + mark.length } : edit;
    }
    case "ul": case "ol": {
      const bullet = action === "ul";
      const edit = lineEdit(value, start, end, lines => prefixed(lines, bullet ? /^[-*+]\s+/ : /^\d+\.\s+/,
        (line, i) => (bullet ? "- " : `${i + 1}. `) + line, /^(?:[-*+]|\d+\.)\s+/));
      const mark = bullet ? "- " : "1. ";
      return edit.insert === "" ? { ...edit, insert: mark, end: edit.from + mark.length } : edit;
    }
    case "link": {
      const selected = value.slice(start, end);
      if (/^https?:\/\/\S+$/.test(selected)) return { from: start, to: end, insert: `[texto](${selected})`, start: start + 1, end: start + 6 };
      const text = selected || "texto", insert = `[${text}](https://)`;
      return { from: start, to: end, insert, start: start + text.length + 3, end: start + insert.length - 1 };
    }
  }
}

/** The effective write limit is the whole JSON request (see content/validation.ts and backend main.ts), measured in bytes. */
export const REQUEST_LIMIT_BYTES = 4096;
export const requestBytes = (fields: { title?: string; markdownBody?: string }) => new TextEncoder().encode(JSON.stringify(fields)).length;
