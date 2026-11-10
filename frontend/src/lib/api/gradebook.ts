import type { ApiClient } from './client.ts';
import { ApiResponseError } from './errors.ts';
import { path } from '../courses/validation.ts';
import { studentGrades, gradeItems, bookDto, queryPage, publicationSelection, correctedGrade, receiptDto, type GradeItem, type GroupPlan, type Correction, type PublicationSelection } from '../gradebook/validation.ts';
export async function getStudentGrades(c: ApiClient, slug: string, courseId: string) {
    const r = await c.GET('/api/v1/institution/{institutionSlug}/courses/{courseId}/my-grades', { params: { path: { ...path(slug, { courseId }), courseId } } });
    return studentGrades(r.data, courseId);
}
export async function listCourseGradeItems(c: ApiClient, slug: string, courseId: string) {
    const r = await c.GET('/api/v1/institution/{institutionSlug}/courses/{courseId}/grade-items', { params: { path: { ...path(slug, { courseId }), courseId } } });
    return gradeItems(r.data, courseId);
}
export async function getCourseGradebook(c: ApiClient, slug: string, courseId: string, items: GradeItem[], q: {
    sectionId?: string;
    cursor?: string;
    limit?: number;
} = {}) {
    const r = await c.GET('/api/v1/institution/{institutionSlug}/courses/{courseId}/gradebook', { params: { path: { ...path(slug, { courseId, ...(q.sectionId !== undefined ? { sectionId: q.sectionId } : {}) }), courseId }, query: { ...queryPage(q.cursor, q.limit), sectionId: q.sectionId } } });
    return bookDto(r.data, courseId, items, q.sectionId);
}
export function matchesGroupPlan(saved: ReturnType<typeof gradeItems>, body: GroupPlan) {
    return saved.calculation === 'points' && saved.totalWeightPercent === 100 &&
        saved.items.length === body.groups.reduce((count, group) => count + group.gradeItemIds.length, 0) &&
        saved.groups?.length === body.groups.length && saved.groups.every((group, index) => {
            const desired = body.groups[index];
            return (desired.id === null || desired.id === group.id) && group.title === desired.title &&
                group.weightPercent === desired.weightPercent && group.position === index + 1 &&
                desired.gradeItemIds.every(id => saved.items.some(i => i.id === id && i.groupId === group.id));
        });
}
export async function updateGradeGroups(c: ApiClient, slug: string, courseId: string, body: GroupPlan) {
    const r = await c.PUT('/api/v1/institution/{institutionSlug}/courses/{courseId}/gradebook/groups', {
        params: { path: { ...path(slug, { courseId }), courseId } }, body,
    });
    const saved = gradeItems(r.data, courseId);
    if (!matchesGroupPlan(saved, body)) throw new ApiResponseError();
    return saved;
}
export async function correctPublishedGrade(c: ApiClient, slug: string, courseId: string, gradeId: string, body: Correction) {
    const r = await c.PATCH('/api/v1/institution/{institutionSlug}/courses/{courseId}/gradebook/grades/{gradeId}', {
        params: { path: { ...path(slug, { courseId, gradeId }), courseId, gradeId } }, body,
    });
    return correctedGrade(r.data, gradeId, body);
}
export async function publishGrades(c: ApiClient, slug: string, courseId: string, input: PublicationSelection, key: string) {
    if (!key || key.length > 200 || /[\x00-\x20\x7f]/.test(key)) {
        throw new TypeError('Clave inválida.');
    }
    const body = publicationSelection(input), r = await c.POST('/api/v1/institution/{institutionSlug}/courses/{courseId}/gradebook/publications', { params: { path: { ...path(slug, { courseId }), courseId }, header: { 'Idempotency-Key': key } }, body });
    const receipt = receiptDto(r.data);
    if (!('scope' in body) && receipt.publishedCount !== body.gradeItemIds.length * body.studentIds.length) {
        throw new ApiResponseError();
    }
    return receipt;
}
