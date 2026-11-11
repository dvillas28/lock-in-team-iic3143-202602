"use client";

import { useRef, useState, type ComponentProps } from "react";
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
import type { Authoring, Summary } from "../../lib/quizzes/validation.ts";
import { useSession } from "../auth/session-provider.tsx";
import { useMutation } from "../courses/use-mutation.ts";
import { useResource } from "../courses/use-resource.ts";
import { ErrorState } from "../route-states.tsx";
import { QuizSkeleton } from "./quiz-skeleton.tsx";
import { QuizWorkspace } from "./quiz-workspace.tsx";
import { QuizDraftForm, QuizDraftSave, QuizPublishSubmit, useQuizDraft, type PublishRequest } from "./quiz-draft-form.tsx";
import { rememberQuizCreation, rememberQuizPublication } from "./quiz-created-receipt.ts";
import { QuizPublishDialog, usePublication } from "./quiz-publish.tsx";
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
    // Groups are auxiliary: without them the API keeps the default quiz group.
    const groups = await listEvaluationGroups(client, slug, courseId).catch(() => undefined);
    return { course, sections, allowed, wholeCourse, groups, user };
  });
  if (!context?.user) return <QuizSkeleton kind="create"/>;
  if (result.error) return <ErrorState feedback={result.error} onRetry={() => void result.reload()}/>;
  if (!result.data) return <QuizSkeleton kind="create"/>;
  return <CreateForm key={scope} {...result.data} filters={filters}/>;
}

function CreateForm({ course, sections, allowed, wholeCourse, groups, user, filters }: {
  course: Awaited<ReturnType<typeof getCourse>>;
  sections: Awaited<ReturnType<typeof listSections>>;
  allowed: Awaited<ReturnType<typeof listSections>>;
  wholeCourse: boolean;
  groups?: Awaited<ReturnType<typeof listEvaluationGroups>>;
  user: CurrentUser;
  filters: QuizFilters;
}) {
  const { session, state } = useSession();
  const slug = state.context!.slug;
  const router = useRouter();
  const [candidates, setCandidates] = useState<Summary[]>();
  const [createdId, setCreatedId] = useState<string>();
  const [request, setRequest] = useState<PublishRequest>();
  const [target, setTarget] = useState<Authoring>();
  const [leaving, setLeaving] = useState(false);
  const mutation = useMutation(session);
  const publication = usePublication(session, slug, course.id);
  const confirming = useRef(false);
  const draft = useQuizDraft(mutation);
  const base = `/courses/${course.id}/quizzes`;
  const suffix = quizListQuery(filters);
  const blocked = mutation.busy || !!mutation.uncertain || !!createdId;
  const publishing = !!request && (mutation.busy || publication.busy || leaving);

  async function persist(values: Parameters<ComponentProps<typeof QuizDraftForm>["save"]>[0], current: () => boolean) {
    if (!canAuthor(user, course, sections, values.sectionId ?? null))
      throw new FieldError("sectionId", "Selecciona un destinatario de tu alcance docente.");
    const saved = await session.request(client => createQuiz(client, slug, course.id, { ...values, title: values.title! }), current);
    if (current()) {
      rememberQuizCreation(session, course.id, saved.id);
      setCreatedId(saved.id);
    }
    return saved;
  }

  const save: ComponentProps<typeof QuizDraftForm>["save"] = async (values, current, element) => {
    const saved = await persist(values, current);
    if (!current()) return;
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

  async function confirmPublication() {
    if (!request || confirming.current) return;
    confirming.current = true;
    try {
      const quiz = target ?? await request.persist();
      if (!quiz) { setRequest(undefined); return; }
      setTarget(quiz);
      await publication.run(quiz.id, published => {
        rememberQuizPublication(session, course.id, published.id, published.title);
        setLeaving(true);
        router.replace(base + suffix);
      });
    } finally {
      confirming.current = false;
    }
  }

  const values = request?.values;
  const destination = values?.sectionId ? `Sección ${sections.find(s => s.id === values.sectionId)?.code}` : "Todo el curso";
  return <QuizWorkspace course={course} user={user} title="Crear quiz" authoring>
    <Link className="text-link quiz-back" href={base + suffix}><ArrowLeft size={16} aria-hidden="true"/>Volver a quizzes</Link>
    <QuizLeaveGuard active={!leaving && (publishing || (!createdId && (draft.form.dirty || !!mutation.busy || !!mutation.uncertain)))}/>
    <div className="card quiz-save-bar" role="region" aria-label="Guardar o publicar quiz">
      <span className="hint" role="status">{createdId ? "Borrador guardado" : draft.form.dirty ? "Cambios sin guardar" : "Nuevo quiz"}</span>
      <div className="actions">
        <QuizDraftSave form={draft.id} busy={mutation.busy && !request} blocked={blocked}/>
        <QuizPublishSubmit form={draft.id} blocked={blocked}/>
      </div>
    </div>
    {!groups && <p className="hint" role="status">No se pudieron cargar los grupos de evaluación. El quiz usará el grupo predeterminado de quizzes.</p>}
    <QuizDraftForm draft={draft} label="Crear quiz" blocked={blocked} sections={allowed}
      groups={groups} wholeCourse={wholeCourse} save={save} reconcile={reconcile} persist={persist} onPublish={setRequest}/>
    <QuizPublishDialog open={!!request && !mutation.uncertain} busy={publishing} error={publication.error}
      preview={values && { title: values.title ?? "", destination, opensAt: values.opensAt ?? null,
        closesAt: values.closesAt ?? null, maxAttempts: values.maxAttempts ?? null }}
      note={target && publication.error && <p className="hint">El borrador quedó guardado. Puedes reintentar o publicarlo más tarde desde el listado.</p>}
      onConfirm={() => void confirmPublication()} onClose={() => { setRequest(undefined); publication.clear(); }}/>
    {createdId && !request && <div className="actions">
      <Link className="btn btn-ghost" prefetch={false} href={`${base}/${createdId}/authoring${suffix}`}>Editar borrador</Link>
      <Link className="text-link" href={base + quizListQuery(filters, createdId)}>Ver borrador en el listado</Link>
    </div>}
    {candidates && <section className="card panel stack">
      <h2 className="serif">Borradores para revisar</h2>
      {candidates.length ? candidates.map(item => <Link key={item.id} href={`${base}/${item.id}${suffix}`}>{item.title}</Link>)
        : <p>No hay borradores visibles. La creación sigue sin confirmar.</p>}
    </section>}
  </QuizWorkspace>;
}
