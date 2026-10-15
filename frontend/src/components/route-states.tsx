import { CircleAlert, FileQuestion, Inbox, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useId, type ReactNode } from "react";

import type { RouteFeedback } from "../lib/route-feedback.ts";

type StatePanelProps = Readonly<{
  title: string;
  message?: string;
  icon: ReactNode;
  children?: ReactNode;
  heading?: "h1" | "h2";
  role?: "status" | "alert";
  busy?: boolean;
}>;

function StatePanel({ title, message, icon, children, heading: Heading = "h1", role, busy }: StatePanelProps) {
  const titleId = useId();
  return (
    <section className="empty-zone panel stack" aria-labelledby={titleId} aria-busy={busy}>
      <div role={role} className="stack">
        <span aria-hidden="true">{icon}</span>
        <Heading id={titleId} className="serif">{title}</Heading>
        {message && <p className="hint">{message}</p>}
      </div>
      {children && <div className="state-actions">{children}</div>}
    </section>
  );
}

export function LoadingState() {
  return <StatePanel title="Cargando contenido" message="Espera un momento." icon={<LoaderCircle size={20} />} role="status" busy />;
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
