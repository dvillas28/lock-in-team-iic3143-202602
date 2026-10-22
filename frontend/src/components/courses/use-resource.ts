"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiClient } from "../../lib/api/client.ts";
import type { Session } from "../../lib/auth/session.ts";
import { getRouteFeedback, type RouteFeedback } from "../../lib/route-feedback.ts";
// Each mounted resource owns its sequence; Session alone cannot order requests within a tenant.
export function useResource<T>(session: Session, resource: string, load: (client: ApiClient) => Promise<T>) {
  const [state, setState] = useState<{
    key: string;
    data?: T;
    error?: RouteFeedback;
  }>({ key: resource });
  const sequence = useRef(0);
  const loader = useRef(load);
  useEffect(() => { loader.current = load; });
  const reload = useCallback(async () => {
    const request = ++sequence.current, context = session.getSnapshot().context;
    await Promise.resolve();
    if (request !== sequence.current)
      return;
    setState({ key: resource });
    try {
      const data = await session.request(loader.current, () => request === sequence.current && context === session.getSnapshot().context);
      if (request === sequence.current && context === session.getSnapshot().context)
        setState({ key: resource, data });
    }
    catch (error) {
      if (request === sequence.current && context === session.getSnapshot().context)
        setState({ key: resource, error: getRouteFeedback(error) });
    }
  }, [session, resource]);
  useEffect(() => { void reload(); const counter = sequence; return () => { counter.current++; }; }, [reload]);
  return { ...(state.key === resource ? state : {}), reload };
}
