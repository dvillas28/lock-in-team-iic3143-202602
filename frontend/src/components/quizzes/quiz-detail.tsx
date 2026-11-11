"use client";
import { QuizWorkspace } from "./quiz-workspace.tsx";
import { QuizFacts, QuizPhaseChip } from "./quiz-facts.tsx";
import { useEffect, useState } from "react";
import { ContentNotices, useContentNotice } from "../content/content-notices.tsx";
import { quizPublicationReceipt } from "./quiz-created-receipt.ts";
import { quizPhase } from "../../lib/quizzes/publication.ts";
import { ClipboardList, Pencil } from "lucide-react";
import Link from "next/link";
import {gradebookCapabilities} from '../../lib/gradebook/capabilities.ts';
import {AttemptStart} from "../attempts/attempt-start.tsx";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { getQuiz } from "../../lib/api/quizzes.ts";
import { canAuthor } from "../../lib/quizzes/capabilities.ts";
import { ApiResponseError } from "../../lib/api/errors.ts";
import { ErrorState } from "../route-states.tsx";
import { QuizSkeleton } from "./quiz-skeleton.tsx";
export function QuizDetail(props:{courseId:string;quizId:string;listQuery?:string}) {
  return <ContentNotices><QuizDetailView {...props}/></ContentNotices>;
}
function QuizDetailView({courseId,quizId,listQuery=""}:{courseId:string;quizId:string;listQuery?:string}) {
  const {session,state}=useSession(), context=state.context, slug=context?.slug ?? "";
  const notify=useContentNotice(), [now]=useState(Date.now);
  const result=useResource(session,`${state.generation}:${slug}:${courseId}:${quizId}:safe:${JSON.stringify(context?.user)}`,async c=>{
    const course=await getCourse(c,slug,courseId),sections=await listSections(c,slug,courseId),quiz=await getQuiz(c,slug,courseId,quizId);
    if(quiz.sectionId !== null && !sections.some(s=>s.id===quiz.sectionId)) throw new ApiResponseError();
    return {course,sections,quiz};
  });
  const loaded=!!result.data;
  useEffect(()=>{
    const receipt=quizPublicationReceipt(session,courseId);
    if(!loaded || !notify || !receipt || receipt.id!==quizId || receipt.announced) return;
    receipt.announced=true;
    notify("Quiz publicado.");
  },[loaded,notify,session,courseId,quizId]);
  if(!context?.user) return <QuizSkeleton kind="detail"/>;
  if(result.error) return <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/>;
  if(!result.data) return <QuizSkeleton kind="detail"/>;
  const {course,sections,quiz}=result.data, author=canAuthor(context.user,course,sections,quiz.sectionId);
  const student=!author && context.user.sectionMemberships.some(m=>m.courseId===course.id && m.role==="student");
  return <QuizWorkspace course={course} user={context.user} title={quiz.title}>
    <Link className="text-link" href={`/courses/${courseId}/quizzes${listQuery}`}>Volver a quizzes</Link>
    <section className="card panel stack quiz-summary" aria-label="Información del quiz">
      <div className="quiz-section-heading"><h2>Información del quiz</h2><div className="quiz-chips"><QuizPhaseChip phase={quizPhase(quiz,now)}/><span className="chip">{quiz.sectionId ? `Sección ${sections.find(s=>s.id===quiz.sectionId)?.code}` : "Todo el curso"}</span></div></div>
      <QuizFacts quiz={quiz}/>
      <div><h3 className="serif">Instrucciones</h3><p className="quiz-instructions">{quiz.instructions?.trim() ? quiz.instructions : "Este quiz no tiene instrucciones adicionales."}</p></div>
      {(author || gradebookCapabilities(context.user,course).book) && <div className="actions">
        {author && <Link className="btn btn-primary" prefetch={false} href={`/courses/${courseId}/quizzes/${quizId}/authoring${listQuery}`}><Pencil size={16} aria-hidden="true"/>{quiz.status==="draft" ? "Editar quiz" : "Ver pauta"}</Link>}
        {gradebookCapabilities(context.user,course).book && <Link className="btn btn-ghost" href={`/courses/${courseId}/quizzes/${quizId}/attempts`}><ClipboardList size={16} aria-hidden="true"/>Consultar intentos</Link>}
      </div>}
    </section>
    <AttemptStart key={`${state.generation}:${slug}:${quizId}:${JSON.stringify(context.user)}`} session={session} slug={slug} user={context.user} course={course} quiz={quiz} sections={sections}/>
    {!student && <section className="stack" aria-labelledby="quiz-preview-heading"><div className="quiz-section-heading"><h2 id="quiz-preview-heading" className="serif">Preguntas del quiz</h2><span className="hint tnum">{quiz.questions.length} {quiz.questions.length===1 ? "pregunta" : "preguntas"}</span></div>
      {!quiz.questions.length && <p className="notice">Este borrador todavía no tiene preguntas.</p>}
      <ol className="stack quiz-preview-list">{quiz.questions.map((q,i)=><li className="card panel stack" key={q.id}><div className="quiz-section-heading"><h3 className="serif">Pregunta {i+1}</h3><span className="chip tnum">{q.points} {q.points===1 ? "punto" : "puntos"}</span></div><p className="quiz-instructions">{q.prompt}</p><ol className="quiz-preview-alternatives">{q.alternatives.map(a=><li key={a.id}>{a.text}</li>)}</ol></li>)}</ol>
    </section>}
  </QuizWorkspace>;
}
