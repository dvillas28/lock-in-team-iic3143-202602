import {StudentGrades} from '../../../../components/gradebook/student-grades.tsx';
export default async function Page({params}:{params:Promise<{courseId:string}>}){const {courseId}=await params;return <StudentGrades courseId={courseId}/>;}
