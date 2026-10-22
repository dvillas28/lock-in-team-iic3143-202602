"use client";
import { useRef, useState } from 'react';
import type { Session } from '../../lib/auth/session.ts';
import type { GradeItem } from '../../lib/gradebook/validation.ts';
import { readFreeze, updateGradebookWeights, listCourseGradeItems } from '../../lib/api/gradebook.ts';
import { ApiHttpError } from '../../lib/api/errors.ts';
import { getRouteFeedback } from '../../lib/route-feedback.ts';
import { useResource } from '../courses/use-resource.ts';
export function WeightsForm({ session, slug, courseId, items, locked, busy = false, onSaved }: Readonly<{
    session: Session;
    slug: string;
    courseId: string;
    items: GradeItem[];
    locked: boolean;
    busy?: boolean;
    onSaved: () => Promise<unknown>;
}>) {
    const [status, setStatus] = useState<'ready' | 'saving' | 'uncertain' | 'locked'>('ready'), [message, setMessage] = useState('');
    const pending = useRef(false);
    const scan = useResource(session, `${session.getSnapshot().generation}:${slug}:${courseId}:freeze`, async (c) => {
        const freeze = await readFreeze(c, slug, courseId, items);
        if (freeze === 'locked') {
            setStatus('locked');
        }
        const current = await listCourseGradeItems(c, slug, courseId);
        return { freeze, current };
    });
    const frozen = locked || status === 'locked' || scan.data?.freeze === 'locked';
    async function save(form: HTMLFormElement) {
        if (pending.current || busy || frozen || status !== 'ready' || !scan.data || scan.error) {
            return;
        }
        const current = scan.data.current.items, data = new FormData(form), values = current.map(i => {
            const value = data.get(i.id);
            return { gradeItemId: i.id, weightPercent: typeof value === 'string' ? value : '' };
        });
        const context = session.getSnapshot().context;
        pending.current = true;
        setStatus('saving');
        setMessage('');
        try {
            await session.request(c => updateGradebookWeights(c, slug, courseId, current, values));
            if (context !== session.getSnapshot().context) {
                return;
            }
            setMessage('Pesos confirmados por backend.');
            setStatus('ready');
            await scan.reload();
            await onSaved();
        }
        catch (e) {
            if (context !== session.getSnapshot().context) {
                return;
            }
            if (e instanceof ApiHttpError && e.problem.code === 'GRADE_WEIGHTS_LOCKED') {
                setStatus('locked');
                setMessage('Pesos bloqueados por publicación.');
            }
            else if (e instanceof TypeError || e instanceof ApiHttpError && e.status < 500) {
                setStatus('ready');
                setMessage(e instanceof TypeError ? e.message : getRouteFeedback(e).message);
            }
            else {
                setStatus('uncertain');
                setMessage('Guardado incierto. Consulta los pesos actuales; una lectura no descarta una escritura aún en vuelo. No se reenviará automáticamente.');
            }
        }
        finally {
            pending.current = false;
        }
    }
    let statusMessage = 'Libro global revisado. El backend resuelve publicaciones concurrentes.';
    if (frozen) {
        statusMessage = 'Pesos bloqueados por publicación.';
    }
    else if (!scan.data || scan.error) {
        statusMessage = 'Freeze desconocido: guardar bloqueado.';
    }
    else if (status === 'saving') {
        statusMessage = 'Guardando pesos…';
    }
    return <section className="panel stack"><h2 className="serif">Ponderaciones</h2><output aria-live="polite">{statusMessage}</output>
 {scan.error && <p role="alert">{scan.error.message}</p>}<p aria-live="polite">{message}</p>
 {!frozen && scan.data && !scan.error && status !== 'uncertain' && <form key={JSON.stringify(scan.data.current)} onSubmit={e => {
        e.preventDefault();
        void save(e.currentTarget);
    }} className="stack"><fieldset disabled={busy || status === 'saving'}><legend>Todos los pesos, suma exacta 100 %</legend>{scan.data.current.items.map(i => <label className="field-label" key={i.id}>{i.title}<input className="field tnum" name={i.id} defaultValue={String(i.weightPercent)} inputMode="decimal" required/></label>)}</fieldset><button type="submit" data-weights className="btn btn-primary" disabled={busy || status === 'saving' || !scan.data.current.items.length}>Guardar pesos</button></form>}
 {status === 'uncertain' && scan.data && <ul>{scan.data.current.items.map(i => <li className="tnum" key={i.id}>{i.title}: {i.weightPercent} % observado</li>)}</ul>}
 <button type="button" className="btn btn-ghost" disabled={busy || status === 'saving'} onClick={() => void scan.reload()}>Consultar pesos y bloqueo</button>{status === 'uncertain' && <button type="button" className="btn btn-ghost" onClick={() => {
                if (window.confirm('La lectura no prueba que terminó la escritura anterior. ¿Revisaste el estado y deseas habilitar un nuevo guardado explícito?')) {
                    setStatus('ready');
                }
            }}>Revisé la incertidumbre</button>}</section>;
}
