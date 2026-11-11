import { CourseRouteLoading } from "../../../components/courses/course-route-loading.tsx";

// Shown when the course section (Módulos, Quizzes, Tareas…) changes; detail routes keep their state.
export default function Loading() {
  return <CourseRouteLoading />;
}
