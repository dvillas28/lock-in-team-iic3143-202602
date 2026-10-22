import { QuizDetail } from "../../../../../components/quizzes/quiz-detail.tsx";
export default async function Page({params}:{params:Promise<{courseId:string;quizId:string}>}){const values=await params;return <QuizDetail {...values}/>;}
