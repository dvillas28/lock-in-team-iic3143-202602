/** Content never resolves relative URLs against an institution or sends credentials. */
export function markdownUrl(value: string): string | undefined {
  // Reject characters WHATWG URL normalizes, including percent-encoded controls,
  // whitespace, backslashes and Unicode formatting used to disguise a destination.
  const unsafe = /[\s\p{Cc}\p{Cf}\\]/u;
  try {
    let decoded = value;
    for (let i = 0; i < 3; i++) {
      if (unsafe.test(decoded)) return undefined;
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    if (unsafe.test(decoded)) return undefined;
    if (/^#[^#]+$/.test(value)) return value;
    if (!/^https?:\/\/[^/?#]+/i.test(value)) return undefined;
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return undefined;
    // Empty userinfo is normalized away by URL; reject it in the authority too.
    if (value.slice(value.indexOf('//') + 2).split(/[/?#]/)[0].includes('@')) return undefined;
    return url.href;
  } catch { return undefined; }
}
