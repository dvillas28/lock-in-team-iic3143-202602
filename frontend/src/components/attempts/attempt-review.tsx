"use client";
import Link from 'next/link';
import { useSession } from '../auth/session-provider.tsx';
import { useResource } from '../courses/use-resource.ts';
import { getCourse } from '../../lib/api/courses.ts';
import { getQuiz } from '../../lib/api/quizzes.ts';
import { getAttemptReview } from '../../lib/api/attempts.ts';
import { gradebookCapabilities } from '../../lib/gradebook/capabilities.ts';
import { attemptCapabilities } from '../../lib/attempts/capabilities.ts';
import { ApiHttpError, ApiResponseError } from '../../lib/api/errors.ts';
import { LoadingState, ErrorState } from '../route-states.tsx';
export function AttemptReview({ courseId, quizId, attemptId }: Readonly<{
    courseId: string;
    quizId: string;
    attemptId: string;
}>) {
    const { session, state } = useSession(), context = state.context, slug = context?.slug ?? '';
    const r = useResource(session, `${state.generation}:${JSON.stringify(context)}:${courseId}:${quizId}:${attemptId}`, async (c) => {
        const course = await getCourse(c, slug, courseId);
        if (!context?.user || !gradebookCapabilities(context.user, course).book) {
            throw new ApiHttpError(403);
        }
        const quiz = await getQuiz(c, slug, courseId, quizId), attempt = await getAttemptReview(c, slug, attemptId, context.user, course, quiz);
        if (attempt.answers.some(a => !quiz.questions.some(q => q.id === a.questionId && q.alternatives.some(x => x.id === a.alternativeId)))) {
            throw new ApiResponseError();
        }
        return { course, quiz, attempt };
    });
    if (!context?.user) {
        return <LoadingState />;
    }
    if (r.error) {
        return <ErrorState feedback={r.error} onRetry={() => void r.reload()}/>;
    }
    if (!r.data) {
        return <LoadingState />;
    }
    const { course, quiz, attempt: a } = r.data, cap = attemptCapabilities(context.user, course, quiz, a);
    return <div className="stack"><Link href={`/courses/${courseId}/quizzes/${quizId}/attempts`}>Volver a intentos</Link><h1>Revisión de intento {a.attemptNumber}</h1><p>{a.status} · Sección histórica: {a.sectionId} · Estudiante: {a.studentId}</p><p className="tnum">Nota: {a.grade ?? 'No disponible en esta vista'} · Resultado: {a.scorePercent ?? 'No disponible'}{a.scorePercent !== undefined && a.scorePercent !== null ? ' %' : ''}</p>
 <div className="table-scroll"><table className="data-table"><caption>Respuestas autorizadas del intento</caption><thead><tr><th scope="col">Pregunta</th><th scope="col">Alternativa</th>{cap.teacher && <th scope="col">Corrección entregada</th>}</tr></thead><tbody>{a.answers.map(x => {
        const q = quiz.questions.find(q => q.id === x.questionId)!, correction = x.isCorrect ? 'Correcta' : 'Incorrecta';
        return <tr key={x.questionId}><th scope="row">{q.prompt}</th><td>{q.alternatives.find(a => a.id === x.alternativeId)!.text}</td>{cap.teacher && <td className="tnum">{x.isCorrect === undefined ? 'No disponible' : `${correction} · ${x.pointsAwarded} puntos`}</td>}</tr>;
    })}</tbody></table></div>
 {cap.teacher && cap.cancel && <Link href={`/attempts/${a.id}`}>Abrir cancelación autorizada</Link>}</div>;
}
