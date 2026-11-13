import type { ReactNode } from "react";
import { ProtectedInstitution } from "../../components/auth/protected-institution.tsx";

export default function CalendarLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <ProtectedInstitution>{children}</ProtectedInstitution>;
}
