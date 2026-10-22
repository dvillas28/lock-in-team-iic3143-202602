import { QuizEditor } from "../../../../../../components/quizzes/quiz-editor.tsx";
export default async function Page({params}:{params:Promise<{courseId:string;quizId:string}>}){const values=await params;return <QuizEditor {...values}/>;}
