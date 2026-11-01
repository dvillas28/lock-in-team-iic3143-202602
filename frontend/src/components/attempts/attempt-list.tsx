"use client";
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { QuizWorkspace } from "../quizzes/quiz-workspace.tsx";
import { AttemptStatus, attemptStatuses } from "./attempt-facts.tsx";
import Link from 'next/link';
import { useSession } from '../auth/session-provider.tsx';
import { useResource } from '../courses/use-resource.ts';
import { getCourse } from '../../lib/api/courses.ts';
import { listSections } from '../../lib/api/sections.ts';
import { getQuiz } from '../../lib/api/quizzes.ts';
import { listQuizAttempts } from '../../lib/api/attempts.ts';
import { gradebookCapabilities } from '../../lib/gradebook/capabilities.ts';
import { ApiHttpError } from '../../lib/api/errors.ts';
import type { Attempt } from '../../lib/attempts/validation.ts';
import { LoadingState, ErrorState } from '../route-states.tsx';
export function AttemptList(props: Readonly<{
    courseId: string;
    quizId: string;
}>) {
    const { state } = useSession();
    return !state.context?.user ? <LoadingState /> : <List key={`${state.generation}:${JSON.stringify(state.context)}:${props.courseId}:${props.quizId}`} {...props}/>;
}
function List({ courseId, quizId }: Readonly<{
    courseId: string;
    quizId: string;
}>) {
    const { session, state } = useSession(), slug = state.context!.slug, user = state.context!.user!;
    const [filters, setFilters] = useState<{
        sectionId: string;
        studentId: string;
        status: string;
    }>({ sectionId: '', studentId: '', status: '' }), [draft, setDraft] = useState(filters), [cursor, setCursor] = useState<string>(), [pages, setPages] = useState<(string | undefined)[]>([]);
    const r = useResource(session, `${state.generation}:${slug}:${user.id}:${courseId}:${quizId}:${JSON.stringify(filters)}:${cursor}`, async (c) => {
        const course = await getCourse(c, slug, courseId), cap = gradebookCapabilities(user, course, filters.sectionId || undefined);
        if (!cap.book) {
            throw new ApiHttpError(403);
        }
        const quiz = await getQuiz(c, slug, courseId, quizId, true), sections = await listSections(c, slug, courseId), page = await listQuizAttempts(c, slug, user, course, quiz, { sectionId: filters.sectionId || undefined, studentId: filters.studentId || undefined, status: (filters.status || undefined) as Attempt['status'] | undefined, cursor });
        return { course, quiz, sections, cap, page };
    });
    if (r.error) {
        return <div className="stack"><ErrorState feedback={r.error} onRetry={() => void r.reload()}/><button type="button" className="btn btn-ghost" onClick={() => {
            setFilters({ sectionId: '', studentId: '', status: '' });
            setDraft({ sectionId: '', studentId: '', status: '' });
            setCursor(undefined);
            setPages([]);
        }}>Reiniciar filtros</button></div>;
    }
    if (!r.data) {
        return <LoadingState />;
    }
    const { quiz, sections, cap, page } = r.data;
    return <QuizWorkspace course={r.data.course} user={user} title={`Intentos · ${quiz.title}`}><div className="stack attempt-workspace"><Link className="text-link attempt-back" href={`/courses/${courseId}/quizzes/${quizId}`}><ArrowLeft size={16} aria-hidden="true"/>Volver al quiz</Link>
 <section className="card panel stack attempt-filters" aria-labelledby="attempt-filters-heading"><div className="quiz-section-heading"><h2 className="serif" id="attempt-filters-heading">Buscar intentos</h2><Search size={20} aria-hidden="true"/></div><p className="hint">Consulta los intentos de tus secciones y abre uno para revisar sus respuestas.</p><form className="attempt-filter-grid" onSubmit={e => {
        e.preventDefault();
        setFilters(draft);
        setCursor(undefined);
        setPages([]);
    }}><label className="field-label">Sección histórica<select className="field" value={draft.sectionId} onChange={e => setDraft({ ...draft, sectionId: e.target.value })}><option value="">Todas las autorizadas</option>{sections.filter(s => cap.global || cap.readSections.includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.code}</option>)}</select></label><label className="field-label">Identificador del estudiante<input className="field" value={draft.studentId} placeholder="ID completo (opcional)" onChange={e => setDraft({ ...draft, studentId: e.target.value })}/></label><label className="field-label">Estado<select className="field" value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}><option value="">Todos los estados</option>{(Object.keys(attemptStatuses) as Attempt['status'][]).map(s => <option key={s} value={s}>{attemptStatuses[s].label}</option>)}</select></label><button type="submit" className="btn btn-primary">Aplicar filtros</button></form></section>
 <section className="stack" aria-labelledby="attempt-results-heading"><div className="quiz-section-heading"><h2 className="serif" id="attempt-results-heading">Intentos registrados</h2><span className="hint tnum">{page.items.length} en esta página</span></div>
 {!page.items.length ? <p className="notice" role="status">No hay intentos que coincidan con los filtros. Prueba con otra sección o estado.</p> : <div className="table-scroll" role="region" aria-label="Tabla con desplazamiento horizontal" tabIndex={0}><table className="data-table attempt-table"><caption>Intentos en secciones autorizadas</caption><thead><tr>{['Intento', 'Estudiante', 'Sección histórica', 'Estado', 'Nota'].map(x => <th scope="col" key={x}>{x}</th>)}</tr></thead><tbody>{page.items.map(a => <tr className="row-hover" key={a.id}><th scope="row"><Link className="text-link attempt-back" href={`/courses/${courseId}/quizzes/${quizId}/attempts/${a.id}`}>Intento {a.attemptNumber}<ArrowRight size={14} aria-hidden="true"/></Link></th><td><span className="attempt-identifier">{a.studentId}</span></td><td>{sections.find(s => s.id === a.sectionId)?.code ?? a.sectionId}</td><td><AttemptStatus status={a.status}/></td><td className={a.grade == null ? 'hint' : 'grade-value tnum'}>{a.grade == null ? 'No disponible' : a.grade.toFixed(1)}</td></tr>)}</tbody></table></div>}
 <nav className="academic-footer" aria-label="Páginas de intentos"><span className="hint tnum">Página {pages.length+1}</span><div className="actions"><button type="button" className="btn btn-ghost" disabled={!pages.length} onClick={() => {
        setCursor(pages.at(-1));
        setPages(p => p.slice(0, -1));
    }}>Anterior</button><button type="button" className="btn btn-ghost" disabled={!page.hasMore} onClick={() => {
        setPages(p => [...p, cursor]);
        setCursor(page.nextCursor!);
    }}>Siguiente</button></div></nav></section></div></QuizWorkspace>;
}
