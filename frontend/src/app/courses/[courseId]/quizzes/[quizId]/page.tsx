import { QuizDetail } from "../../../../../components/quizzes/quiz-detail.tsx";
import { quizListLocation, quizListQuery, type QuizSearchParams } from "../../../../../lib/quizzes/list-location.ts";

export default async function Page({ params, searchParams }: {
  params: Promise<{ courseId: string; quizId: string }>;
  searchParams: Promise<QuizSearchParams>;
}) {
  const { filters } = quizListLocation(await searchParams);
  return <QuizDetail {...await params} listQuery={quizListQuery(filters)}/>;
}
