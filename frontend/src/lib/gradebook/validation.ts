import type { components } from '../api/schema';
import { ApiResponseError } from '../api/errors.ts';
import { isRecord } from '../auth/validation.ts';
import { isId, person } from '../courses/validation.ts';
export type StudentGrades = components['schemas']['StudentGradesResponse'];
export type GradeItem = components['schemas']['GradeItem'];
export type Book = components['schemas']['GradebookResponse'];
export type Selection = components['schemas']['PublishGradesRequest'];
export type GroupPlan = components['schemas']['UpdateGradeGroupsRequest'];
export type GradeGroup = components['schemas']['GradeGroup'];
export type GroupResult = components['schemas']['GradeGroupResult'];
export type GradeResult = components['schemas']['GradeTeacherView'];
export type Correction = components['schemas']['CorrectPublishedGradeRequest'];
export type PublicationSelection = Selection | components['schemas']['PublishPendingRequest'];
export type GradeItems = components['schemas']['GradeItemListResponse'];
export type Receipt = components['schemas']['PublishGradesResponse'];
export const date = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?Z$/.test(v) && Number.isFinite(Date.parse(v));
export const number = (v: unknown, min = 0, max = 100): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
export const unique = (v: unknown[]) => new Set(v).size === v.length;
const title = (v: unknown) => typeof v === 'string' && v.trim().length > 0 && !v.includes('\0');
const average = (v: unknown) => v === null || number(v, 1, 7);
function groupResults(value: unknown) {
    if (value === undefined) return;
    if (!Array.isArray(value) || !unique(value.map(g => g?.groupId)) || value.some(g => !isRecord(g) ||
        !isId(g.groupId) || !title(g.title) || !number(g.weightPercent) || !number(g.pointsPossible, Number.MIN_VALUE, Number.MAX_SAFE_INTEGER) ||
        !number(g.pointsEarned, 0, g.pointsPossible) || !number(g.scorePercent) || !number(g.grade, 1, 7))) {
        throw new ApiResponseError();
    }
}
const validCalculation = (v: unknown) => v === undefined || v === 'legacy' || v === 'points';
const optionalDate = (v: unknown) => v === undefined || v === null || date(v);
export function studentGrades(v: unknown, courseId: string): StudentGrades {
    if (!isRecord(v) || v.courseId !== courseId || !isId(v.courseId) || !Array.isArray(v.items) || !average(v.partialAverage) || !number(v.publishedWeightPercent) || typeof v.isPartial !== 'boolean' || !validCalculation(v.calculation)) {
        throw new ApiResponseError();
    }
    groupResults(v.groupResults);
    for (const i of v.items) {
        if (!isRecord(i) || !isId(i.gradeItemId) || !title(i.title) || !number(i.weightPercent) || !number(i.scorePercent) || !number(i.grade, 1, 7) || !date(i.publishedAt) ||
            (i.groupId !== undefined && (!isId(i.groupId) || !title(i.groupTitle) ||
            !number(i.maxPoints, Number.MIN_VALUE, 999999.99) || !number(i.pointsEarned, 0, i.maxPoints))) || !optionalDate(i.revisedAt)) {
            throw new ApiResponseError();
        }
    }
    if (!unique(v.items.map(i => i.gradeItemId))) {
        throw new ApiResponseError();
    }
    return v as StudentGrades;
}
export function gradeItems(v: unknown, courseId: string): GradeItems {
    if (!isRecord(v) || !Array.isArray(v.items) || !number(v.totalWeightPercent, 0, Number.MAX_SAFE_INTEGER) ||
        (v.weightsLocked !== undefined && typeof v.weightsLocked !== 'boolean') || !validCalculation(v.calculation) ||
        (v.hasPublishedGrades !== undefined && typeof v.hasPublishedGrades !== 'boolean') ||
        (v.version !== undefined && (!Number.isSafeInteger(v.version) || Number(v.version) < 0))) {
        throw new ApiResponseError();
    }
    const groups = v.groups;
    if (groups !== undefined && (!Array.isArray(groups) || !unique(groups.map(g => g?.id)) ||
        groups.some(g => !isRecord(g) || !isId(g.id) || !title(g.title) || !number(g.weightPercent) ||
            !Number.isSafeInteger(g.position) || Number(g.position) < 1))) throw new ApiResponseError();
    for (const i of v.items) {
        if (!isRecord(i) || !isId(i.id) || i.courseId !== courseId || !isId(i.quizId) || !title(i.title) ||
            !number(i.weightPercent) || !date(i.createdAt) ||
            (Array.isArray(groups) && (!groups.some(g => g.id === i.groupId) || !number(i.maxPoints, Number.MIN_VALUE, 999999.99)))) {
            throw new ApiResponseError();
        }
    }
    if (!unique(v.items.map(i => i.id)) || !unique(v.items.map(i => i.quizId))) throw new ApiResponseError();
    return v as GradeItems;
}
export function correctionPreview(input: string, maxPoints: number | undefined) {
    const value = input.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(value) || maxPoints === undefined || maxPoints <= 0) return null;
    const points = Number(value);
    if (points > maxPoints) return null;
    // Mirror PostgreSQL HALF_UP on the percentage hundredths and then on the grade tenths.
    const maximum = Math.round(maxPoints * 100);
    const earned = Math.round(points * 100);
    const percent = Math.floor((earned * 20000 + maximum) / (2 * maximum));
    const grade = percent <= 6000
        ? 10 + Math.floor((percent + 100) / 200)
        : 40 + Math.floor(((percent - 6000) * 3 + 200) / 400);
    return {points, percent: percent / 100, grade: grade / 10};
}
export function correctedGrade(v: unknown, gradeId: string, request: Correction): GradeResult {
    if (!isRecord(v) || v.id !== gradeId || v.revisionId !== request.revisionId || v.pointsEarned !== request.points ||
        !number(v.grade, 1, 7) || !number(v.scorePercent) || !date(v.publishedAt) || !date(v.revisedAt)) {
        throw new ApiResponseError();
    }
    return v as GradeResult;
}
export function pageInfo(v: unknown) {
    if (!isRecord(v) || !Array.isArray(v.items) || typeof v.hasMore !== 'boolean' || (v.nextCursor !== null && (typeof v.nextCursor !== 'string' || !v.nextCursor || v.nextCursor.length > 4096)) || v.hasMore !== (v.nextCursor !== null)) {
        throw new ApiResponseError();
    }
    return { items: v.items, hasMore: v.hasMore, nextCursor: v.nextCursor as string | null };
}
export function bookDto(v: unknown, courseId: string, items: GradeItem[], sectionId?: string): Book {
    const p = pageInfo(v);
    if (!isRecord(v) || v.courseId !== courseId) {
        throw new ApiResponseError();
    }
    const keys: string[] = [], grades: string[] = [];
    for (const r of p.items) {
        if (!isRecord(r) || !isId(r.sectionId) || (sectionId !== undefined && r.sectionId !== sectionId) || !Array.isArray(r.grades) || !average(r.partialAverage) || !number(r.publishedWeightPercent)) {
            throw new ApiResponseError();
        }
        groupResults(r.groupResults);
        const s = person(r.student);
        keys.push(s.id + '/' + r.sectionId);
        for (const g of r.grades) {
            if (!isRecord(g) || !isId(g.id) || !isId(g.attemptId) || g.studentId !== s.id || g.sectionId !== r.sectionId || !items.some(i => i.id === g.gradeItemId) || !number(g.scorePercent) || !number(g.grade, 1, 7) || (g.publishedAt !== null && !date(g.publishedAt)) ||
                (g.pointsEarned !== undefined && !number(g.pointsEarned, 0, 999999.99)) ||
                (g.revisionId !== undefined && g.revisionId !== null && !isId(g.revisionId)) || !optionalDate(g.revisedAt)) {
                throw new ApiResponseError();
            }
            grades.push(g.id);
        }
        if (!unique(r.grades.map(g => g.gradeItemId))) {
            throw new ApiResponseError();
        }
    }
    if (!unique(keys) || !unique(grades)) {
        throw new ApiResponseError();
    }
    return v as Book;
}
export function queryPage(cursor?: string, limit = 20) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || (cursor !== undefined && (!cursor || cursor.length > 4096))) {
        throw new TypeError('Paginación inválida.');
    }
    return { cursor, limit };
}
export function cents(v: string) {
    if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(v)) {
        throw new TypeError('Usa porcentajes con hasta dos decimales.');
    }
    const [a, b = ''] = v.split('.'), n = Number(a) * 100 + Number(b.padEnd(2, '0'));
    if (n > 10000) {
        throw new TypeError('Peso fuera de rango.');
    }
    return n;
}
export function bodySize<T>(v: T): T {
    if (new TextEncoder().encode(JSON.stringify(v)).length > 4096) {
        throw new TypeError('Selección demasiado grande (máximo 4096 bytes).');
    }
    return v;
}
function selectionIds(a: string[]) {
    if (!Array.isArray(a) || !a.length || !a.every(isId)) {
        throw new TypeError('Selecciona evaluaciones, secciones y estudiantes.');
    }
    const ids = a.map(x => x.toLowerCase()).sort();
    if (!unique(ids)) throw new TypeError('Selección duplicada.');
    return ids;
}
export function selection(v: Selection): Selection {
    return bodySize({ gradeItemIds: selectionIds(v.gradeItemIds), sectionIds: selectionIds(v.sectionIds), studentIds: selectionIds(v.studentIds) });
}
export function publicationSelection(v: PublicationSelection): PublicationSelection {
    if (!('scope' in v)) return selection(v);
    return bodySize({scope:'pending',sectionIds:selectionIds(v.sectionIds),
        ...(v.gradeItemIds ? {gradeItemIds:selectionIds(v.gradeItemIds)} : {})});
}
export function rectangle(v: Selection, rows: Book['items']) {
    const s = selection(v);
    for (const studentId of s.studentIds) {
        for (const gradeItemId of s.gradeItemIds) {
            const pairs = rows.flatMap(r => s.sectionIds.includes(r.sectionId) && r.student.id === studentId ? r.grades.filter(g => g.gradeItemId === gradeItemId) : []);
            if (pairs.length !== 1 || pairs[0].publishedAt !== null) {
                throw new TypeError('Cada par evaluación/estudiante debe tener una nota revisada sin publicar.');
            }
        }
    }
    return s;
}
export function receiptDto(v: unknown): Receipt {
    if (!isRecord(v) || !Number.isSafeInteger(v.publishedCount) || (v.publishedCount as number) < 1 || !date(v.publishedAt)) {
        throw new ApiResponseError();
    }
    return v as Receipt;
}
