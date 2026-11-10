import { QuizList } from "../../../../components/quizzes/quiz-list.tsx";
import { quizListLocation, type QuizSearchParams } from "../../../../lib/quizzes/list-location.ts";

export default async function Page({ params, searchParams }: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<QuizSearchParams>;
}) {
  return <QuizList {...await params} {...quizListLocation(await searchParams)}/>;
}
