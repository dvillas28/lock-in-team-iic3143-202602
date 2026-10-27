"use client";
import { useEffect, useRef, useState } from "react";
import { ApiHttpError } from "../../lib/api/errors.ts";
import { FieldError } from "../../lib/courses/validation.ts";
import { getRouteFeedback } from "../../lib/route-feedback.ts";
import type { Session } from "../../lib/auth/session.ts";
import { useTransientFeedback, type Feedback } from "../use-feedback.ts";
export function useMutation(session: Session) {
  const [status, setStatus] = useState<{
    busy: boolean;
    confirmed?: boolean;
    message?: string;
    field?: string;
    uncertain?: boolean;
    persistent?: boolean;
  }>({ busy: false });
  const message = useTransientFeedback(status.message, !!status.confirmed && !status.persistent, status);
  const locked = useRef(false), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function run(operation: (current: () => boolean) => Promise<void | Feedback>, reconcile: (current: () => boolean) => Promise<string>) {
    if (locked.current)
      return;
    locked.current = true;
    const context = session.getSnapshot().context, generation = session.getSnapshot().generation;
    const current = () => alive.current && context === session.getSnapshot().context && generation === session.getSnapshot().generation;
    setStatus({ busy: true });
    try {
      const feedback = await operation(current);
      if (current())
        setStatus({ busy: false, confirmed: true, ...(typeof feedback === "object" ? feedback : { message: feedback || "Operación completada." }) });
      locked.current = false;
    }
    catch (error) {
      if (!current())
        return;
      if (error instanceof FieldError) {
        setStatus({ busy: false, field: error.field, message: error.message });
        locked.current = false;
        return;
      }
      if (error instanceof ApiHttpError && error.status < 500) {
        if (error.status === 409) {
          try {
            await reconcile(current);
          }
          catch { /* A conflict stays rejected even if the state cannot be read. */ }
        }
        if (!current())
          return;
        const rejectedField = error.problem.errors?.[0]?.field;
        const field = rejectedField === 'initialSection.code' ? 'sectionCode' : rejectedField === 'initialSection.capacity' ? 'capacity' : rejectedField;
        setStatus({ busy: false, field, message: error.status === 409 ? "Conflicto: revisa el estado antes de cambiar los datos." : error.status === 413 ? "Revisa el tamaño total: JSON máximo 4096 bytes UTF-8. El formulario autorizado se conserva." : error.status === 400 || error.status === 422 ? "Revisa los campos y sus límites. El servidor rechazó los valores." : getRouteFeedback(error).message });
        locked.current = false;
        return;
      }
      setStatus({ busy: true, uncertain: true, message: "Resultado incierto. Consultando el estado antes de repetir." });
      let observed = "No se pudo consultar el estado.";
      try {
        observed = await reconcile(current);
      }
      catch { /* Keep uncertainty when reconciliation fails. */ }
      if (current())
        setStatus({ busy: false, uncertain: true, message: `Resultado incierto. ${observed} Revisa el estado antes de realizar otra operación; este envío sigue bloqueado.` });
    }
  }
  return { ...status, message, run };
}
