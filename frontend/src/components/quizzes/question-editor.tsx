"use client";

import { useEffect, useId, useRef } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { QuestionRow } from "../../lib/quizzes/draft-values.ts";
import type { Question } from "../../lib/quizzes/validation.ts";
import { Field } from "../courses/form-fields.tsx";
import { useFeedbackState } from "../use-feedback.ts";

function letter(index: number): string {
  return (index >= 26 ? letter(Math.floor(index / 26) - 1) : "") + String.fromCharCode(65 + index % 26);
}

export function QuestionEditor({ rows, onRows, error = () => undefined }: {
  rows: QuestionRow[];
  onRows: (rows: QuestionRow[], removedCorrect?: number) => void;
  error?: (field: string) => string | undefined;
}) {
  const sequence = useRef(1000000);
  const container = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef("");
  const [notice, setNotice] = useFeedbackState();
  const errorId = useId();
  useEffect(() => {
    if (pendingFocus.current) {
      container.current?.querySelector<HTMLElement>(pendingFocus.current)?.focus();
      pendingFocus.current = "";
    }
  }, [rows]);

  function update(next: QuestionRow[], focus: string, announcement: string, removedCorrect?: number) {
    pendingFocus.current = focus;
    onRows(next.map((q, i) => ({ ...q, position: i + 1 })), removedCorrect);
    setNotice(announcement);
  }

  return <div className="stack quiz-questions" ref={container}>
    <div className="quiz-section-heading">
      <h2 className="serif">Preguntas y pauta</h2>
      <span className="chip tnum">{rows.length} {rows.length === 1 ? "pregunta" : "preguntas"}</span>
    </div>
    {!rows.length && (error("questions")
      ? <p className="field-error" id={`${errorId}-questions`}>{error("questions")}</p>
      : <p className="hint">Puedes guardar el borrador sin preguntas.</p>)}
    {rows.map((q, i) => {
      const field = `questions.${i}`;
      const number = i + 1;
      const correctError = error(`${field}.correct`);
      const correctErrorId = `${errorId}-correct-${q.key}`;
      const promptError = error(`${field}.prompt`) || error(field);
      const pointsError = error(`${field}.points`);
      return <fieldset className="card panel stack quiz-question" key={q.key}>
        <legend>Pregunta {number}</legend>
        <div className="quiz-question-fields">
          <Field name={`${field}.prompt`} label="Enunciado" multiline value={q.prompt}
            invalid={!!promptError} error={promptError}/>
          <Field name={`${field}.points`} label="Puntaje" type="number" min={0.01} max={999999.99} step={0.01}
            value={String(q.points)} invalid={!!pointsError} error={pointsError}/>
        </div>
        <fieldset className="stack quiz-answer-group" aria-invalid={!!correctError || undefined} aria-describedby={correctError ? correctErrorId : undefined}>
          <legend>Alternativas</legend>
          {q.alternatives.map((a, j) => {
            const optionField = `${field}.alternatives.${j}`;
            const textError = error(`${optionField}.text`);
            const name = letter(j);
            return <div className="quiz-alternative" key={a.key}>
              <input type="hidden" name={`${optionField}.id`} value={a.id}/>
              <Field name={`${optionField}.text`} label={`Alternativa ${name}`} value={a.text}
                invalid={!!textError} error={textError}/>
              <label className="quiz-correct-option">
                <input type="radio" name={`correct-${q.key}`} value={a.key} defaultChecked={a.isCorrect}
                  aria-label={`Marcar alternativa ${name} como correcta en pregunta ${number}`}
                  data-error-field={`${field}.correct`}
                  aria-describedby={correctError ? correctErrorId : undefined}/>
                Correcta
              </label>
              <button className="icon-btn" type="button" aria-label={`Eliminar alternativa ${name} de pregunta ${number}`}
                title={q.alternatives.length <= 2 ? "Se requieren al menos dos alternativas" : "Eliminar alternativa"}
                disabled={q.alternatives.length <= 2} onClick={event => {
                  const selected = event.currentTarget.parentElement?.querySelector<HTMLInputElement>('input[type="radio"]')?.checked;
                  const alternatives = q.alternatives.filter(x => x.key !== a.key);
                  update(rows.map(p => p.key === q.key ? { ...p, alternatives } : p),
                    `[name="${field}.alternatives.${Math.min(j, alternatives.length - 1)}.text"]`,
                    `Alternativa ${name} eliminada de la pregunta ${number}.`, selected ? q.key : undefined);
                }}><Trash2 size={16} aria-hidden="true"/></button>
            </div>;
          })}
          {correctError && <p id={correctErrorId} className="field-error">{correctError}</p>}
          {error(`${field}.alternatives`) && <p className="field-error">{error(`${field}.alternatives`)}</p>}
        </fieldset>
        <div className="quiz-question-actions">
          <button type="button" className="btn btn-ghost" aria-label={`Agregar alternativa a pregunta ${number}`} onClick={() => {
            let key = sequence.current++;
            while (q.alternatives.some(a => a.id === `opcion-${key}`)) key = sequence.current++;
            const alternatives = [...q.alternatives, { key, id: `opcion-${key}`, text: "", isCorrect: false }];
            update(rows.map(p => p.key === q.key ? { ...p, alternatives } : p),
              `[name="${field}.alternatives.${q.alternatives.length}.text"]`, `Alternativa agregada a la pregunta ${number}.`);
          }}><Plus size={16} aria-hidden="true"/>Agregar alternativa</button>
          <div className="quiz-move-actions">
            {([-1, 1] as const).map(delta => {
              const label = delta < 0 ? "Subir" : "Bajar";
              const target = i + delta;
              return <button key={delta} type="button" className="btn btn-ghost" aria-label={`${label} pregunta ${number}`}
                data-move={`${q.key}:${delta}`} disabled={target < 0 || target >= rows.length} onClick={() => {
                  const next = [...rows];
                  [next[i], next[target]] = [next[target], next[i]];
                  const focusDirection = target === 0 ? 1 : target === rows.length - 1 ? -1 : delta;
                  update(next, `[data-move="${q.key}:${focusDirection}"]`, `Pregunta movida a la posición ${target + 1}.`);
                }}>{delta < 0 ? <ArrowUp size={16} aria-hidden="true"/> : <ArrowDown size={16} aria-hidden="true"/>}{label}</button>;
            })}
            <button type="button" className="btn btn-ghost quiz-remove-question" aria-label={`Eliminar pregunta ${number}`} onClick={() => {
              const next = rows.filter(p => p.key !== q.key);
              update(next, next.length ? `[name="questions.${Math.min(i, next.length - 1)}.prompt"]` : "[data-add-question]",
                `Pregunta ${number} eliminada.`);
            }}><Trash2 size={16} aria-hidden="true"/>Eliminar</button>
          </div>
        </div>
      </fieldset>;
    })}
    <div className="actions"><button type="button" data-add-question data-error-field="questions" className="btn btn-ghost"
      aria-describedby={!rows.length && error("questions") ? `${errorId}-questions` : undefined} onClick={() => {
      const key = sequence.current++;
      const alternatives = ["a", "b"].map(id => ({ key: sequence.current++, id, text: "", isCorrect: false }));
      update([...rows, { key, prompt: "", position: rows.length + 1, points: 1, alternatives }],
        `[name="questions.${rows.length}.prompt"]`, `Pregunta ${rows.length + 1} agregada.`);
    }}><Plus size={16} aria-hidden="true"/>Agregar pregunta</button></div>
    <p role="status" className="sr-only">{notice}</p>
  </div>;
}

export function questionRows(initial: Question[]): QuestionRow[] {
  return initial.map((q, i) => ({ ...q, key: i, alternatives: q.alternatives.map((a, j) => ({ ...a, key: j })) }));
}
