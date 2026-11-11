import type { Session } from "../../lib/auth/session.ts";

type Receipt = { scope: ReturnType<Session["getSnapshot"]>["context"]; generation: number; id: string; courseId: string; announced: boolean };
const receipts = new WeakMap<Session, Receipt>();

export function rememberQuizCreation(session: Session, courseId: string, id: string) {
  const { context, generation } = session.getSnapshot();
  receipts.set(session, { scope: context, generation, courseId, id, announced: false });
}

export function quizCreationReceipt(session: Session, courseId: string, id?: string) {
  const receipt = receipts.get(session);
  const { context, generation } = session.getSnapshot();
  if (receipt?.scope !== context || receipt?.generation !== generation || receipt.courseId !== courseId || receipt.id !== id)
    return undefined;
  return receipt;
}

type Publication = Receipt & { title: string };
const publications = new WeakMap<Session, Publication>();

/** Carries a confirmed publication across navigation so the next view announces it once. */
export function rememberQuizPublication(session: Session, courseId: string, id: string, title: string) {
  const { context, generation } = session.getSnapshot();
  publications.set(session, { scope: context, generation, courseId, id, title, announced: false });
}

export function quizPublicationReceipt(session: Session, courseId: string) {
  const receipt = publications.get(session);
  const { context, generation } = session.getSnapshot();
  if (!receipt || receipt.scope !== context || receipt.generation !== generation || receipt.courseId !== courseId) return undefined;
  return receipt;
}
