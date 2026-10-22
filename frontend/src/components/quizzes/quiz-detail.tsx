"use client";
import Link from "next/link";
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
  return <div className="stack"><Link href={`/courses/${courseId}/quizzes`}>Volver a quizzes</Link><h1 className="serif">{quiz.title}</h1>
    <p>{quiz.status === "draft" ? "Borrador" : "Publicado"} · {quiz.sectionId ? `Sección ${sections.find(s=>s.id===quiz.sectionId)?.code}` : "Todo el curso"}</p>
    <p className="markdown-source">{quiz.instructions}</p><p>Apertura: {quiz.opensAt ?? "Sin límite"} · Cierre: {quiz.closesAt ?? "Sin límite"} · Intentos: {quiz.maxAttempts ?? "Ilimitados"}</p>
    {author && <><Link prefetch={false} href={`/courses/${courseId}/quizzes/${quizId}/authoring`}>Abrir autoría y pauta</Link><p className="notice">El acceso autorizado a pauta impide rendir este quiz, incluso con rol student.</p></>}
    <ol className="stack">{quiz.questions.map(q=><li className="panel stack" key={q.id}><h2 className="serif">{q.prompt}</h2><p className="tnum">{q.points} puntos</p><ul>{q.alternatives.map(a=><li key={a.id}>{a.text}</li>)}</ul></li>)}</ol>
  </div>;
}
