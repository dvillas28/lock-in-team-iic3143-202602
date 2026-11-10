"use client";

import { useState, type ComponentProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { listEvaluationGroups } from "../../lib/api/assignments.ts";
import { ApiHttpError } from "../../lib/api/errors.ts";
import { createQuiz, listCourseQuizzes } from "../../lib/api/quizzes.ts";
import type { CurrentUser } from "../../lib/auth/validation.ts";
import { FieldError } from "../../lib/courses/validation.ts";
import { canAuthor, destinations } from "../../lib/quizzes/capabilities.ts";
import { quizListQuery, type QuizFilters } from "../../lib/quizzes/list-location.ts";
import type { Summary } from "../../lib/quizzes/validation.ts";
import { useSession } from "../auth/session-provider.tsx";
import { useMutation } from "../courses/use-mutation.ts";
import { useResource } from "../courses/use-resource.ts";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { QuizWorkspace } from "./quiz-workspace.tsx";
import { QuizDraftForm, QuizDraftSave, useQuizDraft } from "./quiz-draft-form.tsx";
import { rememberQuizCreation } from "./quiz-created-receipt.ts";
import { QuizLeaveGuard } from "./quiz-leave-guard.tsx";

const emptyFilters: QuizFilters = { query: "", status: "", section: "" };

export function QuizCreate({ courseId, filters = emptyFilters }: { courseId: string; filters?: QuizFilters }) {
  const { session, state } = useSession();
  const context = state.context;
  const slug = context?.slug ?? "";
  const scope = `${state.generation}:${slug}:${courseId}:new:${JSON.stringify(context?.user)}`;
  const result = useResource(session, scope, async client => {
    const user = context?.user;
    if (!user) throw new ApiHttpError(403);
    const [course, sections] = await Promise.all([getCourse(client, slug, courseId), listSections(client, slug, courseId)]);
    const allowed = destinations(user, course, sections);
    const wholeCourse = canAuthor(user, course, sections, null);
    if (!allowed.length && !wholeCourse) throw new ApiHttpError(403);
    const groups = await listEvaluationGroups(client, slug, courseId);
    return { course, sections, allowed, wholeCourse, groups, user };
  });
  if (!context?.user) return <LoadingState/>;
  if (result.error) return <ErrorState feedback={result.error} onRetry={() => void result.reload()}/>;
  if (!result.data) return <LoadingState/>;
  return <CreateForm key={scope} {...result.data} filters={filters}/>;
}

function CreateForm({ course, sections, allowed, wholeCourse, groups, user, filters }: {
  course: Awaited<ReturnType<typeof getCourse>>;
  sections: Awaited<ReturnType<typeof listSections>>;
  allowed: Awaited<ReturnType<typeof listSections>>;
  wholeCourse: boolean;
  groups: Awaited<ReturnType<typeof listEvaluationGroups>>;
  user: CurrentUser;
  filters: QuizFilters;
}) {
  const { session, state } = useSession();
  const slug = state.context!.slug;
  const router = useRouter();
  const [candidates, setCandidates] = useState<Summary[]>();
  const [createdId, setCreatedId] = useState<string>();
  const mutation = useMutation(session);
  const draft = useQuizDraft(mutation);
  const base = `/courses/${course.id}/quizzes`;
  const suffix = quizListQuery(filters);
  const blocked = mutation.busy || !!mutation.uncertain || !!createdId;

  const save: ComponentProps<typeof QuizDraftForm>["save"] = async (values, current, element) => {
    if (!canAuthor(user, course, sections, values.sectionId ?? null))
      throw new FieldError("sectionId", "Selecciona un destinatario de tu alcance docente.");
    const saved = await session.request(client => createQuiz(client, slug, course.id, { ...values, title: values.title! }), current);
    if (!current()) return;
    rememberQuizCreation(session, course.id, saved.id);
    setCreatedId(saved.id);
    element.reset();
    draft.reset();
    router.replace(base + quizListQuery(filters, saved.id));
    return "Borrador creado.";
  };

  async function reconcile(current: () => boolean) {
    const items = await session.request(client => listCourseQuizzes(client, slug, course.id), current);
    if (current()) setCandidates(items.filter(item => item.status === "draft" && canAuthor(user, course, sections, item.sectionId)));
    return "La lista puede mostrar coincidencias, pero no confirma si se creó el borrador.";
  }

  return <QuizWorkspace course={course} user={user} title="Crear quiz" authoring>
    <Link className="text-link quiz-back" href={base + suffix}><ArrowLeft size={16} aria-hidden="true"/>Volver a quizzes</Link>
    <QuizLeaveGuard active={!createdId && (draft.form.dirty || !!mutation.busy || !!mutation.uncertain)}/>
    <div className="card quiz-save-bar" role="region" aria-label="Guardar borrador">
      <span className="hint" role="status">{draft.form.dirty ? "Cambios sin guardar" : "Nuevo borrador"}</span>
      <QuizDraftSave form={draft.id} busy={mutation.busy} blocked={blocked} creating/>
    </div>
    <QuizDraftForm draft={draft} label="Crear quiz" blocked={blocked} sections={allowed}
      groups={groups} wholeCourse={wholeCourse} save={save} reconcile={reconcile}/>
    {createdId && <Link className="text-link" href={base + quizListQuery(filters, createdId)}>Ver borrador en el listado</Link>}
    {candidates && <section className="card panel stack">
      <h2 className="serif">Borradores para revisar</h2>
      {candidates.length ? candidates.map(item => <Link key={item.id} href={`${base}/${item.id}${suffix}`}>{item.title}</Link>)
        : <p>No hay borradores visibles. La creación sigue sin confirmar.</p>}
    </section>}
  </QuizWorkspace>;
}
