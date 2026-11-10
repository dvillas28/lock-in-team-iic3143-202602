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
