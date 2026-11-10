"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardList, Plus, Send } from "lucide-react";
import { QuizWorkspace } from "./quiz-workspace.tsx";
import { QuizPhaseChip, quizDate } from "./quiz-facts.tsx";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { getQuizAuthoringView, listCourseQuizzes } from "../../lib/api/quizzes.ts";
import { ApiResponseError } from "../../lib/api/errors.ts";
import { getRouteFeedback } from "../../lib/route-feedback.ts";
import { canAuthor, destinations } from "../../lib/quizzes/capabilities.ts";
import { quizListQuery, type QuizFilters } from "../../lib/quizzes/list-location.ts";
import { phaseGroups, phaseLabels, phaseOrder, publicationIssues, quizPhase, sortQuizzes, type QuizPhase } from "../../lib/quizzes/publication.ts";
import type { Authoring, Summary } from "../../lib/quizzes/validation.ts";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { ContentNotices, useContentNotice } from "../content/content-notices.tsx";
import { quizCreationReceipt, quizPublicationReceipt } from "./quiz-created-receipt.ts";
import { QuizPublishDialog, usePublication } from "./quiz-publish.tsx";

const emptyFilters = { query: "", status: "", section: "" };
const searchKey = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
type DirectoryProps = { courseId: string; filters?: QuizFilters; createdId?: string };

export function QuizList({ courseId, filters = emptyFilters, createdId }: DirectoryProps) {
  const { state } = useSession(), context = state.context, slug = context?.slug ?? "";
  const scope = `${state.generation}:${slug}:${courseId}:${JSON.stringify(context?.user)}`;
  return <ContentNotices key={scope}>
    <QuizDirectory courseId={courseId} scope={scope} slug={slug} filters={filters} createdId={createdId}/>
  </ContentNotices>;
}

