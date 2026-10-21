import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ProtectedInstitution } from "../../../components/auth/protected-institution.tsx";
import { isInstitutionSlug } from "../../../lib/institution-routes.ts";

export default async function InstitutionLayout({ children, params }: Readonly<{
  children: ReactNode;
  params: Promise<{ institutionSlug: string }>;
}>) {
  const { institutionSlug } = await params;
  if (!isInstitutionSlug(institutionSlug)) notFound();

  return <ProtectedInstitution key={institutionSlug} slug={institutionSlug}>{children}</ProtectedInstitution>;
}
