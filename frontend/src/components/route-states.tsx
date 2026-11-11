import { CircleAlert, FileQuestion, Inbox } from "lucide-react";
import Link from "next/link";
import { useId, type ReactNode } from "react";

import type { RouteFeedback } from "../lib/route-feedback.ts";
import { Skeleton, SkeletonRegion } from "./skeletons.tsx";

/**
 * Semantic level of a state's title. Route-level states replace the whole page and keep `1`; a state
 * nested under the page `<h1>` (or a section heading) passes the next level so the outline stays valid.
 */
export type StateHeadingLevel = 1 | 2 | 3 | 4;

type StatePanelProps = Readonly<{
  title: string;
  message?: string;
  icon: ReactNode;
  children?: ReactNode;
  headingLevel: StateHeadingLevel;
  role?: "status" | "alert";
}>;

function StatePanel({ title, message, icon, children, headingLevel, role }: StatePanelProps) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;
  return (
    <section className="empty-zone panel stack" aria-labelledby={titleId}>
      <div role={role} className="stack">
        <span aria-hidden="true">{icon}</span>
        <Heading id={titleId} className="serif state-title">{title}</Heading>
        {message && <p className="hint">{message}</p>}
      </div>
      {children && <div className="state-actions">{children}</div>}
    </section>
  );
}

/**
 * Neutral fallback for views whose geometry is unknown or not yet authorized: one announcement,
 * no heading and no controls, and the same reveal delay and pulse as the contextual skeletons.
 */
export function LoadingState() {
  return <SkeletonRegion label="Cargando contenido…">
    <div className="card panel stack">
      <Skeleton width="min(16rem, 60%)" />
      <Skeleton width="90%" />
      <Skeleton width="72%" />
    </div>
  </SkeletonRegion>;
}

/**
 * Successful query with no items. Callers describe the collection in `title`/`message`; `action` is
 * only for a real control the current role may use (never a placeholder or a hidden permission).
 */
export function EmptyState({ title = "Sin contenido para mostrar", message, action, headingLevel = 2 }: Readonly<{
  title?: string;
  message?: string;
  action?: ReactNode;
  headingLevel?: StateHeadingLevel;
}>) {
  return <StatePanel title={title} message={message} icon={<Inbox size={20} />} headingLevel={headingLevel}>{action}</StatePanel>;
}

export function ErrorState({ feedback, onRetry, headingLevel = 1 }: Readonly<{
  feedback: RouteFeedback;
  onRetry?: () => void;
  headingLevel?: StateHeadingLevel;
}>) {
  return (
    <StatePanel title={feedback.title} message={feedback.message} icon={<CircleAlert size={20} />} role="alert" headingLevel={headingLevel}>
      {feedback.retryable && onRetry && <button type="button" className="btn btn-primary" onClick={onRetry}>Reintentar</button>}
      <Link href="/" className="btn btn-ghost">Volver al inicio</Link>
    </StatePanel>
  );
}

export function NotFoundState({ headingLevel = 1 }: Readonly<{ headingLevel?: StateHeadingLevel }>) {
  return (
    <StatePanel title="Recurso no disponible" message="El recurso no existe o no está disponible." icon={<FileQuestion size={20} />} headingLevel={headingLevel}>
      <Link href="/" className="btn btn-primary">Volver al inicio</Link>
    </StatePanel>
  );
}
