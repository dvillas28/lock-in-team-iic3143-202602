import type { ApiClient } from './client.ts';
import { ApiResponseError } from './errors.ts';
import { path } from '../courses/validation.ts';
import { studentGrades, gradeItems, bookDto, queryPage, weightsInput, selection, receiptDto, type GradeItem, type Selection } from '../gradebook/validation.ts';
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
export async function updateGradebookWeights(c: ApiClient, slug: string, courseId: string, items: GradeItem[], values: {
    gradeItemId: string;
    weightPercent: string;
}[]) {
    const body = weightsInput(values, items);
    const r = await c.PUT('/api/v1/institution/{institutionSlug}/courses/{courseId}/gradebook/weights', { params: { path: { ...path(slug, { courseId }), courseId } }, body });
    const saved = gradeItems(r.data, courseId);
    if (saved.totalWeightPercent !== 100 || saved.items.length !== items.length || body.items.some(i => !saved.items.some(x => x.id === i.gradeItemId && x.weightPercent === i.weightPercent))) {
        throw new ApiResponseError();
    }
    return saved;
}
export async function publishGrades(c: ApiClient, slug: string, courseId: string, input: Selection, key: string) {
    if (!key || key.length > 200 || /[\x00-\x20\x7f]/.test(key)) {
        throw new TypeError('Clave inválida.');
    }
    const body = selection(input), r = await c.POST('/api/v1/institution/{institutionSlug}/courses/{courseId}/gradebook/publications', { params: { path: { ...path(slug, { courseId }), courseId }, header: { 'Idempotency-Key': key } }, body });
    const receipt = receiptDto(r.data);
    if (receipt.publishedCount !== body.gradeItemIds.length * body.studentIds.length) {
        throw new ApiResponseError();
    }
    return receipt;
}
export async function readFreeze(c: ApiClient, slug: string, courseId: string, items: GradeItem[]): Promise<'locked' | 'unlocked'> {
    let cursor: string | undefined;
    const seen = new Set<string>();
    do {
        const p = await getCourseGradebook(c, slug, courseId, items, { cursor, limit: 100 });
        if (p.items.some(r => r.grades.some(g => g.publishedAt !== null))) {
            return 'locked';
        }
        if (!p.hasMore) {
            return 'unlocked';
        }
        cursor = p.nextCursor!;
        if (seen.has(cursor)) {
            throw new ApiResponseError();
        }
        seen.add(cursor);
    } while (cursor);
    throw new ApiResponseError();
}
