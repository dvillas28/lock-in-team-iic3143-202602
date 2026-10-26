"use client";
import { useState } from 'react';
import { CourseNavigation } from "../courses/course-navigation.tsx";
import Link from 'next/link';
import { useSession } from '../auth/session-provider.tsx';
import { useResource } from '../courses/use-resource.ts';
import { getCourse } from '../../lib/api/courses.ts';
import { listSections } from '../../lib/api/sections.ts';
import { listCourseAuditEvents } from '../../lib/api/audit.ts';
import { auditFilters, snapshot, type AuditFilters } from '../../lib/audit/validation.ts';
import { gradebookCapabilities } from '../../lib/gradebook/capabilities.ts';
import { ApiHttpError } from '../../lib/api/errors.ts';
import { ErrorState, LoadingState } from '../route-states.tsx';
export function CourseAudit({ courseId }: Readonly<{
    courseId: string;
}>) {
    const { state } = useSession();
    return !state.context?.user ? <LoadingState /> : <Audit key={`${state.generation}:${JSON.stringify(state.context)}:${courseId}`} courseId={courseId}/>;
}
function Audit({ courseId }: Readonly<{
    courseId: string;
}>) {
    const { session, state } = useSession(), user = state.context!.user!, slug = state.context!.slug;
    const [filters, setFilters] = useState<AuditFilters>({}), [cursor, setCursor] = useState<string>(), [pages, setPages] = useState<(string | undefined)[]>([]), [message, setMessage] = useState('');
    const r = useResource(session, `${state.generation}:${slug}:${courseId}:${JSON.stringify(filters)}:${cursor}`, async (c) => {
        const course = await getCourse(c, slug, courseId), cap = gradebookCapabilities(user, course, filters.sectionId);
        if (!cap.audit) {
            throw new ApiHttpError(403);
        }
        const owner = user.institutionMembership.isAdmin && course.createdBy === user.id, sections = await listSections(c, slug, courseId), page = await listCourseAuditEvents(c, slug, courseId, user.institutionMembership.institution.id, { ...filters, cursor });
        if (!owner && page.items.some(e => e.sectionId === null || !cap.writeSections.includes(e.sectionId))) {
            throw new ApiHttpError(403);
        }
        return { course, sections, cap, owner, page };
    });
    if (r.error) {
        return <div className="stack"><ErrorState feedback={r.error} onRetry={() => void r.reload()}/><button type="button" className="btn btn-ghost" onClick={() => {
            setFilters({});
            setCursor(undefined);
            setPages([]);
        }}>Reiniciar filtros</button></div>;
    }
    if (!r.data) {
        return <LoadingState />;
    }
    const { sections, cap, owner, page } = r.data;
    return <div className="stack"><Link href={`/courses/${courseId}`}>Volver al curso</Link><h1 className="serif">Auditoría del curso</h1><CourseNavigation course={r.data.course} user={user} active="/audit" /><form className="form-grid" onSubmit={e => {
            e.preventDefault();
            const data = new FormData(e.currentTarget), q = Object.fromEntries([...data].filter(([, v]) => v !== '')) as AuditFilters;
            try {
                setFilters(auditFilters(q));
                setCursor(undefined);
                setPages([]);
                setMessage('');
            }
            catch (e) {
                setMessage((e as Error).message);
            }
        }}>
 {(['action', 'resourceType', 'resourceId', 'actorUserId'] as const).map((name, n) => <label key={name}>{['Acción', 'Tipo de recurso', 'UUID recurso', 'UUID actor'][n]}<input className="field" name={name} defaultValue={filters[name]} maxLength={({ action: 64, resourceType: 32, resourceId: 36, actorUserId: 36 }[name])}/></label>)}
 <label>Sección histórica<select className="field" name="sectionId" defaultValue={filters.sectionId ?? ''}><option value="">Todas las autorizadas</option>{sections.filter(s => owner || cap.writeSections.includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.code}</option>)}</select></label>
 <label>Desde (hora local, inclusive)<input className="field" name="from" type="datetime-local" step="1"/></label><label>Hasta (hora local, inclusive)<input className="field" name="to" type="datetime-local" step="1"/></label><button type="submit" className="btn btn-primary">Aplicar filtros</button></form><p role="alert">{message}</p><p className="tnum">Rango UTC inclusive: {filters.from ?? 'Sin inicio'} · {filters.to ?? 'Sin fin'}</p>
 {!page.items.length && <output>No hay eventos en esta página.</output>}<div className="table-scroll" role="region" aria-label="Tabla con desplazamiento horizontal" tabIndex={0}><table className="data-table"><caption>Historia académica sanitizada e inmutable</caption><thead><tr>{['Fecha UTC', 'Actor', 'Acción', 'Recurso', 'Sección histórica', 'Cambios'].map(x => <th scope="col" key={x}>{x}</th>)}</tr></thead><tbody>{page.items.map(e => <tr key={e.id}><th scope="row" className="tnum">{e.occurredAt}</th><td>{e.actorUserId ?? 'Sin actor'}</td><td>{e.action}</td><td>{e.resourceType} · {e.resourceId}</td><td>{e.sectionId ?? 'Global del curso'}</td><td><details><summary>Ver antes y después</summary><p>Antes</p><pre className="markdown-source">{e.changes.before === undefined ? 'No disponible' : snapshot(e.changes.before)}</pre><p>Después</p><pre className="markdown-source">{e.changes.after === undefined ? 'No disponible' : snapshot(e.changes.after)}</pre></details></td></tr>)}</tbody></table></div>
 <nav className="actions" aria-label="Páginas de auditoría"><button type="button" className="btn btn-ghost" disabled={!pages.length} onClick={() => {
        setCursor(pages.at(-1));
        setPages(p => p.slice(0, -1));
    }}>Anterior</button><button type="button" className="btn btn-ghost" disabled={!page.hasMore} onClick={() => {
        setPages(p => [...p, cursor]);
        setCursor(page.nextCursor!);
    }}>Siguiente</button></nav></div>;
}
