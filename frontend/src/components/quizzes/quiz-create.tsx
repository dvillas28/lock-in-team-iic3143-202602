"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { checkNativeInputs, focusQuizError } from "../../lib/quizzes/form-values.ts";
import type { Session } from "../../lib/auth/session.ts";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import { FieldError, type Course, type Section } from "../../lib/courses/validation.ts";
import { canAuthor, destinations } from "../../lib/quizzes/capabilities.ts";
import type { Summary } from "../../lib/quizzes/validation.ts";
import { createQuiz, listCourseQuizzes } from "../../lib/api/quizzes.ts";
import { useMutation } from "../courses/use-mutation.ts";
import { QuizConfiguration, configuration } from "./quiz-configuration.tsx";
import { QuestionEditor, questionRows, readQuestions } from "./question-editor.tsx";
export function QuizCreate({session,slug,user,course,sections,onSaved}:{session:Session;slug:string;user:CurrentUser;course:Course;sections:Section[];onSaved:()=>Promise<unknown>}) {
  const mutation=useMutation(session),formRef=useRef<HTMLFormElement>(null),feedback=useRef<HTMLParagraphElement>(null);
  useEffect(()=>{
    if(!mutation.message || mutation.confirmed)return;
    if(!focusQuizError(formRef.current,mutation.field))feedback.current?.focus();
  },[mutation.message,mutation.field,mutation.confirmed]);
  const [created,setCreated]=useState<Summary>();
  const [candidates,setCandidates]=useState<Summary[]>();
  const [rows,setRows]=useState(()=>questionRows([]));
  const allowed=destinations(user,course,sections), wholeCourse=canAuthor(user,course,sections,null);
  if (!allowed.length && !wholeCourse) return null;
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();const form=event.currentTarget, data=new FormData(form);
    if (created) return;
    await mutation.run(async current=>{
      checkNativeInputs(form);
      const values=configuration(data);
      if (!canAuthor(user,course,sections,values.sectionId ?? null)) throw new FieldError("sectionId","Destino fuera de tu alcance docente.");
      const questions=readQuestions(data,rows);
      const saved=await session.request(c=>createQuiz(c,slug,course.id,{...values,title:values.title!,questions}),current);
      if (!current()) return;
      form.reset();
      setRows(questionRows([]));
      // Creation returns authoring; retain only safe metadata for navigation.
      setCreated({id:saved.id,courseId:saved.courseId,sectionId:saved.sectionId,title:saved.title,instructions:saved.instructions,opensAt:saved.opensAt,closesAt:saved.closesAt,maxAttempts:saved.maxAttempts,status:saved.status,publishedAt:saved.publishedAt});
      try { await onSaved(); } catch { return "Quiz creado. No se pudo actualizar la lista; abre el detalle para continuar."; }
      return "Quiz creado.";
    },async current=>{
      const items=await session.request(c=>listCourseQuizzes(c,slug,course.id),current);
      if(current()) setCandidates(items);
      return "Lista consultada: las coincidencias no prueban la creación ni su ausencia. Revisa candidatos antes de iniciar otra creación consciente desde la lista.";
    });

  }
  return <details className="academic-disclosure card quiz-create"><summary><Plus size={16} aria-hidden="true"/>Crear quiz</summary><section className="panel stack"><form ref={formRef} aria-label="Crear quiz" className="stack" onSubmit={submit} noValidate aria-busy={mutation.busy}>
    <div><h2 className="serif">Crear borrador</h2><p className="hint">Configura el quiz, agrega preguntas y marca sus respuestas correctas antes de guardar.</p></div><fieldset className="stack" disabled={mutation.busy || mutation.uncertain || !!created}>
      <QuizConfiguration sections={allowed} wholeCourse={wholeCourse} field={mutation.field} message={mutation.message}/>
      {!created && <QuestionEditor rows={rows} onRows={setRows} field={mutation.field} message={mutation.message}/>}
      <button type="submit" className="btn btn-primary">{mutation.busy ? "Creando…" : "Crear borrador"}</button>
    </fieldset>{mutation.message && <p ref={feedback} tabIndex={-1} role="status" aria-live="polite">{mutation.message}</p>}
    {created && <Link className="btn btn-primary" href={`/courses/${course.id}/quizzes/${created.id}`}>Quiz creado: abrir detalle</Link>}
  </form>{candidates && <div className="stack"><h3 className="serif">Quizzes para revisar</h3>{candidates.length ? candidates.map(q=><Link key={q.id} href={`/courses/${course.id}/quizzes/${q.id}`}>{q.title} · {q.id}</Link>):<p>No hay candidatos visibles. Esto no prueba que el envío haya fallado.</p>}</div>}</section></details>;
}
