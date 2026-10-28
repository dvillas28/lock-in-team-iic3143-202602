"use client";
import { useEffect, useState } from "react";

export const SUCCESS_FEEDBACK_MS = 5000;
export type Feedback = string | { message: string; persistent: true };

/** Only presentation expires; operation state, receipts and errors stay intact. */
export function useTransientFeedback(
  message: string | undefined,
  transient: boolean,
  occurrence: unknown = message,
) {
  const [expired, setExpired] = useState<{ occurrence: unknown }>();
  useEffect(() => {
    if (!message || !transient) return;
    const timer = setTimeout(() => setExpired({ occurrence }), SUCCESS_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [message, transient, occurrence]);
  return transient && expired?.occurrence === occurrence ? undefined : message;
}

/** A new object gives identical consecutive confirmations their own lifetime. */
export function useFeedbackState() {
  const [feedback, setFeedback] = useState<{ message: string; persistent: boolean }>({ message: "", persistent: false });
  const message = useTransientFeedback(feedback.message, !feedback.persistent, feedback);
  function show(value: Feedback) {
    setFeedback(typeof value === "string" ? { message: value, persistent: false } : value);
  }
  return [message, show] as const;
}
