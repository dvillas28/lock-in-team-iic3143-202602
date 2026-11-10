"use client";

import { useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";

type HistoryEntry = { key: string; url: string };
type TraverseEvent = Event & {
  navigationType: string;
  destination: HistoryEntry & { sameDocument: boolean };
};
type BrowserNavigation = EventTarget & {
  currentEntry: HistoryEntry | null;
  traverseTo: (key: string) => { finished: Promise<unknown> };
};

/** Warn only while the authorized editor has work or a write to recover. */
type LeaveCopy = { title: string; body: string; stay: string; leave: string };
const formCopy: LeaveCopy = {
  title: "¿Salir del formulario?",
  body: "Si sales, perderás los cambios sin guardar y cualquier operación pendiente de confirmar.",
  stay: "Seguir editando",
  leave: "Salir del formulario",
};

export function QuizLeaveGuard({ active, copy = formCopy }: { active: boolean; copy?: LeaveCopy }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const stay = useRef<HTMLButtonElement>(null);
  const proceed = useRef<(() => void) | undefined>(undefined);
  const trigger = useRef<HTMLElement | null>(null);
  const allowed = useRef(false);
  const title = useId();

  function close() {
    proceed.current = undefined;
    dialog.current?.close();
    trigger.current?.focus();
  }

  useEffect(() => {
    if (!active) {
      allowed.current = false;
      dialog.current?.close();
      return;
    }
    const navigation = (window as Window & { navigation?: BrowserNavigation }).navigation;
    let traversal: { from: string; to: string } | undefined;
    let restoring = false;

    function ask(action: () => void) {
      if (dialog.current?.open) return;
      trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      proceed.current = action;
      dialog.current?.showModal();
      stay.current?.focus();
    }

    function unload(event: BeforeUnloadEvent) {
      if (allowed.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    function click(event: MouseEvent) {
      if (allowed.current || event.defaultPrevented || event.button !== 0
        || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof window.Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const next = new URL(link.href);
      const here = window.location;
      if (next.origin === here.origin && next.pathname === here.pathname && next.search === here.search) return;
      if (next.protocol !== "http:" && next.protocol !== "https:") return;
      event.preventDefault();
      event.stopPropagation();
      ask(() => {
        if (link.isConnected && link.href === next.href) link.click();
        else if (next.origin === here.origin) router.push(next.pathname + next.search + next.hash);
        else window.location.assign(next.href);
        if (next.origin === here.origin) allowed.current = false;
      });
    }

    function navigate(raw: Event) {
      const event = raw as TraverseEvent;
      if (!navigation || allowed.current || restoring || event.navigationType !== "traverse" || !event.destination.sameDocument) return;
      const current = navigation?.currentEntry;
      if (!current?.url || !event.destination.url) return;
      const from = new URL(current.url);
      const to = new URL(event.destination.url);
      if (from.pathname === to.pathname && from.search === to.search) return;
      if (event.cancelable) {
        event.preventDefault();
        ask(() => { void navigation.traverseTo(event.destination.key).finished.catch(() => { allowed.current = false; }); });
      } else {
        // Browser toolbar traversal cannot be canceled. Restore the editor entry before Next handles it.
        traversal = { from: current.key, to: event.destination.key };
      }
    }

    function pop(event: PopStateEvent) {
      if (restoring) {
        event.stopImmediatePropagation();
        return;
      }
      if (!navigation || !traversal || allowed.current) return;
      event.stopImmediatePropagation();
      const { from, to } = traversal;
      traversal = undefined;
      restoring = true;
      void navigation.traverseTo(from).finished.then(() => {
        restoring = false;
        ask(() => { void navigation.traverseTo(to).finished.catch(() => { allowed.current = false; }); });
      }, () => {
        restoring = false;
        // Keep the current React view and offer the same exit decision if the entry disappeared.
        ask(() => router.refresh());
      });
    }

    document.addEventListener("click", click, true);
    window.addEventListener("beforeunload", unload);
    navigation?.addEventListener("navigate", navigate);
    window.addEventListener("popstate", pop, true);
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("beforeunload", unload);
      navigation?.removeEventListener("navigate", navigate);
      window.removeEventListener("popstate", pop, true);
    };
  }, [active, router]);

  return <dialog ref={dialog} className="modal native-dialog panel quiz-leave-dialog" aria-labelledby={title}
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      const last = event.currentTarget.querySelector<HTMLButtonElement>(".btn-danger");
      if (event.shiftKey && document.activeElement === stay.current) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        stay.current?.focus();
      }
    }}
    onCancel={event => { event.preventDefault(); close(); }}>
    <h2 className="serif" id={title}>{copy.title}</h2>
    <p>{copy.body}</p>
    <div className="actions">
      <button className="btn btn-ghost" type="button" ref={stay} onClick={close}>{copy.stay}</button>
      <button className="btn btn-danger" type="button" onClick={() => {
        const action = proceed.current;
        if (!action) return;
        proceed.current = undefined;
        allowed.current = true;
        dialog.current?.close();
        action();
      }}>{copy.leave}</button>
    </div>
  </dialog>;
}
