"use client";
import { ArrowLeft } from "lucide-react";
import { QuizWorkspace } from "../quizzes/quiz-workspace.tsx";
import { AttemptReference, AttemptStatus } from "./attempt-facts.tsx";
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
    return <QuizWorkspace course={course} user={context.user} title={`Revisión de intento ${a.attemptNumber}`}><div className="stack attempt-workspace"><Link className="text-link attempt-back" href={`/courses/${courseId}/quizzes/${quizId}/attempts`}><ArrowLeft size={16} aria-hidden="true"/>Volver a intentos</Link>
 <section className="card panel stack attempt-summary"><div className="quiz-section-heading"><h2 className="serif">{quiz.title}</h2><AttemptStatus status={a.status}/></div><dl className="quiz-facts"><div><dt>Nota</dt><dd className={a.grade == null ? "hint" : "grade-value tnum"}>{a.grade == null ? 'No disponible en esta vista' : a.grade.toFixed(1)}</dd></div><div><dt>Resultado</dt><dd className="tnum">{a.scorePercent == null ? 'No disponible' : `${a.scorePercent} %`}</dd></div><div><dt>Identificador del estudiante</dt><dd className="attempt-identifier">{a.studentId}</dd></div></dl><AttemptReference attempt={a}/></section>
 <section className="stack"><div className="quiz-section-heading"><h2 className="serif">Respuestas del intento</h2><span className="hint tnum">{a.answers.length} registradas</span></div>
 {!a.answers.length ? <p className="notice">Este intento no tiene respuestas registradas.</p> : <div className="table-scroll" role="region" aria-label="Tabla con desplazamiento horizontal" tabIndex={0}><table className="data-table attempt-table"><caption>Respuestas autorizadas del intento</caption><thead><tr><th scope="col">Pregunta</th><th scope="col">Alternativa</th>{cap.teacher && <th scope="col">Corrección entregada</th>}</tr></thead><tbody>{a.answers.map(x => {
        const q = quiz.questions.find(q => q.id === x.questionId)!, correction = x.isCorrect ? 'Correcta' : 'Incorrecta';
        return <tr className="row-hover" key={x.questionId}><th scope="row">{q.prompt}</th><td>{q.alternatives.find(a => a.id === x.alternativeId)!.text}</td>{cap.teacher && <td className="tnum">{x.isCorrect === undefined ? 'No disponible' : <><span className={`chip ${x.isCorrect?'chip-success':'chip-danger'}`}>{correction}</span><span className="grade-state">{x.pointsAwarded} puntos</span></>}</td>}</tr>;
    })}</tbody></table></div>}
 </section>{cap.teacher && cap.cancel && <section className="card panel stack"><h2 className="serif">Intento en progreso</h2><p className="hint">El estudiante aún puede modificar sus respuestas. Puedes abrir el intento para consultar su estado o cancelarlo.</p><Link className="btn btn-ghost" href={`/attempts/${a.id}`}>Abrir cancelación autorizada</Link></section>}</div></QuizWorkspace>;
}
