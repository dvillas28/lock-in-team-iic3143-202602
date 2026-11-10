import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { PoolClient, QueryResultRow } from "pg";
import { DatabaseService } from "../database/database.service";
import { AuditService } from "../audit/audit.service";
import { requirePermission } from "../courses/course-access";
import { gradebookScope, type GradebookScope } from "../gradebook/gradebook-access";
import { bumpGradebookVersion, evaluationGroup, groupsFor } from "../gradebook/gradebook-groups";
import { canAuthorQuiz as canAuthor, requireDestination } from "../quizzes/quiz-access";
import { assignmentCreate, assignmentUpdate, assignmentVisibility, type AssignmentInput } from "./assignment-validation";

const date = (column: string) => `to_char(a.${column} AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;
const fields = `a.*, i.title,i.max_points,i.group_id,g.title AS group_title,g.weight_percent,
 ${date("available_from")} AS available_from,${date("due_at")} AS due_at,
 ${date("available_until")} AS available_until,${date("published_at")} AS published_at`;

function params(scope: GradebookScope) {
 const teachers = scope.roles.filter(e => e.role === "teacher").map(e => e.section_id);
 const readers = scope.roles.filter(e => e.role === "teacher" || e.role === "student").map(e => e.section_id);
 return [scope.member.institution_id, scope.courseId, scope.owner && teachers.length > 0, teachers, readers];
}

async function visible(c: PoolClient, scope: GradebookScope, id?: string) {
 return (await c.query(`SELECT ${fields} FROM public.assignments a
  JOIN public.grade_items i ON (i.institution_id,i.course_id,i.assignment_id)=(a.institution_id,a.course_id,a.id)
  JOIN public.grade_groups g ON (g.institution_id,g.course_id,g.id)=(i.institution_id,i.course_id,i.group_id)
  WHERE a.institution_id=$1 AND a.course_id=$2 AND ($6::uuid IS NULL OR a.id=$6)
  AND ($3::boolean OR a.section_id=ANY($4::uuid[]) OR
   (a.status='published' AND ((a.section_id IS NULL AND cardinality($5::uuid[])>0) OR a.section_id=ANY($5::uuid[]))))
  ORDER BY a.id`, [...params(scope), id ?? null])).rows;
}

async function find(c: PoolClient, scope: GradebookScope, id: string) {
 const [row] = await visible(c, scope, id);
 if (!row) throw new NotFoundException();
 return row;
}

function input(row: QueryResultRow): AssignmentInput {
 return {
  title:row.title, description:row.description, instructions:row.instructions, sectionId:row.section_id,
  maxPoints:Number(row.max_points), groupId:row.group_id, allowedExtensions:row.allowed_extensions,
  maxAttempts:row.max_attempts, availableFrom:row.available_from, dueAt:row.due_at, availableUntil:row.available_until,
 };
}

function dto(row: QueryResultRow, scope: GradebookScope) {
 return {
  ...input(row), id:row.id as string, courseId:scope.courseId, status:row.status, publishedAt:row.published_at,
  groupTitle:row.group_title as string, weightPercent:Number(row.weight_percent), version:row.version as number,
  canManage:canAuthor(scope,row.section_id),
 };
}

const metadata = (v: AssignmentInput) => [
 v.sectionId,v.description,v.instructions,v.availableFrom,v.dueAt,v.availableUntil,v.allowedExtensions,v.maxAttempts,
];
const changed = () => new ConflictException({code:"ASSIGNMENT_CHANGED"});

async function requireFutureDueDate(c: PoolClient, dueAt: string | null) {
 if (dueAt && (await c.query("SELECT $1::timestamptz < clock_timestamp() AS past",[dueAt])).rows[0].past) {
  throw new UnprocessableEntityException({code:"ASSIGNMENT_DUE_DATE_IN_PAST"});
 }
}

@Injectable()
export class AssignmentsService {
 constructor(private readonly db: DatabaseService, private readonly audit: AuditService) {}

 async list(actor: string, slug: string, course: string) {
  return this.db.withInstitution(actor,slug,async c => {
   const scope = await gradebookScope(c,actor,slug,course);
   requirePermission(scope.roles.some(e => e.role === "teacher" || e.role === "student"));
   const rows = await visible(c,scope);
   return {items:rows.map(row => dto(row,scope))};
  });
 }

 async get(actor: string, slug: string, course: string, id: string) {
  return this.db.withInstitution(actor,slug,async c => {
   const scope = await gradebookScope(c,actor,slug,course);
   return dto(await find(c,scope,id),scope);
  });
 }

 async groups(actor: string, slug: string, course: string) {
  return this.db.withInstitution(actor,slug,async c => {
   const scope = await gradebookScope(c,actor,slug,course);
   requirePermission(scope.roles.some(e => e.role === "teacher"));
   return {items:await groupsFor(c,scope)};
  });
 }

 async create(actor: string, slug: string, course: string, body: unknown) {
  const {id,values,publish} = assignmentCreate(body);
  const digest = createHash("sha256").update(JSON.stringify(publish ? {...values,publish} : values)).digest("hex");
  return this.db.withInstitution(actor,slug,async c => {
   const scope = await gradebookScope(c,actor,slug,course), tenant = scope.member.institution_id;
   await requireDestination(c,scope,values.sectionId,true);
   const inserted = await c.query(`INSERT INTO public.assignments
    (id,institution_id,course_id,created_by,create_digest,section_id,description,instructions,
     available_from,due_at,available_until,allowed_extensions,max_attempts)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT(id) DO NOTHING`,
   [id,tenant,course,actor,digest,...metadata(values)]);
   if (!inserted.rowCount) {
    const [existing] = await visible(c,scope,id);
    if (!existing || existing.create_digest !== digest || existing.created_by !== actor || !canAuthor(scope,existing.section_id)) {
     throw new ConflictException({code:"IDEMPOTENCY_CONFLICT"});
    }
    return dto(existing,scope);
   }
   await requireFutureDueDate(c,values.dueAt);
   const group = await evaluationGroup(c,scope,"assignment",values.groupId);
   await c.query(`INSERT INTO public.grade_items(id,institution_id,course_id,assignment_id,title,max_points,group_id)
    VALUES($1,$2,$3,$4,$5,$6,$7)`,[randomUUID(),tenant,course,id,values.title,values.maxPoints,group]);
   await bumpGradebookVersion(c,scope);
   const created = await this.record(c,scope,actor,id,"created",null);
   return publish ? this.setVisibility(c,scope,actor,await find(c,scope,id),true) : created;
  });
 }

 async update(actor: string, slug: string, course: string, id: string, body: unknown) {
  return this.db.withInstitution(actor,slug,async c => {
   const scope = await gradebookScope(c,actor,slug,course), row = await find(c,scope,id);
   requirePermission(canAuthor(scope,row.section_id));
   const previous = input(row), {values,expectedVersion,publish} = assignmentUpdate(body,previous);
   await requireDestination(c,scope,values.sectionId,true);
   const groupId = values.groupId === previous.groupId ? previous.groupId : await evaluationGroup(c,scope,"assignment",values.groupId);
   const needsEdit = !isDeepStrictEqual({...values,groupId},previous);
   const needsPublication = publish && row.status !== "published";
   if (!needsEdit && !needsPublication) return dto(row,scope);
   if (expectedVersion !== row.version) throw changed();
   if (!needsEdit) return this.setVisibility(c,scope,actor,row,true);
   if (values.dueAt !== previous.dueAt) await requireFutureDueDate(c,values.dueAt);
   const tenant = scope.member.institution_id;
   await c.query(`UPDATE public.assignments SET section_id=$3,description=$4,instructions=$5,
    available_from=$6,due_at=$7,available_until=$8,allowed_extensions=$9,max_attempts=$10,version=version+1
    WHERE institution_id=$1 AND id=$2`,[tenant,id,...metadata(values)]);
   await c.query(`UPDATE public.grade_items SET title=$3,max_points=$4,group_id=$5 WHERE institution_id=$1 AND assignment_id=$2`,
    [tenant,id,values.title,values.maxPoints,groupId]);
   await bumpGradebookVersion(c,scope);
   const edited = await this.record(c,scope,actor,id,"updated",row);
   return needsPublication ? this.setVisibility(c,scope,actor,await find(c,scope,id),true) : edited;
  });
 }

 async visibility(actor: string, slug: string, course: string, id: string, body: unknown) {
  const {expectedVersion,published} = assignmentVisibility(body);
  return this.db.withInstitution(actor,slug,async c => {
   const scope = await gradebookScope(c,actor,slug,course), row = await find(c,scope,id);
   requirePermission(canAuthor(scope,row.section_id));
   if (published === (row.status === "published")) return dto(row,scope);
   if (expectedVersion !== row.version) throw changed();
   return this.setVisibility(c,scope,actor,row,published);
  });
 }

 private async setVisibility(c: PoolClient, scope: GradebookScope, actor: string, row: QueryResultRow, published: boolean) {
  const id = row.id as string;
  await c.query(`UPDATE public.assignments SET status=$3,
   published_at=coalesce(published_at,clock_timestamp()),version=version+1 WHERE institution_id=$1 AND id=$2`,
  [scope.member.institution_id,id,published ? "published" : "hidden"]);
  return this.record(c,scope,actor,id,published ? "published" : "hidden",row);
 }

 private async record(c: PoolClient, scope: GradebookScope, actor: string, id: string, action: string, before: QueryResultRow | null) {
  const row = await find(c,scope,id), after = dto(row,scope);
  await this.audit.record(c,{
   institutionId:scope.member.institution_id,actorUserId:actor,courseId:scope.courseId,
   resourceType:"assignment",resourceId:id,action:`assignment.${action}`,
   sectionId:before && before.section_id !== row.section_id ? null : row.section_id,
   before:before ? dto(before,scope) : null,after,
  });
  return after;
 }
}
