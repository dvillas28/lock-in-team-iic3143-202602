"use client";

import { useEffect, useEffectEvent, useRef, useState, type FocusEvent, type FormEvent, type PointerEvent, type RefObject } from "react";
import { FieldError } from "../../lib/courses/validation.ts";
import { checkNativeInputs, configurationDate, formNumber, focusQuizError, quizNativeError } from "../../lib/quizzes/form-values.ts";
import { quizText, validateQuizDraftDate, validateQuizSchedule, type Authoring } from "../../lib/quizzes/validation.ts";
import { quizDraftChanges, readQuizDraft, type QuestionRow } from "../../lib/quizzes/draft-values.ts";

type Issue = { field: string; message: string; key: string; label: string };

function fieldKey(field: string, rows: QuestionRow[]) {
  const match = /^questions\.(\d+)\.(.+)$/.exec(field);
  if (!match) return field;
  const row = rows[Number(match[1])];
  if (!row) return field;
  const alternative = /^alternatives\.(\d+)\.text$/.exec(match[2]);
  return alternative
    ? `alternative-${row.key}-${row.alternatives[Number(alternative[1])]?.key}`
    : `question-${row.key}-${match[2]}`;
}

export function quizControlField(control: EventTarget) {
  return control instanceof HTMLElement && "name" in control
    ? control.dataset.errorField || String(control.name)
    : "";
}

function issuesIn(form: HTMLFormElement, rows: QuestionRow[], original?: Authoring) {
  const issues: Issue[] = [];
  const data = new FormData(form);
  const now = Date.now();
  const dates: Record<"opensAt" | "closesAt", string | null> = { opensAt: null, closesAt: null };
  const seen = new Set<string>();
  for (const element of Array.from(form.elements)) {
    const field = quizControlField(element);
    if (!field || seen.has(field) || element.getAttribute("type") === "hidden") continue;
    seen.add(field);
    try {
      if (element instanceof HTMLInputElement && element.validity.badInput)
        throw new FieldError(field, quizNativeError(element));
      const value = String(data.get(field) ?? "");
      if (field === "opensAt" || field === "closesAt") {
        dates[field] = configurationDate(data, field, original);
        validateQuizDraftDate(field, dates[field], original?.[field], now);
      } else if (field === "title" || field === "instructions" || /\.(prompt|text)$/.test(field)) {
        quizText(value, field);
      } else if (field.endsWith(".points") || (field === "maxAttempts" && value)) {
        formNumber(value, field, field === "maxAttempts");
      } else if (field.endsWith(".correct") && element instanceof HTMLInputElement && !data.has(element.name)) {
        throw new FieldError(field, "Selecciona una respuesta correcta para esta pregunta.");
      }
    } catch (error) {
      if (!(error instanceof FieldError)) throw error;
      issues.push(issue(field, error.message, element, rows));
    }
  }
  if (!issues.some(entry => entry.field === "opensAt" || entry.field === "closesAt")) {
    try {
      validateQuizSchedule(dates.opensAt, dates.closesAt);
    } catch (error) {
      if (!(error instanceof FieldError)) throw error;
      issues.push(issue(error.field, error.message, form.querySelector('[name="closesAt"]'), rows));
    }
  }
  return issues;
}

function issue(field: string, message: string, input: Element | null, rows: QuestionRow[]): Issue {
  const question = /^questions\.(\d+)\./.exec(field);
  const label = field.endsWith(".correct") ? "Respuesta correcta"
    : input && "labels" in input ? (input.labels as NodeListOf<HTMLLabelElement> | null)?.[0]?.textContent?.trim() : undefined;
  return { field, message, key: fieldKey(field, rows),
    label: [question && `Pregunta ${Number(question[1]) + 1}`, label].filter(Boolean).join(" · ") || "Formulario" };
}

function snapshot(form: HTMLFormElement) {
  // Read controls directly so a disabled fieldset during a request keeps the same fingerprint.
  return JSON.stringify(Array.from(form.elements).flatMap(element => {
    if (element instanceof HTMLInputElement)
      return [[element.name, element.value, element.validity.badInput, element.type === "radio" && element.checked]];
    if ("value" in element && "name" in element && element.name && element.tagName !== "BUTTON")
      return [[element.name, element.value]];
    return [];
  }));
}

