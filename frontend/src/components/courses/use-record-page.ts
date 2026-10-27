"use client";
import { useEffect, useRef, useState } from "react";
import type { ApiClient } from "../../lib/api/client.ts";
import type { Session } from "../../lib/auth/session.ts";
import { ApiHttpError, ApiResponseError } from "../../lib/api/errors.ts";
import { useResource } from "./use-resource.ts";

/** Retain an authorized page after a transient failure, never during loading or denial. */
export function useRecordPage<T>(
  session: Session,
  scope: string,
  cursor: string | undefined,
  load: (c: ApiClient) => Promise<T>,
) {
  const [last, setLast] = useState<{ scope: string; cursor?: string; data: T }>();
  const sequence = useRef(0);
  useEffect(() => () => { sequence.current++; }, []);
  const result = useResource(session, `${scope}:${cursor ?? ""}`, async (client) => {
    const request = ++sequence.current, context = session.getSnapshot().context;
    const current = () => request === sequence.current && context === session.getSnapshot().context;
    try {
      const data = await load(client);
      if (current()) setLast({ scope, cursor, data });
      return data;
    } catch (error) {
      if (current()) {
        const denied = error instanceof ApiResponseError || error instanceof ApiHttpError && [401,403,404].includes(error.status);
        setLast(previous => !denied && previous?.scope === scope ? previous : undefined);
      }
      throw error;
    }
  });
  const retained = !result.data && result.error && !result.accessDenied && last?.scope === scope ? last : undefined;
  return {
    ...result,
    data: result.data ?? retained?.data,
    retained: !!retained,
    shownCursor: retained ? retained.cursor : cursor,
  };
}
