export const academicDemoVersion = "demo-academic-v1";
export const academicDemoManifest = ["uc", "utfsm"].map((slug, index) => ({
  slug,
  courseId: `31000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  sectionId: `32000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  code: `DEMO-${slug.toUpperCase()}-101`,
  name: `Curso de demostración ${slug.toUpperCase()}`,
  term: "DEMO",
  sectionCode: "1",
  capacity: 30,
  teacherRole: "teacher" as const,
  studentRole: "student" as const,
  enrollmentActive: true,
  teacherId: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  studentId: "10000000-0000-4000-8000-000000000003",
  teacherEnrollmentId: `33000000-0000-4000-8000-${String(index * 2 + 1).padStart(12, "0")}`,
  studentEnrollmentId: `33000000-0000-4000-8000-${String(index * 2 + 2).padStart(12, "0")}`,
}));
