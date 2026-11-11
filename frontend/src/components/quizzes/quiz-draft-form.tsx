"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Save, Send } from "lucide-react";
import type { EvaluationGroup } from "../../lib/api/assignments.ts";
import type { Section } from "../../lib/courses/validation.ts";
import { checkNativeInputs, focusQuizError } from "../../lib/quizzes/form-values.ts";
import type { Authoring, Update } from "../../lib/quizzes/validation.ts";
import type { useMutation } from "../courses/use-mutation.ts";
import { questionRows } from "./question-editor.tsx";
import { readQuizDraft } from "../../lib/quizzes/draft-values.ts";
import { quizDraftFeedback } from "./quiz-draft-feedback.ts";
import { QuizDraftFields } from "./quiz-draft-fields.tsx";
import { QuizErrorSummary, useQuizForm } from "./use-quiz-form.tsx";

type Mutation = ReturnType<typeof useMutation>;
type Values = Update & Required<Pick<Update, "questions">>;

export function useQuizDraft(mutation: Mutation, original?: Authoring) {
  const [rows, setRows] = useState(() => questionRows(original?.questions ?? []));
  const [sentRows, setSentRows] = useState(rows);
  const form = useQuizForm(rows, original);
  const id = useId();

  function reset(next?: Authoring) {
    setRows(questionRows(next?.questions ?? []));
    form.reset();
  }

  return { form, id, rows, setRows, sentRows, setSentRows, reset, mutation, original };
}

export type PublishRequest = { values: Values; changed: boolean; persist: () => Promise<Authoring | undefined> };

export function QuizDraftForm({ draft, label, blocked, revision, groups, sections, wholeCourse, save, reconcile, persist, onPublish }: {
  draft: ReturnType<typeof useQuizDraft>;
  label: string;
  blocked: boolean;
  revision?: number;
  groups?: EvaluationGroup[];
  sections: Section[];
  wholeCourse: boolean;
  save: (values: Values, current: () => boolean, element: HTMLFormElement) => Promise<string | void>;
  reconcile: (current: () => boolean) => Promise<string>;
  /** Saves the validated values when needed and resolves the draft to publish. */
  persist?: (values: Values, current: () => boolean, element: HTMLFormElement) => Promise<Authoring>;
  onPublish?: (request: PublishRequest) => void;
}) {
  const { id, form, mutation, original, rows, setRows, sentRows, setSentRows } = draft;
  const { ref: formRef, blur, change, startPointerAction, summary, summaryRef } = form;
  const feedback = useRef<HTMLParagraphElement>(null);
  const server = quizDraftFeedback(mutation, sentRows, rows);

  useEffect(() => {
    if (!mutation.message || mutation.confirmed) return;
    if (!focusQuizError(formRef.current, server.field)) feedback.current?.focus();
  }, [formRef, mutation.message, server.field, mutation.confirmed]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (submitter?.getAttribute("value") === "publish") return requestPublication(element);
    if (blocked || (original && !form.hasChanges(element)) || !form.validate(element)) return;
    const data = new FormData(element);
    setSentRows(rows);
    await mutation.run(async current => {
      checkNativeInputs(element);
      const values = readQuizDraft(data, rows, original);
      return save(values, current, element);
    }, reconcile);
  }

  function requestPublication(element: HTMLFormElement) {
    if (blocked || !persist || !onPublish || !form.validate(element, true)) return;
    const data = new FormData(element);
    let values: Values;
    try {
      checkNativeInputs(element);
      values = readQuizDraft(data, rows, original);
    } catch {
      return;
    }
    const changed = !original || form.hasChanges(element);
    onPublish({ values, changed, persist: async () => {
      if (original && !changed) return original;
      let saved: Authoring | undefined;
      setSentRows(rows);
      await mutation.run(async current => {
        saved = await persist(values, current, element);
        return original ? "Cambios guardados." : "Borrador guardado.";
      }, reconcile);
      return saved;
    } });
  }

  function update(event: FormEvent<HTMLFormElement>) {
    if (server.changed(event.target)) mutation.clearErrors();
    change(event);
  }

  return <form id={id} key={revision} ref={formRef} aria-label={label} className="stack" onSubmit={submit}
    onPointerDownCapture={startPointerAction} onBlur={blur} onInput={update} onChange={update}
    noValidate aria-busy={mutation.busy}>
    <QuizErrorSummary summary={summary} summaryRef={summaryRef} formRef={formRef}/>
    {server.general && <p className="notice" ref={feedback} tabIndex={-1}
      role={mutation.confirmed ? "status" : "alert"}>{server.general}</p>}
    <fieldset className="stack" disabled={blocked}>
      <QuizDraftFields item={original} sections={sections} wholeCourse={wholeCourse} groups={groups} rows={rows}
        onRows={(next, removedCorrect) => {
          if (removedCorrect !== undefined) form.touchCorrect(removedCorrect);
          setRows(next);
        }}
        error={field => form.error(field) ?? server.error(field)}/>
    </fieldset>
  </form>;
}

export function QuizDraftSave({ form, busy, blocked }: { form: string; busy: boolean; blocked: boolean }) {
  return <button type="submit" form={form} className="btn btn-ghost quiz-draft-save" disabled={blocked}>
    <Save size={16} aria-hidden="true"/>{busy ? "Guardando…" : "Guardar borrador"}
  </button>;
}

export function QuizPublishSubmit({ form, blocked }: { form: string; blocked: boolean }) {
  return <button type="submit" form={form} value="publish" className="btn btn-primary" disabled={blocked}>
    <Send size={16} aria-hidden="true"/>Publicar quiz
  </button>;
}
