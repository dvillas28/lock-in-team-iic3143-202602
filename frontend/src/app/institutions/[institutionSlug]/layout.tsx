import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { InstitutionShell } from "../../../components/institutions/institution-shell.tsx";
import { isInstitutionSlug } from "../../../lib/institution-routes.ts";

export default async function InstitutionLayout({ children, params }: Readonly<{
  children: ReactNode;
  params: Promise<{ institutionSlug: string }>;
}>) {
  const { institutionSlug } = await params;
  if (!isInstitutionSlug(institutionSlug)) notFound();

  // Structural public shell only. Membership and private data require the future session integration.
  return <InstitutionShell key={institutionSlug} institutionSlug={institutionSlug}>{children}</InstitutionShell>;
}
