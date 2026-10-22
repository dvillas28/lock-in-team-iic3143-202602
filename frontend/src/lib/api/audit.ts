import type { ApiClient } from './client.ts';
import { path } from '../courses/validation.ts';
import { auditFilters, auditPageDto, type AuditFilters } from '../audit/validation.ts';
import { ApiResponseError } from './errors.ts';
export async function listCourseAuditEvents(c: ApiClient, slug: string, courseId: string, institutionId: string, filters: AuditFilters = {}) {
    const q = auditFilters(filters), r = await c.GET('/api/v1/institution/{institutionSlug}/courses/{courseId}/audit-events', { params: { path: { ...path(slug, { courseId, institutionId }), courseId }, query: q } }), page = auditPageDto(r.data, courseId, institutionId);
    if (page.items.some(e => (q.action && e.action !== q.action) || (q.resourceType && e.resourceType !== q.resourceType) || (q.resourceId && e.resourceId !== q.resourceId) || (q.actorUserId && e.actorUserId !== q.actorUserId) || (q.sectionId && e.sectionId !== q.sectionId) || (q.from && Date.parse(e.occurredAt) < Date.parse(q.from)) || (q.to && Date.parse(e.occurredAt) > Date.parse(q.to)))) {
        throw new ApiResponseError();
    }
    return page;
}
