"use client";
import { useEffect, useRef } from "react";
import type { ApiClient } from "../../lib/api/client.ts";
import type { Session } from "../../lib/auth/session.ts";
import { useResource } from "./use-resource.ts";

/** Only retain an already authorized page on failure, never while a new page loads. */
export function useRecordPage<T>(
  session: Session,
  scope: string,
  cursor: string | undefined,
  load: (c: ApiClient) => Promise<T>,
) {
  const result = useResource(session, `${scope}:${cursor ?? ""}`, load);
  const last = useRef<{ scope: string; cursor?: string; data: T }>(undefined);
  useEffect(() => {
    if (result.accessDenied || last.current?.scope !== scope) last.current = undefined;
    if (result.data && !result.error && !result.refreshing)
      last.current = { scope, cursor, data: result.data };
  }, [scope, cursor, result.data, result.error, result.refreshing, result.accessDenied]);
  const retained =
    !result.data && result.error && !result.accessDenied && last.current?.scope === scope
      ? last.current
      : undefined;
  return {
    ...result,
    data: result.data ?? retained?.data,
    retained: !!retained,
    shownCursor: retained ? retained.cursor : cursor,
  };
}
