"use client";
import { useId, useState } from "react";
import { QuizWorkspace } from "./quiz-workspace.tsx";
import { QuizStatus, quizDate } from "./quiz-facts.tsx";
import { ClipboardList, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {KnownAttemptLink} from "../attempts/attempt-start.tsx";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { listCourseQuizzes } from "../../lib/api/quizzes.ts";
import { ApiResponseError } from "../../lib/api/errors.ts";
import { EmptyState, ErrorState, LoadingState } from "../route-states.tsx";
import { QuizCreate } from "./quiz-create.tsx";
export function QuizList({courseId}:{courseId:string}) {
  const {state}=useSession(), context=state.context, slug=context?.slug ?? "";
  const scope=`${state.generation}:${slug}:${courseId}:${JSON.stringify(context?.user)}`;
  return <QuizDirectory key={scope} courseId={courseId} scope={scope} slug={slug} />;
}
function QuizDirectory({courseId,scope,slug}:{courseId:string;scope:string;slug:string}) {
  const {session,state}=useSession(), context=state.context;
  const [query,setQuery]=useState(""),[status,setStatus]=useState(""),[section,setSection]=useState("");
  const filterId=useId();
  const result=useResource(session,scope,async c=>{
    const course=await getCourse(c,slug,courseId), sections=await listSections(c,slug,courseId), items=await listCourseQuizzes(c,slug,courseId);
    if(items.some(q=>q.sectionId !== null && !sections.some(s=>s.id===q.sectionId))) throw new ApiResponseError();
    return {course,sections,items};
  },true);
  if(!context?.user) return <LoadingState/>;
  if(!result.data) return result.error ? <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/> : <LoadingState/>;
  const {course,sections,items}=result.data;
  const visible=items.filter(q=>q.title.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")) && (!status || q.status===status) && (!section || (section==="course" ? q.sectionId===null : q.sectionId===section)));
  const student=context.user.sectionMemberships.some(m=>m.courseId===courseId && m.role==="student");
  function clearFilters(){setQuery("");setStatus("");setSection("");}
  return <QuizWorkspace course={course} user={context.user} title="Quizzes">
    <p className="hint">Consulta las evaluaciones del curso, sus fechas y los intentos permitidos.</p>
    <QuizCreate key={scope} session={session} slug={slug} user={context.user} course={course} sections={sections} onSaved={result.reload}/>
    {result.error && <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/>}
    {items.length>0 && <section className="card panel stack quiz-filters" aria-label="Filtrar quizzes">
      <div className="quiz-filter-grid">
        <label className="field-label" htmlFor={`${filterId}-query`}>Buscar quiz<input id={`${filterId}-query`} className="field" type="search" value={query} onInput={e=>setQuery(e.currentTarget.value)} placeholder="Título del quiz" /></label>
        <label className="field-label" htmlFor={`${filterId}-status`}>Estado<select id={`${filterId}-status`} className="field" value={status} onChange={e=>setStatus(e.currentTarget.value)}><option value="">Todos los estados</option><option value="draft">Borrador</option><option value="published">Publicado</option></select></label>
        <label className="field-label" htmlFor={`${filterId}-section`}>Destinatarios<select id={`${filterId}-section`} className="field" value={section} onChange={e=>setSection(e.currentTarget.value)}><option value="">Todos los destinatarios</option><option value="course">Todo el curso</option>{sections.map(s=><option key={s.id} value={s.id}>Sección {s.code}</option>)}</select></label>
      </div>
      <div className="quiz-section-heading"><p className="hint tnum" role="status">{visible.length} de {items.length} quizzes</p>{(query || status || section) && <button type="button" className="btn btn-ghost" onClick={clearFilters}>Limpiar filtros</button>}</div>
    </section>}
    <ul className="stack quiz-resource-list" aria-label="Quizzes del curso">{visible.map(q=><li key={q.id}>
      <Link className="card card-hover quiz-resource-row" href={`/courses/${courseId}/quizzes/${q.id}`}>
        <span className="course-icon"><ClipboardList size={20} aria-hidden="true" /></span>
        <div className="quiz-resource-info"><h2>{q.title}</h2><div className="quiz-chips"><QuizStatus status={q.status}/><span className="hint">{q.sectionId ? `Sección ${sections.find(s=>s.id===q.sectionId)?.code}` : "Todo el curso"}</span></div>
          <p className="hint tnum">{q.closesAt ? `Cierre: ${quizDate(q.closesAt)}` : "Sin fecha de cierre"} · {q.maxAttempts===null ? "Intentos ilimitados" : `${q.maxAttempts} ${q.maxAttempts===1 ? "intento" : "intentos"}`}</p>
        </div><ArrowUpRight size={18} aria-hidden="true" />
      </Link>
    </li>)}</ul>
    {!items.length && !result.error && <><EmptyState/><p className="hint">Aún no hay quizzes disponibles para tu participación en este curso.</p></>}
    {items.length>0 && !visible.length && <section className="empty-zone panel stack"><h2 className="serif">No hay quizzes que coincidan</h2><p className="hint">Prueba otro título, estado o destinatario.</p><button type="button" className="btn btn-ghost" onClick={clearFilters}>Mostrar todos los quizzes</button></section>}
    {student && <KnownAttemptLink key={scope+":known"}/>}
  </QuizWorkspace>;
}
