import { AttemptReview } from '../../../../../../../components/attempts/attempt-review.tsx';
export default async function Page({ params }: Readonly<{
    params: Promise<{
        courseId: string;
        quizId: string;
        attemptId: string;
    }>;
}>) {
    return <AttemptReview {...await params}/>;
}
