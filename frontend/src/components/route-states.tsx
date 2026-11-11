import { CircleAlert, FileQuestion, Inbox } from "lucide-react";
import Link from "next/link";
import { useId, type ReactNode } from "react";

import type { RouteFeedback } from "../lib/route-feedback.ts";
import { Skeleton, SkeletonRegion } from "./skeletons.tsx";

type StatePanelProps = Readonly<{
  title: string;
  message?: string;
  icon: ReactNode;
  children?: ReactNode;
  heading?: "h1" | "h2";
  role?: "status" | "alert";
}>;

function StatePanel({ title, message, icon, children, heading: Heading = "h1", role }: StatePanelProps) {
  const titleId = useId();
  return (
    <section className="empty-zone panel stack" aria-labelledby={titleId}>
      <div role={role} className="stack">
        <span aria-hidden="true">{icon}</span>
        <Heading id={titleId} className="serif">{title}</Heading>
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

export function EmptyState() {
  return <StatePanel title="Sin contenido para mostrar" icon={<Inbox size={20} />} heading="h2" />;
}

export function ErrorState({ feedback, onRetry }: Readonly<{
  feedback: RouteFeedback;
  onRetry?: () => void;
}>) {
  return (
    <StatePanel title={feedback.title} message={feedback.message} icon={<CircleAlert size={20} />} role="alert">
      {feedback.retryable && onRetry && <button type="button" className="btn btn-primary" onClick={onRetry}>Reintentar</button>}
      <Link href="/" className="btn btn-ghost">Volver al inicio</Link>
    </StatePanel>
  );
}

export function NotFoundState() {
  return (
    <StatePanel title="Recurso no disponible" message="El recurso no existe o no está disponible." icon={<FileQuestion size={20} />}>
      <Link href="/" className="btn btn-primary">Volver al inicio</Link>
    </StatePanel>
  );
}
