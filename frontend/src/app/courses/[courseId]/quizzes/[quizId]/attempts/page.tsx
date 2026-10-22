import {AttemptList} from '../../../../../../components/attempts/attempt-list.tsx';
export default async function Page({params}:{params:Promise<{courseId:string;quizId:string}>}){return <AttemptList {...await params}/>;}
