import { CourseDetail } from "../../../../components/courses/course-detail.tsx";
export default async function SectionsPage({params}:{params:Promise<{courseId:string}>}){const {courseId}=await params;return <CourseDetail courseId={courseId} sections/>;}
