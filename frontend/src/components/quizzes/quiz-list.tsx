"use client";
import { useEffect, useId, useState } from "react";
import { QuizWorkspace } from "./quiz-workspace.tsx";
import { QuizStatus, quizDate } from "./quiz-facts.tsx";
import { ClipboardList, ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { canAuthor, destinations } from "../../lib/quizzes/capabilities.ts";
import { quizListQuery, type QuizFilters } from "../../lib/quizzes/list-location.ts";
import { listCourseQuizzes } from "../../lib/api/quizzes.ts";
import { ApiResponseError } from "../../lib/api/errors.ts";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { ContentNotices, useContentNotice } from "../content/content-notices.tsx";
import { quizCreationReceipt } from "./quiz-created-receipt.ts";
const emptyFilters = { query: "", status: "", section: "" };
type DirectoryProps = { courseId: string; filters?: QuizFilters; createdId?: string };
export function QuizList({courseId, filters = emptyFilters, createdId}: DirectoryProps) {
  const {state}=useSession(), context=state.context, slug=context?.slug ?? "";
  const scope=`${state.generation}:${slug}:${courseId}:${JSON.stringify(context?.user)}`;
  return <ContentNotices key={scope}>
    <QuizDirectory courseId={courseId} scope={scope} slug={slug} filters={filters} createdId={createdId}/>
  </ContentNotices>;
}
function QuizDirectory({courseId,scope,slug,filters,createdId}: DirectoryProps & {scope:string;slug:string;filters:QuizFilters}) {
  const {session,state}=useSession(), context=state.context;
  const [activeFilters,setFilters]=useState(filters);
  const {query,status,section}=activeFilters;
  const filterId=useId();
  const notify = useContentNotice();
  const result=useResource(session,scope,async c=>{
    const course=await getCourse(c,slug,courseId), sections=await listSections(c,slug,courseId), items=await listCourseQuizzes(c,slug,courseId);
    if(items.some(q=>q.sectionId !== null && !sections.some(s=>s.id===q.sectionId))) throw new ApiResponseError();
    return {course,sections,items};
  },true);
  const user = context?.user;
  const directory = result.data;
  const created = user && directory?.items.find(q => q.id === createdId && q.status === "draft"
    && canAuthor(user, directory.course, directory.sections, q.sectionId));
  useEffect(() => {
    if (!created || !notify) return;
    const receipt = quizCreationReceipt(session, courseId, created.id);
    if (!receipt || receipt.announced) return;
    receipt.announced = true;
    notify("Borrador creado.");
  }, [created, courseId, notify, session]);

  const base = `/courses/${courseId}/quizzes`;
  const suffix = quizListQuery(activeFilters);
  const editCreated = (id: string) => `${base}/${id}/authoring${suffix}`;
  if (!user) return <LoadingState/>;
  if (!result.data) {
    if (!result.error) return <LoadingState/>;
    const receipt = !result.accessDenied && quizCreationReceipt(session, courseId, createdId);
    return <div className="stack">
      <ErrorState feedback={result.error} onRetry={() => void result.reload()}/>
      {receipt && <Link className="text-link" prefetch={false} href={editCreated(receipt.id)}>Editar borrador</Link>}
    </div>;
  }
  const {course,sections,items}=result.data;
  const visible=items.filter(q=>q.title.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")) && (!status || q.status===status) && (!section || (section==="course" ? q.sectionId===null : q.sectionId===section)));
  const student=user.sectionMemberships.some(m=>m.courseId===courseId && m.role==="student");
  const mayCreate = canAuthor(user,course,sections,null) || destinations(user,course,sections).length > 0;
  const createdHidden = created && !visible.some(q => q.id === created.id);
  function changeFilters(next: QuizFilters) {
    setFilters(next);
    const url = new URL(window.location.href);
    for (const key of ["q", "estado", "seccion"]) url.searchParams.delete(key);
    for (const [key,value] of new URLSearchParams(quizListQuery(next))) url.searchParams.set(key,value);
    window.history.replaceState(window.history.state, "", url);
  }
  function clearFilters(){changeFilters(emptyFilters);}
  return <QuizWorkspace course={course} user={user} title="Quizzes">
    {mayCreate && <div className="actions">
      <Link className="btn btn-primary" href={`${base}/new${suffix}`}><Plus size={16} aria-hidden="true"/>Crear quiz</Link>
    </div>}
    {result.error && <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/>}
    {items.length>0 && <section className="card panel stack quiz-filters" aria-label="Filtrar quizzes">
      <div className="quiz-filter-grid">
        <label className="field-label" htmlFor={`${filterId}-query`}>Buscar quiz<input id={`${filterId}-query`} className="field" type="search" value={query} onInput={e=>changeFilters({...activeFilters,query:e.currentTarget.value})} placeholder="Título del quiz" /></label>
        <label className="field-label" htmlFor={`${filterId}-status`}>Estado<select id={`${filterId}-status`} className="field" value={status} onChange={e=>changeFilters({...activeFilters,status:e.currentTarget.value})}><option value="">Todos los estados</option><option value="draft">Borrador</option><option value="published">Publicado</option></select></label>
        <label className="field-label" htmlFor={`${filterId}-section`}>Destinatarios<select id={`${filterId}-section`} className="field" value={section} onChange={e=>changeFilters({...activeFilters,section:e.currentTarget.value})}><option value="">Todos los destinatarios</option><option value="course">Todo el curso</option>{sections.map(s=><option key={s.id} value={s.id}>Sección {s.code}</option>)}</select></label>
      </div>
      <div className="quiz-section-heading"><p className="hint tnum" role="status">{visible.length} de {items.length} quizzes</p>{(query || status || section) && <button type="button" className="btn btn-ghost" onClick={clearFilters}>Limpiar filtros</button>}</div>
    </section>}
    {createdHidden && <div className="quiz-recent-draft">
      <span className="hint">{created.title} queda fuera de los filtros.</span>
      <Link className="text-link" prefetch={false} href={editCreated(created.id)}>Editar borrador</Link>
    </div>}
    <ul className="stack quiz-resource-list" aria-label="Quizzes del curso">{visible.map(q=><li key={q.id} className={created?.id === q.id ? "card quiz-resource-with-action" : undefined}>
      <Link className={created?.id === q.id ? "quiz-resource-row" : "card card-hover quiz-resource-row"} href={`${base}/${q.id}${suffix}`}>
        <span className="course-icon"><ClipboardList size={20} aria-hidden="true" /></span>
        <div className="quiz-resource-info"><h2>{q.title}</h2><div className="quiz-chips"><QuizStatus status={q.status}/>{created?.id === q.id && <span className="hint">Recién creado</span>}<span className="hint">{q.sectionId ? `Sección ${sections.find(s=>s.id===q.sectionId)?.code}` : "Todo el curso"}</span></div>
          <p className="hint tnum">{q.closesAt ? `Cierre: ${quizDate(q.closesAt)}` : "Sin fecha de cierre"} · {q.maxAttempts===null ? "Intentos ilimitados" : `${q.maxAttempts} ${q.maxAttempts===1 ? "intento" : "intentos"}`}</p>
        </div>
        {created?.id === q.id
          ? <span className="quiz-resource-arrow" aria-hidden="true"><ArrowUpRight size={18}/></span>
          : <ArrowUpRight size={18} aria-hidden="true"/>}
      </Link>
      {created?.id === q.id && <Link className="text-link quiz-resource-edit" prefetch={false} href={editCreated(q.id)}>Editar borrador</Link>}
    </li>)}</ul>
    {!items.length && !result.error && !result.refreshing && <div className="empty-zone panel"><h2>Aún no hay quizzes disponibles</h2><p className="hint">{user.sectionMemberships.some(m => m.courseId === courseId && m.role === "teacher") ? "Crea un borrador para preparar el primer quiz del curso." : "Los quizzes publicados para tu sección aparecerán aquí"}</p></div>}
    {items.length>0 && !visible.length && <section className="empty-zone panel stack"><h2 className="serif">No hay quizzes que coincidan</h2><p className="hint">Prueba otro título, estado o destinatario.</p><button type="button" className="btn btn-ghost" onClick={clearFilters}>Mostrar todos los quizzes</button></section>}
    {student && items.length > 0 && <p className="hint">Abre un quiz para consultar tus intentos y continuar uno pendiente.</p>}
  </QuizWorkspace>;
}
