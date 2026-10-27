import type { Session } from './session.ts';

/** Coalesce focus, visibility and bfcache events; never refresh a hidden page. */
export function watchContextAccess(session: Session, slug: string, win: Window, doc: Document) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refresh = () => {
    session.checkExpiry();
    if (doc.visibilityState === 'hidden' || timer !== undefined) return;
    timer = setTimeout(() => {
      timer = undefined;
      if (doc.visibilityState !== 'hidden') void session.loadContext(slug);
    }, 0);
  };
  win.addEventListener('focus', refresh);
  win.addEventListener('pageshow', refresh);
  doc.addEventListener('visibilitychange', refresh);
  return () => {
    clearTimeout(timer);
    win.removeEventListener('focus', refresh);
    win.removeEventListener('pageshow', refresh);
    doc.removeEventListener('visibilitychange', refresh);
  };
}
