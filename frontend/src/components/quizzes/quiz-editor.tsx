"use client";
import { QuizWorkspace } from "./quiz-workspace.tsx";
import { QuizStatus } from "./quiz-facts.tsx";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { useMutation } from "../courses/use-mutation.ts";
import { getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { listEvaluationGroups, type EvaluationGroup } from "../../lib/api/assignments.ts";
import { getQuiz, getQuizAuthoringView, updateQuiz } from "../../lib/api/quizzes.ts";
import { canAuthor, destinations } from "../../lib/quizzes/capabilities.ts";
import { quizDraftChanges } from "../../lib/quizzes/draft-values.ts";
import { quizInput, type Authoring } from "../../lib/quizzes/validation.ts";
import { ApiHttpError } from "../../lib/api/errors.ts";
import { FieldError } from "../../lib/courses/validation.ts";
import { ErrorState } from "../route-states.tsx";
import { QuizSkeleton } from "./quiz-skeleton.tsx";
import { QuizDraftForm, QuizDraftSave, QuizPublishSubmit, useQuizDraft, type PublishRequest } from "./quiz-draft-form.tsx";
import { QuizLeaveGuard } from "./quiz-leave-guard.tsx";
import { PublishedItem, QuizPublishDialog, usePublication } from "./quiz-publish.tsx";
import { rememberQuizPublication } from "./quiz-created-receipt.ts";
export function QuizEditor({courseId,quizId,listQuery=""}:{courseId:string;quizId:string;listQuery?:string}) {
  const {session,state}=useSession(), context=state.context, slug=context?.slug ?? "";
  const scope=`${state.generation}:${slug}:${courseId}:${quizId}:authoring:${JSON.stringify(context?.user)}`;
  const result=useResource(session,scope,async c=>{
    const course=await getCourse(c,slug,courseId),sections=await listSections(c,slug,courseId),safe=await getQuiz(c,slug,courseId,quizId);
    if(!context?.user || !canAuthor(context.user,course,sections,safe.sectionId)) throw new ApiHttpError(403);
    const quiz=await getQuizAuthoringView(c,slug,courseId,quizId);
    if(!canAuthor(context.user,course,sections,quiz.sectionId)) throw new ApiHttpError(403);
    // Groups are auxiliary: without them the draft keeps its current group.
    const groups=quiz.status==="draft" ? await listEvaluationGroups(c,slug,courseId).catch(()=>null) : undefined;
    return {course,sections,quiz,groups:groups ?? undefined,groupsUnavailable:groups===null};
  });
  if(!context?.user) return <QuizSkeleton kind="edit"/>;
  if(result.error) return <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/>;
  if(!result.data) return <QuizSkeleton kind="edit"/>;
  return <AuthoringForm key={scope} {...result.data} listQuery={listQuery}/>;
}
function AuthoringForm({course,sections,quiz,groups,groupsUnavailable,listQuery}:{course:Awaited<ReturnType<typeof getCourse>>;sections:Awaited<ReturnType<typeof listSections>>;quiz:Authoring;groups?:EvaluationGroup[];groupsUnavailable:boolean;listQuery:string}) {
  const {session,state}=useSession(), {slug,user}=state.context!;
  const router = useRouter();
  const [saved,setSaved]=useState(quiz),[observed,setObserved]=useState<Authoring>(),[revision,setRevision]=useState(0);
  const [request,setRequest]=useState<PublishRequest>(),[target,setTarget]=useState<Authoring>(),[leaving,setLeaving]=useState(false);
  const mutation = useMutation(session);
  const publication = usePublication(session, slug, course.id);
  const confirming = useRef(false);
  const draft = useQuizDraft(mutation, saved);
  const dirty = draft.form.dirty;
  const permitted=(q:Authoring)=>!!user && canAuthor(user,course,sections,q.sectionId);
  const immutable=saved.status === "published" || observed?.status === "published";
  const publishing = !!request && (mutation.busy || publication.busy || leaving);
  const blocked=immutable || mutation.busy || mutation.uncertain || publishing || !!observed;
  const destination=(id:string|null|undefined)=>id ? `Sección ${sections.find(s=>s.id===id)?.code}` : "Todo el curso";
  function accept(next: Authoring) {
    if (!permitted(next)) {
      void session.loadContext(slug);
      throw new ApiHttpError(403);
    }
    setSaved(next);
    setObserved(undefined);
    setRevision(previous => previous + 1);
    draft.reset(next);
  }

  const save: ComponentProps<typeof QuizDraftForm>["save"] = async (values, current) => {
    await persist(values, current);
    return "Quiz actualizado.";
  };

  async function persist(values: Parameters<ComponentProps<typeof QuizDraftForm>["save"]>[0], current: () => boolean) {
    if (!permitted(saved) || !canAuthor(user!, course, sections, values.sectionId ?? null))
      throw new FieldError("sectionId", "Selecciona un destinatario de tu alcance docente.");
    const body = quizInput(quizDraftChanges(values, saved), saved);
    const next = await session.request(c => updateQuiz(c, slug, saved, body), current);
    if (current()) accept(next);
    return next;
  }

  async function reconcile(current: () => boolean) {
    const next = await session.request(c => getQuizAuthoringView(c, slug, course.id, saved.id), current);
    if (!permitted(next)) {
      await session.loadContext(slug);
      return "Acceso revocado.";
    }
    if (current()) setObserved(next);
    return "Estado consultado. Revisa la versión recibida; tu texto local no fue reemplazado.";
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
        router.push(`/courses/${course.id}/quizzes/${published.id}${listQuery}`);
      });
    } finally {
      confirming.current = false;
    }
  }

  function closePublication() {
    setRequest(undefined);
    setTarget(undefined);
    publication.clear();
  }

  const values = request?.values;
  return <QuizWorkspace course={course} user={user!} title={saved.title} authoring>
    <Link className="text-link quiz-back" href={`/courses/${course.id}/quizzes/${saved.id}${listQuery}`}><ArrowLeft size={16} aria-hidden="true"/>Volver al detalle del quiz</Link>
    <QuizLeaveGuard active={!leaving && (dirty || mutation.busy || !!mutation.uncertain || publishing)}/>
    {immutable
      ? <div className="card quiz-save-bar" role="region" aria-label="Estado del quiz"><QuizStatus status="published"/></div>
      : <div className="card quiz-save-bar" role="region" aria-label="Guardar y publicar quiz">
        <div className="quiz-chips"><QuizStatus status="draft"/><span className="hint" role="status">{dirty ? "Cambios sin guardar" : ""}</span></div>
        <div className="actions">
          <QuizDraftSave form={draft.id} busy={mutation.busy && !request} blocked={!!blocked || !dirty}/>
          <QuizPublishSubmit form={draft.id} blocked={!!blocked}/>
        </div>
      </div>}
    {saved.status === "published" && <PublishedItem session={session} slug={slug} quiz={saved}/>}
    {groupsUnavailable && !immutable && <p className="hint" role="status">No se pudieron cargar los grupos de evaluación. El quiz conservará su grupo actual.</p>}
    <QuizDraftForm draft={draft} label="Editar quiz" blocked={!!blocked} revision={revision} groups={groups}
      sections={destinations(user!, course, sections)} wholeCourse={canAuthor(user!, course, sections, null)}
      save={save} reconcile={reconcile} persist={persist} onPublish={setRequest}/>
    <QuizPublishDialog open={!!request && !mutation.uncertain} busy={publishing} error={publication.error}
      preview={values && { title: values.title ?? saved.title, destination: destination(values.sectionId),
        opensAt: values.opensAt ?? null, closesAt: values.closesAt ?? null, maxAttempts: values.maxAttempts ?? null }}
      note={request?.changed && !target && <p className="hint">Primero se guardarán tus cambios.</p>}
      onConfirm={() => void confirmPublication()} onClose={closePublication}/>
    {observed && <section className="notice stack"><h2 className="serif">Estado recibido: {observed.status === "published" ? "Publicado" : "Borrador"}</h2><p>Hay una versión recibida tras conflicto o resultado incierto. Tu formulario permanece separado. No hay fusión automática.</p><button type="button" className="btn btn-ghost" onClick={()=>accept(observed)}>Descartar cambios locales y cargar versión recibida</button></section>}
  </QuizWorkspace>;
}
