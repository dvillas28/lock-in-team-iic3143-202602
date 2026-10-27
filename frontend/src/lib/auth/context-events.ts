import type { Session } from './session.ts';

/** Coalesce focus, visibility and bfcache events; never refresh a hidden page. */
export function watchContextAccess(session: Session, slug: string, win: Window, doc: Document) {
  let scheduled = false, active = true;
  const refresh = () => {
    session.checkExpiry();
    if (doc.visibilityState === 'hidden' || scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      if (active && doc.visibilityState !== 'hidden') void session.loadContext(slug);
    });
  };
  win.addEventListener('focus', refresh);
  win.addEventListener('pageshow', refresh);
  doc.addEventListener('visibilitychange', refresh);
  return () => {
    active = false;
    win.removeEventListener('focus', refresh);
    win.removeEventListener('pageshow', refresh);
    doc.removeEventListener('visibilitychange', refresh);
  };
}
