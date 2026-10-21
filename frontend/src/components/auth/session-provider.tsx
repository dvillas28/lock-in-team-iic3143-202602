"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Session } from "../../lib/auth/session.ts";

const subscribeHost = () => () => {};
const readHost = () => window.location.hostname;
const serverHost = () => undefined;

const SessionContext = createContext<{ session: Session; hostname?: string } | null>(null);
export function SessionProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [session] = useState(() => new Session());
  const hostname = useSyncExternalStore(subscribeHost, readHost, serverHost);
  useEffect(() => {
    const expire = () => session.checkExpiry();
    const leave = () => session.logout();
    window.addEventListener("focus", expire);
    window.addEventListener("pageshow", expire);
    window.addEventListener("pagehide", leave);
    document.addEventListener("visibilitychange", expire);
    return () => {
      window.removeEventListener("focus", expire);
      window.removeEventListener("pageshow", expire);
      window.removeEventListener("pagehide", leave);
      document.removeEventListener("visibilitychange", expire);
      session.logout();
    };
  }, [session]);
  return <SessionContext.Provider value={{ session, hostname }}>{children}</SessionContext.Provider>;
}
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("SessionProvider required");
  const state = useSyncExternalStore(context.session.subscribe, context.session.getSnapshot, context.session.getSnapshot);
  return { ...context, state };
}
