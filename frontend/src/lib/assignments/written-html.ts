const allowedTags = new Set(["div", "p", "br", "strong", "b", "em", "i", "ul", "ol", "li"]);

/** Rebuild formatting tags without attributes and escape stray opening brackets. */
export function safeWrittenHtml(value: string) {
  return value.replace(/<[^<>]*>|</g, token => {
    if (token === "<") return "&lt;";
    const match = /^<(\/?)([a-z]+)(?=[\s/>])/i.exec(token);
    if (!match) return "";
    const tag = match[2].toLowerCase();
    return allowedTags.has(tag) ? `<${match[1]}${tag}>` : "";
  });
}
