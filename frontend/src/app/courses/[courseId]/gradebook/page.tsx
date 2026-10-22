import { CourseGradebook } from '../../../../components/gradebook/course-gradebook.tsx';
export default async function Page({ params }: Readonly<{
    params: Promise<{
        courseId: string;
    }>;
}>) {
    const { courseId } = await params;
    return <CourseGradebook courseId={courseId}/>;
}
