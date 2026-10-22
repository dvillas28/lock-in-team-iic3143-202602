import type { components } from '../api/schema';
import { ApiResponseError } from '../api/errors.ts';
import { isRecord } from '../auth/validation.ts';
import { isId } from '../courses/validation.ts';
import { date, pageInfo, queryPage, unique } from '../gradebook/validation.ts';
export type AuditEvent = components['schemas']['AuditEvent'];
export type AuditFilters = {
    action?: string;
    resourceType?: string;
    resourceId?: string;
    actorUserId?: string;
    sectionId?: string;
    from?: string;
    to?: string;
    cursor?: string;
    limit?: number;
};
export function auditFilters(q: AuditFilters) {
    const result: AuditFilters = { ...queryPage(q.cursor, q.limit) };
    (['resourceId', 'actorUserId', 'sectionId'] as const).forEach(k => {
        if (q[k] === undefined) {
            return;
        }
        if (!isId(q[k])) {
            throw new TypeError('Filtro UUID inválido.');
        }
        result[k] = q[k];
    });
    ([['action', 64], ['resourceType', 32]] as const).forEach(([k, max]) => {
        const value = q[k];
        if (value === undefined) {
            return;
        }
        if (!value.trim() || value.length > max || /[\x00-\x1f\x7f]/.test(value)) {
            throw new TypeError('Filtro de texto inválido.');
        }
        result[k] = value;
    });
    (['from', 'to'] as const).forEach(k => {
        const value = q[k];
        if (value === undefined) {
            return;
        }
        if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,6})?)?(?:Z|[+-]\d\d:\d\d)?$/.test(value) || !Number.isFinite(Date.parse(value))) {
            throw new TypeError('Fecha inválida.');
        }
        result[k] = date(value) ? value : new Date(value).toISOString();
    });
    if (result.from && result.to && Date.parse(result.from) > Date.parse(result.to)) {
        throw new TypeError('Desde debe ser anterior o igual a hasta.');
    }
    return result;
}
export function snapshot(v: unknown): string {
    return JSON.stringify(v, (k, value) => {
        if (/^(?:password|passwordhash|accessToken|token|secret|credentials|idempotencyKey|answers|isCorrect|pointsAwarded)$/i.test(k)) {
            throw new ApiResponseError();
        }
        return value;
    }, 2);
}
export function auditPageDto(v: unknown, courseId: string, institutionId: string) {
    const p = pageInfo(v);
    for (const e of p.items) {
        if (!isRecord(e) || !isId(e.id) || e.institutionId !== institutionId || e.courseId !== courseId || !isId(e.resourceId) || (e.actorUserId !== null && !isId(e.actorUserId)) || (e.sectionId !== null && !isId(e.sectionId)) || typeof e.action !== 'string' || !e.action.trim() || e.action.length > 64 || typeof e.resourceType !== 'string' || !e.resourceType.trim() || e.resourceType.length > 32 || !date(e.occurredAt) || !isRecord(e.changes)) {
            throw new ApiResponseError();
        }
        if (Object.keys(e.changes).some(k => !['before', 'after'].includes(k)) || Object.values(e.changes).some(x => x !== null && !isRecord(x))) {
            throw new ApiResponseError();
        }
        snapshot(e.changes);
    }
    if (!unique(p.items.map(e => e.id))) {
        throw new ApiResponseError();
    }
    return { ...p, items: p.items as AuditEvent[] };
}
