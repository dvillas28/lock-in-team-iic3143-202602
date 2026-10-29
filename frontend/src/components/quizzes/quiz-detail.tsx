"use client";
import { QuizWorkspace } from "./quiz-workspace.tsx";
import { QuizFacts, QuizStatus } from "./quiz-facts.tsx";
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
import { ErrorState, LoadingState } from "../route-states.tsx";
export function QuizDetail({courseId,quizId}:{courseId:string;quizId:string}) {
  const {session,state}=useSession(), context=state.context, slug=context?.slug ?? "";
  const result=useResource(session,`${state.generation}:${slug}:${courseId}:${quizId}:safe:${JSON.stringify(context?.user)}`,async c=>{
    const course=await getCourse(c,slug,courseId),sections=await listSections(c,slug,courseId),quiz=await getQuiz(c,slug,courseId,quizId);
    if(quiz.sectionId !== null && !sections.some(s=>s.id===quiz.sectionId)) throw new ApiResponseError();
    return {course,sections,quiz};
  });
  if(!context?.user) return <LoadingState/>;
  if(result.error) return <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/>;
  if(!result.data) return <LoadingState/>;
  const {course,sections,quiz}=result.data, author=canAuthor(context.user,course,sections,quiz.sectionId);
  return <QuizWorkspace course={course} user={context.user} title={quiz.title}>
    <Link className="text-link" href={`/courses/${courseId}/quizzes`}>Volver a quizzes</Link>
    <section className="card panel stack quiz-summary" aria-label="Información del quiz">
      <div className="quiz-section-heading"><h2>Información del quiz</h2><div className="quiz-chips"><QuizStatus status={quiz.status}/><span className="chip">{quiz.sectionId ? `Sección ${sections.find(s=>s.id===quiz.sectionId)?.code}` : "Todo el curso"}</span></div></div>
      <QuizFacts quiz={quiz}/>
      <div><h3 className="serif">Instrucciones</h3><p className="quiz-instructions">{quiz.instructions?.trim() ? quiz.instructions : "Este quiz no tiene instrucciones adicionales."}</p></div>
      {(author || gradebookCapabilities(context.user,course).book) && <div className="actions">
        {author && <Link className="btn btn-primary" prefetch={false} href={`/courses/${courseId}/quizzes/${quizId}/authoring`}><Pencil size={16} aria-hidden="true"/>{quiz.status==="draft" ? "Editar quiz" : "Ver pauta"}</Link>}
        {gradebookCapabilities(context.user,course).book && <Link className="btn btn-ghost" href={`/courses/${courseId}/quizzes/${quizId}/attempts`}><ClipboardList size={16} aria-hidden="true"/>Consultar intentos</Link>}
      </div>}
    </section>
    {author && <p className="notice">El acceso a la pauta impide rendir este quiz, aunque también participes como estudiante.</p>}
    <AttemptStart key={`${state.generation}:${slug}:${quizId}:${JSON.stringify(context.user)}`} session={session} slug={slug} user={context.user} course={course} quiz={quiz} sections={sections}/>
    <section className="stack" aria-labelledby="quiz-preview-heading"><div className="quiz-section-heading"><h2 id="quiz-preview-heading" className="serif">Preguntas del quiz</h2><span className="hint tnum">{quiz.questions.length} {quiz.questions.length===1 ? "pregunta" : "preguntas"}</span></div>
      {!quiz.questions.length && <p className="notice">Este borrador todavía no tiene preguntas.</p>}
      <ol className="stack quiz-preview-list">{quiz.questions.map((q,i)=><li className="card panel stack" key={q.id}><div className="quiz-section-heading"><h3 className="serif">Pregunta {i+1}</h3><span className="chip tnum">{q.points} {q.points===1 ? "punto" : "puntos"}</span></div><p className="quiz-instructions">{q.prompt}</p><ol className="quiz-preview-alternatives">{q.alternatives.map(a=><li key={a.id}>{a.text}</li>)}</ol></li>)}</ol>
    </section>
  </QuizWorkspace>;
}
