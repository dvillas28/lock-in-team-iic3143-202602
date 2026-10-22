"use client";

import { ErrorState } from "../../components/route-states.tsx";
import { getRouteFeedback } from "../../lib/route-feedback.ts";

export default function InstitutionError({ error, reset }: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return <ErrorState feedback={getRouteFeedback(error)} onRetry={reset} />;
}