function QuizDirectory({ courseId, scope, slug, filters, createdId }: DirectoryProps & { scope: string; slug: string; filters: QuizFilters }) {
  const { session, state } = useSession(), context = state.context;
  const [activeFilters, setFilters] = useState(filters);
  const [now] = useState(Date.now);
  const [confirmed, setConfirmed] = useState<Record<string, Summary>>({});
  const [check, setCheck] = useState<{ quiz: Summary; authoring?: Authoring; issues?: string[] }>();
  const { query, status, section } = activeFilters;
  const filterId = useId();
  const notify = useContentNotice();
  const publication = usePublication(session, slug, courseId);
  const rows = useRef(new Map<string, HTMLAnchorElement>());
  const reviewed = useRef<string>(undefined);
  const result = useResource(session, scope, async c => {
    const [course, sections, items] = await Promise.all([getCourse(c, slug, courseId), listSections(c, slug, courseId), listCourseQuizzes(c, slug, courseId)]);
    if (items.some(q => q.sectionId !== null && !sections.some(s => s.id === q.sectionId))) throw new ApiResponseError();
    return { course, sections, items };
  }, true);
  const user = context?.user;
  const directory = result.data;
  const items = directory?.items.map(q => confirmed[q.id] ?? q) ?? [];
  const created = user && items.find(q => q.id === createdId && q.status === "draft"
    && canAuthor(user, directory!.course, directory!.sections, q.sectionId));
  const publishedReceipt = quizPublicationReceipt(session, courseId);

  const loaded = !!directory;
  useEffect(() => {
    if (!notify || !loaded) return;
    const published = quizPublicationReceipt(session, courseId);
    if (published && !published.announced) {
      published.announced = true;
      notify("Quiz publicado.");
      return;
    }
    if (!created) return;
    const receipt = quizCreationReceipt(session, courseId, created.id);
    if (!receipt || receipt.announced) return;
    receipt.announced = true;
    notify("Borrador creado.");
  }, [created, courseId, notify, session, loaded]);

  const base = `/courses/${courseId}/quizzes`;
  const suffix = quizListQuery(activeFilters);
  if (!user) return <LoadingState/>;
  if (!directory) {
    if (!result.error) return <LoadingState/>;
    const receipt = !result.accessDenied && quizCreationReceipt(session, courseId, createdId);
    return <div className="stack">
      {publishedReceipt && !result.accessDenied && <p className="notice success" role="status">«{publishedReceipt.title}» se publicó correctamente.</p>}
      <ErrorState feedback={result.error} onRetry={() => void result.reload()}/>
      {receipt && <Link className="text-link" prefetch={false} href={`${base}/${receipt.id}/authoring${suffix}`}>Editar borrador</Link>}
    </div>;
  }

  const { course, sections } = directory;
  const student = user.sectionMemberships.some(m => m.courseId === courseId && m.role === "student");
  const mayCreate = canAuthor(user, course, sections, null) || destinations(user, course, sections).length > 0;
  const mayPublish = (quiz: Summary) => quiz.status === "draft" && canAuthor(user, course, sections, quiz.sectionId);
  const destination = (id: string | null) => id ? `Sección ${sections.find(s => s.id === id)?.code}` : "Todo el curso";
  const phases = phaseOrder.filter(phase => phase !== "draft" || items.some(q => q.status === "draft") || mayCreate);
  const visible = sortQuizzes(items.filter(q => searchKey(q.title).includes(searchKey(query.trim()))
    && (!status || quizPhase(q, now) === status)
    && (!section || (section === "course" ? q.sectionId === null : q.sectionId === section))), now);
  const filtered = !!(query || status || section);
  const createdHidden = created && !visible.some(q => q.id === created.id);

  function changeFilters(next: QuizFilters) {
    setFilters(next);
    const url = new URL(window.location.href);
    for (const key of ["q", "estado", "seccion"]) url.searchParams.delete(key);
    for (const [key, value] of new URLSearchParams(quizListQuery(next))) url.searchParams.set(key, value);
    window.history.replaceState(window.history.state, "", url);
  }

  async function review(quiz: Summary) {
    if (check || publication.busy) return;
    reviewed.current = quiz.id;
    setCheck({ quiz });
    try {
      const authoring = await session.request(c => getQuizAuthoringView(c, slug, courseId, quiz.id));
      if (authoring.status === "published") {
        setConfirmed(previous => ({ ...previous, [quiz.id]: authoring }));
        setCheck(undefined);
        notify?.("Este quiz ya estaba publicado.");
        return;
      }
      setCheck({ quiz, authoring, issues: publicationIssues(authoring) });
    } catch (error) {
      setCheck(undefined);
      notify?.(getRouteFeedback(error).message, "error");
    }
  }

  function close() {
    setCheck(undefined);
    publication.clear();
  }

  function publish() {
    if (!check?.authoring) return;
    void publication.run(check.authoring.id, published => {
      setConfirmed(previous => ({ ...previous, [published.id]: published }));
      setCheck(undefined);
      notify?.("Quiz publicado.");
      // The confirmed state is already shown; a failed refresh only offers to read again.
      void result.reload();
    });
  }

  const groups = phases.map(phase => ({ phase, items: visible.filter(q => quizPhase(q, now) === phase) })).filter(g => g.items.length);
  return <QuizWorkspace course={course} user={user} title="Quizzes">
    {result.error && <div className="notice warning quiz-refresh" role="alert">
      <span>No se pudo actualizar el listado. Se muestran los últimos datos confirmados.</span>
      <button type="button" className="btn btn-ghost" onClick={() => void result.reload()}>Reintentar</button>
    </div>}
    {(items.length > 0 || mayCreate) && <div className="quiz-toolbar">
      {items.length > 0 && <>
        <label className="field-label" htmlFor={`${filterId}-query`}>Buscar quiz
          <input id={`${filterId}-query`} className="field" type="search" value={query} placeholder="Título del quiz"
            onInput={e => changeFilters({ ...activeFilters, query: e.currentTarget.value })}/></label>
        <label className="field-label" htmlFor={`${filterId}-status`}>Estado
          <select id={`${filterId}-status`} className="field" value={status} onChange={e => changeFilters({ ...activeFilters, status: e.currentTarget.value })}>
            <option value="">Todos</option>{phases.map(phase => <option key={phase} value={phase}>{phaseLabels[phase]}</option>)}
          </select></label>
        {!student && sections.length > 0 && <label className="field-label" htmlFor={`${filterId}-section`}>Destinatarios
          <select id={`${filterId}-section`} className="field" value={section} onChange={e => changeFilters({ ...activeFilters, section: e.currentTarget.value })}>
            <option value="">Todos</option><option value="course">Todo el curso</option>
            {sections.map(s => <option key={s.id} value={s.id}>Sección {s.code}</option>)}
          </select></label>}
      </>}
      {mayCreate && <Link className="btn btn-primary quiz-create-link" href={`${base}/new${suffix}`}><Plus size={16} aria-hidden="true"/>Crear quiz</Link>}
    </div>}
    {filtered && items.length > 0 && <div className="quiz-filter-summary">
      <p className="hint tnum" role="status">{visible.length} de {items.length} quizzes</p>
      <button type="button" className="btn btn-ghost" onClick={() => changeFilters(emptyFilters)}>Limpiar filtros</button>
    </div>}
    {createdHidden && <p className="hint">«{created.title}» no coincide con los filtros. <Link className="text-link" prefetch={false} href={`${base}/${created.id}/authoring${suffix}`}>Editar borrador</Link></p>}
    {groups.length > 0 && <div className="stack quiz-directory" role="region" aria-label="Quizzes del curso">
    {groups.map(({ phase, items: group }) => <section key={phase} className="card quiz-group" aria-labelledby={`${filterId}-${phase}`}>
      <header><h2 id={`${filterId}-${phase}`} className="serif">{phaseGroups[phase]}</h2><span className="hint tnum">{group.length}</span></header>
      <ul className="quiz-rows" aria-labelledby={`${filterId}-${phase}`}>{group.map(q => <li key={q.id} className="quiz-row">
        <Link className="quiz-row-link" href={`${base}/${q.id}${suffix}`} ref={node => { if (node) rows.current.set(q.id, node); else rows.current.delete(q.id); }}>
          <span className="course-icon"><ClipboardList size={18} aria-hidden="true"/></span>
          <span className="quiz-row-copy">
            <span className="quiz-row-title">{q.title}</span>
            <span className="hint tnum">{destination(q.sectionId)} · {schedule(q, quizPhase(q, now))} · {q.maxAttempts === null ? "Intentos ilimitados" : `${q.maxAttempts} ${q.maxAttempts === 1 ? "intento" : "intentos"}`}</span>
          </span>
          <QuizPhaseChip phase={quizPhase(q, now)}/>
          <ChevronRight className="quiz-row-chevron" size={16} aria-hidden="true"/>
        </Link>
        {mayPublish(q) && <button type="button" className="btn btn-ghost quiz-row-action" aria-label={`Publicar ${q.title}`}
          disabled={!!check || publication.busy} onClick={() => void review(q)}>
          <Send size={15} aria-hidden="true"/>{check?.quiz.id === q.id && !check.authoring ? "Revisando…" : "Publicar"}
        </button>}
      </li>)}</ul>
    </section>)}
    </div>}
    {!items.length && !result.error && !result.refreshing && <div className="empty-zone panel">
      <h2>Aún no hay quizzes</h2>
      <p className="hint">{mayCreate ? "Crea el primer quiz del curso." : "Los quizzes publicados para tu sección aparecerán aquí."}</p>
    </div>}
    {items.length > 0 && !visible.length && <section className="empty-zone panel stack">
      <h2 className="serif">No hay quizzes que coincidan</h2>
      <button type="button" className="btn btn-ghost" onClick={() => changeFilters(emptyFilters)}>Mostrar todos los quizzes</button>
    </section>}
    <QuizPublishDialog open={!!check?.authoring} busy={publication.busy} error={publication.error} issues={check?.issues}
      completeHref={check && `${base}/${check.quiz.id}/authoring${suffix}`}
      preview={check?.authoring && { title: check.authoring.title, destination: destination(check.authoring.sectionId),
        opensAt: check.authoring.opensAt, closesAt: check.authoring.closesAt, maxAttempts: check.authoring.maxAttempts }}
      fallbackFocus={() => reviewed.current ? rows.current.get(reviewed.current) : undefined} onConfirm={publish} onClose={close}/>
  </QuizWorkspace>;
}

function schedule(quiz: Summary, phase: QuizPhase) {
  if (phase === "scheduled") return `Abre el ${quizDate(quiz.opensAt)}`;
  if (phase === "closed") return `Cerró el ${quizDate(quiz.closesAt)}`;
  return quiz.closesAt ? `Cierra el ${quizDate(quiz.closesAt)}` : "Sin fecha de cierre";
}
