"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiClient } from "../../lib/api/client.ts";
import { ApiHttpError, ApiResponseError } from "../../lib/api/errors.ts";
import type { Session } from "../../lib/auth/session.ts";
import { getRouteFeedback, type RouteFeedback } from "../../lib/route-feedback.ts";
// Each mounted resource owns its sequence; Session alone cannot order requests within a tenant.
export function useResource<T>(session: Session, resource: string, load: (client: ApiClient) => Promise<T>, preserve = true) {
  const [state, setState] = useState<{
    key: string;
    data?: T;
    error?: RouteFeedback;
    refreshing?: boolean;
    accessDenied?: boolean;
  }>({ key: resource });
  const sequence = useRef(0);
  const loader = useRef(load);
  useEffect(() => { loader.current = load; });
  const reload = useCallback(async () => {
    const request = ++sequence.current, context = session.getSnapshot().context;
    await Promise.resolve();
    if (request !== sequence.current)
      return;
    setState(previous => ({ key: resource, data: preserve && previous.key === resource ? previous.data : undefined, refreshing: true }));
    try {
      const data = await session.request(loader.current, () => request === sequence.current && context === session.getSnapshot().context);
      if (request === sequence.current && context === session.getSnapshot().context)
        setState({ key: resource, data });
      return true;
    }
    catch (error) {
      if (request === sequence.current && context === session.getSnapshot().context) {
        const accessDenied = error instanceof ApiResponseError || error instanceof ApiHttpError && [401,403,404].includes(error.status);
        setState(previous => ({ key: resource, data: !accessDenied && preserve && previous.key === resource ? previous.data : undefined, error: getRouteFeedback(error), accessDenied }));
      }
      return false;
    }
  }, [session, resource, preserve]);
  useEffect(() => { void reload(); const counter = sequence; return () => { counter.current++; }; }, [reload]);
  return { ...(state.key === resource ? state : {}), reload };
}
