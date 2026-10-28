"use client";
import { useState } from 'react';
import { CourseNavigation } from "../courses/course-navigation.tsx";
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
    return <div className="stack"><Link href={`/courses/${courseId}/quizzes/${quizId}`}>Volver al quiz</Link><h1>Intentos: {quiz.title}</h1><CourseNavigation course={r.data.course} user={user} active="/quizzes" />
 <form className="form-grid" onSubmit={e => {
        e.preventDefault();
        setFilters(draft);
        setCursor(undefined);
        setPages([]);
    }}><label>Sección histórica<select className="field" value={draft.sectionId} onChange={e => setDraft({ ...draft, sectionId: e.target.value })}><option value="">Todas las autorizadas</option>{sections.filter(s => cap.global || cap.readSections.includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.code}</option>)}</select></label><label>UUID estudiante<input className="field" value={draft.studentId} onChange={e => setDraft({ ...draft, studentId: e.target.value })}/></label><label>Estado<select className="field" value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}><option value="">Todos</option>{['inProgress', 'submitted', 'graded', 'cancelled'].map(s => <option key={s}>{s}</option>)}</select></label><button type="submit" className="btn btn-primary">Aplicar filtros</button></form>
 {!page.items.length && <output>No hay intentos.</output>}<div className="table-scroll" role="region" aria-label="Tabla con desplazamiento horizontal" tabIndex={0}><table className="data-table"><caption>Intentos en secciones autorizadas</caption><thead><tr>{['Intento', 'Estudiante', 'Sección histórica', 'Estado', 'Nota autorizada'].map(x => <th scope="col" key={x}>{x}</th>)}</tr></thead><tbody>{page.items.map(a => <tr key={a.id}><th scope="row"><Link href={`/courses/${courseId}/quizzes/${quizId}/attempts/${a.id}`}>{a.attemptNumber}</Link></th><td>{a.studentId}</td><td>{sections.find(s => s.id === a.sectionId)?.code ?? a.sectionId}</td><td>{a.status}</td><td className="tnum">{a.grade ?? 'No disponible'}</td></tr>)}</tbody></table></div>
 <nav className="actions" aria-label="Páginas de intentos"><button type="button" className="btn btn-ghost" disabled={!pages.length} onClick={() => {
        setCursor(pages.at(-1));
        setPages(p => p.slice(0, -1));
    }}>Anterior</button><button type="button" className="btn btn-ghost" disabled={!page.hasMore} onClick={() => {
        setPages(p => [...p, cursor]);
        setCursor(page.nextCursor!);
    }}>Siguiente</button></nav></div>;
}
