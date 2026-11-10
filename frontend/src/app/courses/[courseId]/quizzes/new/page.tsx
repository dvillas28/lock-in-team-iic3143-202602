import { QuizCreate } from "../../../../../components/quizzes/quiz-create.tsx";
import { quizListLocation, type QuizSearchParams } from "../../../../../lib/quizzes/list-location.ts";

export default async function Page({ params, searchParams }: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<QuizSearchParams>;
}) {
  const { filters } = quizListLocation(await searchParams);
  return <QuizCreate {...await params} filters={filters}/>;
}
