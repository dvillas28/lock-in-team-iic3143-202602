"use client";
import { QuizWorkspace } from "./quiz-workspace.tsx";
import { QuizStatus } from "./quiz-facts.tsx";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, type ComponentProps } from "react";
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
import { ErrorState, LoadingState } from "../route-states.tsx";
import { QuizDraftForm, QuizDraftSave, useQuizDraft } from "./quiz-draft-form.tsx";
import { QuizLeaveGuard } from "./quiz-leave-guard.tsx";
import { QuizPublish } from "./quiz-publish.tsx";
export function QuizEditor({courseId,quizId,listQuery=""}:{courseId:string;quizId:string;listQuery?:string}) {
  const {session,state}=useSession(), context=state.context, slug=context?.slug ?? "";
  const scope=`${state.generation}:${slug}:${courseId}:${quizId}:authoring:${JSON.stringify(context?.user)}`;
  const result=useResource(session,scope,async c=>{
    const course=await getCourse(c,slug,courseId),sections=await listSections(c,slug,courseId),safe=await getQuiz(c,slug,courseId,quizId);
    if(!context?.user || !canAuthor(context.user,course,sections,safe.sectionId)) throw new ApiHttpError(403);
    const quiz=await getQuizAuthoringView(c,slug,courseId,quizId);
    if(!canAuthor(context.user,course,sections,quiz.sectionId)) throw new ApiHttpError(403);
    const groups=quiz.status==="draft" ? await listEvaluationGroups(c,slug,courseId) : undefined;
    return {course,sections,quiz,groups};
  });
  if(!context?.user) return <LoadingState/>;
  if(result.error) return <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/>;
  if(!result.data) return <LoadingState/>;
  return <AuthoringForm key={scope} {...result.data} listQuery={listQuery}/>;
}
function AuthoringForm({course,sections,quiz,groups,listQuery}:{course:Awaited<ReturnType<typeof getCourse>>;sections:Awaited<ReturnType<typeof listSections>>;quiz:Authoring;groups?:EvaluationGroup[];listQuery:string}) {
  const {session,state}=useSession(), {slug,user}=state.context!;
  const [saved,setSaved]=useState(quiz),[observed,setObserved]=useState<Authoring>(),[revision,setRevision]=useState(0),[publishing,setPublishing]=useState(false);
  const mutation = useMutation(session);
  const draft = useQuizDraft(mutation, saved);
  const dirty = draft.form.dirty;
  const permitted=(q:Authoring)=>!!user && canAuthor(user,course,sections,q.sectionId);
  const immutable=saved.status === "published" || observed?.status === "published";
  const blocked=immutable || mutation.busy || mutation.uncertain || publishing || !!observed;
  function accept(next: Authoring) {
    if (!permitted(next)) {
      void session.loadContext(slug);
      throw new ApiHttpError(403);
    }
    setPublishing(false);
    setSaved(next);
    setObserved(undefined);
    setRevision(previous => previous + 1);
    draft.reset(next);
  }

  const save: ComponentProps<typeof QuizDraftForm>["save"] = async (values, current) => {
    if (!permitted(saved) || !canAuthor(user!, course, sections, values.sectionId ?? null))
      throw new FieldError("sectionId", "Selecciona un destinatario de tu alcance docente.");
    const body = quizInput(quizDraftChanges(values, saved), saved);
    const next = await session.request(c => updateQuiz(c, slug, saved, body), current);
    if (current()) accept(next);
    return "Quiz actualizado.";
  };

  async function reconcile(current: () => boolean) {
    const next = await session.request(c => getQuizAuthoringView(c, slug, course.id, saved.id), current);
    if (!permitted(next)) {
      await session.loadContext(slug);
      return "Acceso revocado.";
    }
    if (current()) setObserved(next);
    return "Estado consultado. Revisa la versión recibida; tu texto local no fue reemplazado.";
  }
  return <QuizWorkspace course={course} user={user!} title={saved.title} authoring>
    <Link className="text-link quiz-back" href={`/courses/${course.id}/quizzes/${saved.id}${listQuery}`}><ArrowLeft size={16} aria-hidden="true"/>Volver al detalle del quiz</Link>
    <QuizLeaveGuard active={dirty || mutation.busy || !!mutation.uncertain || publishing}/>
    <QuizPublish key={saved.id + saved.status} session={session} slug={slug} quiz={saved} destination={saved.sectionId ? `Sección ${sections.find(s=>s.id===saved.sectionId)?.code}` : "Todo el curso"} disabled={dirty || !!mutation.uncertain || mutation.busy || !!observed} onSaved={accept} onLock={setPublishing}
      status={<div className="quiz-chips"><QuizStatus status={immutable ? "published" : "draft"}/><span className="hint" role="status">{!immutable && dirty ? "Cambios sin guardar" : ""}</span></div>}
      saveAction={!immutable && <QuizDraftSave form={draft.id} busy={mutation.busy} blocked={!!blocked || !dirty}/>}/>
    <QuizDraftForm draft={draft} label="Editar quiz" blocked={!!blocked} revision={revision} groups={groups}
      sections={destinations(user!, course, sections)} wholeCourse={canAuthor(user!, course, sections, null)}
      save={save} reconcile={reconcile}/>
    {observed && <section className="notice stack"><h2 className="serif">Estado recibido: {observed.status === "published" ? "Publicado" : "Borrador"}</h2><p>Hay una versión recibida tras conflicto o resultado incierto. Tu formulario permanece separado. No hay fusión automática.</p><button type="button" className="btn btn-ghost" onClick={()=>accept(observed)}>Descartar cambios locales y cargar versión recibida</button></section>}
  </QuizWorkspace>;
}
