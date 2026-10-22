import { QuizList } from "../../../../components/quizzes/quiz-list.tsx";
export default async function Page({params}:{params:Promise<{courseId:string}>}){const values=await params;return <QuizList {...values}/>;}
