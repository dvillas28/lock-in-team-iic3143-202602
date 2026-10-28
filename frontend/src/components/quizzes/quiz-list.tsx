"use client";
import { CourseNavigation } from "../courses/course-navigation.tsx";
import { ClipboardList, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {KnownAttemptLink} from "../attempts/attempt-start.tsx";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import { listCourseQuizzes } from "../../lib/api/quizzes.ts";
import { ApiResponseError } from "../../lib/api/errors.ts";
import { EmptyState, ErrorState, LoadingState } from "../route-states.tsx";
import { QuizCreate } from "./quiz-create.tsx";
export function QuizList({courseId}:{courseId:string}) {
  const {session,state}=useSession(), context=state.context, slug=context?.slug ?? "";
  const scope=`${state.generation}:${slug}:${courseId}:${JSON.stringify(context?.user)}`;
  const result=useResource(session,scope,async c=>{
    const course=await getCourse(c,slug,courseId), sections=await listSections(c,slug,courseId), items=await listCourseQuizzes(c,slug,courseId);
    if(items.some(q=>q.sectionId !== null && !sections.some(s=>s.id===q.sectionId))) throw new ApiResponseError();
    return {course,sections,items};
  },true);
  if(!context?.user) return <LoadingState/>;
  if(!result.data) return result.error ? <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/> : <LoadingState/>;
  const {course,sections,items}=result.data;
  return <div className="stack"><Link href={`/courses/${courseId}`}>Volver al curso</Link><h1 className="serif">Quizzes · {course.name}</h1><CourseNavigation course={course} user={context.user} active="/quizzes" />
    {result.error && <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/>}
    <ul className="stack quiz-resource-list">{items.map(q=><li className="card quiz-resource-row" key={q.id}><ClipboardList size={20} aria-hidden="true" /><div><Link href={`/courses/${courseId}/quizzes/${q.id}`}>{q.title}</Link><p>{q.status === "draft" ? "Borrador" : "Publicado"} · {q.sectionId ? `Sección ${sections.find(s=>s.id===q.sectionId)?.code}` : "Todo el curso"}</p></div><ArrowUpRight size={16} aria-hidden="true" /></li>)}</ul>
    {!items.length && !result.error && <EmptyState/>}
    <KnownAttemptLink key={scope+":known"}/>
    <QuizCreate key={scope} session={session} slug={slug} user={context.user} course={course} sections={sections} onSaved={result.reload}/>
  </div>;
}
