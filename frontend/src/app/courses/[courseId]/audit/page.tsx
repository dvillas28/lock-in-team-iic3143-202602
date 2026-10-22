import { CourseAudit } from '../../../../components/audit/course-audit.tsx';
export default async function Page({ params }: Readonly<{
    params: Promise<{
        courseId: string;
    }>;
}>) {
    const { courseId } = await params;
    return <CourseAudit courseId={courseId}/>;
}
