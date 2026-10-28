"use client";
import { QuizWorkspace } from "./quiz-workspace.tsx";
import { QuizStatus } from "./quiz-facts.tsx";
import { Save } from "lucide-react";
import { checkNativeInputs, focusQuizError } from "../../lib/quizzes/form-values.ts";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { useMutation } from "../courses/use-mutation.ts";
import { getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { getQuiz, getQuizAuthoringView, updateQuiz } from "../../lib/api/quizzes.ts";
import { canAuthor, destinations } from "../../lib/quizzes/capabilities.ts";
import { quizInput, type Authoring, type Update } from "../../lib/quizzes/validation.ts";
import { ApiHttpError } from "../../lib/api/errors.ts";
import { FieldError } from "../../lib/courses/validation.ts";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { QuizConfiguration, configuration } from "./quiz-configuration.tsx";
import { QuestionEditor, questionRows, readQuestions } from "./question-editor.tsx";
import { QuizPublish } from "./quiz-publish.tsx";
export function QuizEditor({courseId,quizId}:{courseId:string;quizId:string}) {
  const {session,state}=useSession(), context=state.context, slug=context?.slug ?? "";
  const scope=`${state.generation}:${slug}:${courseId}:${quizId}:authoring:${JSON.stringify(context?.user)}`;
  const result=useResource(session,scope,async c=>{
    const course=await getCourse(c,slug,courseId),sections=await listSections(c,slug,courseId),safe=await getQuiz(c,slug,courseId,quizId);
    if(!context?.user || !canAuthor(context.user,course,sections,safe.sectionId)) throw new ApiHttpError(403);
    const quiz=await getQuizAuthoringView(c,slug,courseId,quizId);
    if(!canAuthor(context.user,course,sections,quiz.sectionId)) throw new ApiHttpError(403);
    return {course,sections,quiz};
  });
  if(!context?.user) return <LoadingState/>;
  if(result.error) return <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/>;
  if(!result.data) return <LoadingState/>;
  return <AuthoringForm key={scope} {...result.data}/>;
}
function AuthoringForm({course,sections,quiz}:{course:Awaited<ReturnType<typeof getCourse>>;sections:Awaited<ReturnType<typeof listSections>>;quiz:Authoring}) {
  const {session,state}=useSession(), {slug,user}=state.context!;
  const [saved,setSaved]=useState(quiz),[observed,setObserved]=useState<Authoring>(),[revision,setRevision]=useState(0),[dirty,setDirty]=useState(false),[publishing,setPublishing]=useState(false);
  const [rows,setRows]=useState(()=>questionRows(quiz.questions));
  const mutation=useMutation(session),formRef=useRef<HTMLFormElement>(null),feedback=useRef<HTMLParagraphElement>(null);
  const permitted=(q:Authoring)=>!!user && canAuthor(user,course,sections,q.sectionId);
  const immutable=saved.status === "published" || observed?.status === "published";
  const blocked=immutable || mutation.busy || mutation.uncertain || publishing || !!observed;
  useEffect(()=>{
    if(!mutation.message || mutation.confirmed)return;
    if(!focusQuizError(formRef.current,mutation.field))feedback.current?.focus();
  },[mutation.message,mutation.field,mutation.confirmed]);
  function accept(next:Authoring) {
    if(!permitted(next)) {void session.loadContext(slug);throw new ApiHttpError(403);}
    setPublishing(false);setSaved(next);setObserved(undefined);setRows(questionRows(next.questions));setRevision(n=>n+1);setDirty(false);
  }
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(blocked)return;
    const form=event.currentTarget, data=new FormData(form);
    await mutation.run(async current=>{
      checkNativeInputs(form);
      const values={...configuration(data,saved),questions:readQuestions(data,rows)};
      if(!permitted(saved) || !canAuthor(user!,course,sections,values.sectionId ?? null)) throw new FieldError("sectionId","Origen o destino fuera de tu alcance docente.");
      const changed=Object.fromEntries(Object.entries(values).filter(([k,v])=>JSON.stringify(v)!==JSON.stringify(saved[k as keyof Authoring]))) as Update;
      const body=quizInput(changed,saved);
      const next=await session.request(c=>updateQuiz(c,slug,saved,body),current);
      if(current())accept(next);
      return "Quiz actualizado.";
    },async current=>{
      const next=await session.request(c=>getQuizAuthoringView(c,slug,course.id,saved.id),current);
      if(!permitted(next)) {await session.loadContext(slug);return "Acceso revocado.";}
      if(current())setObserved(next);
      return "Estado consultado. Revisa la versión recibida; tu texto local no fue reemplazado.";
    });
  }
  return <QuizWorkspace course={course} user={user!} title={saved.title} authoring>
    <Link className="text-link" href={`/courses/${course.id}/quizzes/${saved.id}`}>Volver al detalle del quiz</Link>
    <p className="notice">El acceso a la pauta impide rendir este quiz, aunque también participes como estudiante.</p>
    <form key={revision} ref={formRef} className="stack" aria-label="Editar quiz" onSubmit={submit} onInput={()=>setDirty(true)} onChange={()=>setDirty(true)} noValidate aria-busy={mutation.busy}>
      <div className="card quiz-save-bar"><div className="quiz-chips"><QuizStatus status={immutable ? "published" : "draft"}/><span className="hint" role="status">{immutable ? "Publicado: inmutable." : dirty ? "Cambios sin guardar" : "Guardado manual"}</span></div>
        {!immutable && <button type="submit" className="btn btn-primary" disabled={blocked}><Save size={16} aria-hidden="true"/>{mutation.busy ? "Guardando…" : "Guardar borrador"}</button>}
      </div>
      {mutation.message && <p className="notice" role={mutation.confirmed ? "status" : "alert"} ref={feedback} tabIndex={-1}>{mutation.message}</p>}
      <fieldset className="stack" disabled={blocked}>
        <section className="card panel stack"><div><h2>Configuración del quiz</h2><p className="hint">Define quién puede rendirlo y en qué horario.</p></div><QuizConfiguration item={saved} sections={destinations(user!,course,sections)} wholeCourse={canAuthor(user!,course,sections,null)} field={mutation.field} message={mutation.message}/></section>
        <QuestionEditor rows={rows} onRows={next=>{setRows(next);setDirty(true);}} field={mutation.field} message={mutation.message}/>
      </fieldset>
    </form>
    {observed && <section className="notice stack"><h2 className="serif">Estado recibido: {observed.status === "published" ? "Publicado" : "Borrador"}</h2><p>Hay una versión recibida tras conflicto o resultado incierto. Tu formulario permanece separado. No hay fusión automática.</p><button type="button" className="btn btn-ghost" onClick={()=>accept(observed)}>Descartar cambios locales y cargar versión recibida</button></section>}
    <QuizPublish key={saved.id + saved.status} session={session} slug={slug} quiz={saved} destination={saved.sectionId ? `Sección ${sections.find(s=>s.id===saved.sectionId)?.code}` : "Todo el curso"} disabled={dirty || !!mutation.uncertain || mutation.busy || !!observed} onSaved={accept} onLock={setPublishing}/>
  </QuizWorkspace>;
}