export function useQuizForm(rows: QuestionRow[], original?: Authoring) {
  const ref = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const baseline = useRef<string>(undefined);
  const pendingReveal = useRef<string>(undefined);
  const pointerAction = useRef(false);
  const pointerReveal = useRef<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  function hasChanges(form: HTMLFormElement, raw = snapshot(form)) {
    if (raw === baseline.current) return false;
    if (!original) return true;
    try {
      checkNativeInputs(form);
      return Object.keys(quizDraftChanges(readQuizDraft(new FormData(form), rows, original), original)).length > 0;
    } catch (error) {
      if (error instanceof FieldError) return true;
      throw error;
    }
  }

  function inspect(form: HTMLFormElement, reveal: string[] = []) {
    if (form.querySelector(":scope > fieldset:disabled")) return;
    const current = snapshot(form);
    baseline.current ??= current;
    setDirty(hasChanges(form, current));
    const available = issuesIn(form, rows, original);
    setIssues(previous => {
      const visible = new Set([...reveal, ...previous.map(entry => entry.key)]);
      const next = available.filter(entry => visible.has(entry.key));
      return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
    });
  }

  const syncStructure = useEffectEvent(() => {
    if (ref.current && !ref.current.querySelector("fieldset:disabled")) {
      inspect(ref.current, pendingReveal.current ? [pendingReveal.current] : []);
      pendingReveal.current = undefined;
    }
  });
  useEffect(() => { syncStructure(); }, [rows, original]);

  const flushPointerBlur = useEffectEvent(() => {
    const reveal = pointerReveal.current;
    pointerReveal.current = [];
    if (ref.current && reveal.length && !ref.current.querySelector("fieldset:disabled"))
      inspect(ref.current, reveal);
  });

  useEffect(() => {
    let frame = 0;
    function release() {
      if (!pointerAction.current) return;
      pointerAction.current = false;
      // A blur can insert an error above the pressed button. Wait until its click has landed.
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        flushPointerBlur();
      });
    }
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function startPointerAction(event: PointerEvent<HTMLFormElement>) {
    if (event.isPrimary && event.button === 0) pointerAction.current = true;
  }


  const focusSummary = useEffectEvent(() => {
    if (issues.length === 1 && focusQuizError(ref.current, issues[0].field)) return;
    summaryRef.current?.focus();
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { if (attempt) focusSummary(); }, [attempt]);

  function blur(event: FocusEvent<HTMLFormElement>) {
    const field = quizControlField(event.target);
    const form = event.currentTarget;
    const group = event.target.closest<HTMLFieldSetElement>(".quiz-question");
    if (field.endsWith(".correct") && event.relatedTarget && group?.contains(event.relatedTarget)
      && quizControlField(event.relatedTarget) === field) return;
    const reveal = field ? [fieldKey(field, rows)] : [];
    if (field === "opensAt" && form.elements.namedItem("closesAt") instanceof HTMLInputElement
      && (form.elements.namedItem("closesAt") as HTMLInputElement).value) reveal.push("closesAt");
    if (group && !group.contains(event.relatedTarget) && group.querySelector('input[type="radio"]')
      && Array.from(group.querySelectorAll<HTMLInputElement>('input[name$=".text"]')).every(input => input.value.trim())) {
      const radio = group.querySelector('input[type="radio"]')!;
      reveal.push(fieldKey(quizControlField(radio), rows));
    }
    if (!reveal.length) return;
    if (pointerAction.current) pointerReveal.current.push(...reveal);
    else inspect(form, reveal);
  }

  function change(event: FormEvent<HTMLFormElement>) {
    inspect(event.currentTarget);
  }

  function validate(form: HTMLFormElement) {
    const next = issuesIn(form, rows, original);
    if (!next.length) {
      if (issues.length) setIssues([]);
      return true;
    }
    setIssues(next);
    setShowSummary(true);
    setAttempt(previous => previous + 1);
    return false;
  }

  function reset() {
    baseline.current = undefined;
    pendingReveal.current = undefined;
    pointerReveal.current = [];
    setIssues([]);
    setDirty(false);
    setShowSummary(false);
  }

  return {
    ref, dirty, hasChanges, change, blur, startPointerAction, validate, reset, summaryRef,
    summary: showSummary ? issues : [],
    touchCorrect: (key: number) => { pendingReveal.current = `question-${key}-correct`; },
    error: (field: string) => issues.find(entry => entry.key === fieldKey(field, rows))?.message,
  };
}

export function QuizErrorSummary({ summary, summaryRef, formRef }: {
  summary: Issue[];
  summaryRef: RefObject<HTMLDivElement | null>;
  formRef: RefObject<HTMLFormElement | null>;
}) {
  if (!summary.length) return null;
  return <div className="notice quiz-error-summary" ref={summaryRef} tabIndex={-1} role="group" aria-label="Campos que debes revisar">
    <strong>Revisa estos campos</strong>
    <ul>{summary.map(issue => <li key={issue.key}>
      <button type="button" className="text-link" onClick={() => focusQuizError(formRef.current, issue.field)}>
        {issue.label}
      </button>
    </li>)}</ul>
  </div>;
}
