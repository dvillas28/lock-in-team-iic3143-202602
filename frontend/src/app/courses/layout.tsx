import type { ReactNode } from "react";
import { ProtectedInstitution } from "../../components/auth/protected-institution.tsx";

export default function CoursesLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <ProtectedInstitution>{children}</ProtectedInstitution>;
}
