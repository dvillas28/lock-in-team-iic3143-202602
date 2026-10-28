"use client";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { AcademicMarkdown } from "./academic-markdown.tsx";
import { useSession } from "../auth/session-provider.tsx";
import { useResource } from "../courses/use-resource.ts";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { getCourseModule } from "../../lib/api/modules.ts";
import { getMaterial } from "../../lib/api/materials.ts";
export function MaterialReader({ courseId, moduleId, materialId }: { courseId: string; moduleId: string; materialId: string }) {
  const { session, state } = useSession();
  const slug = state.context?.slug ?? "";
  const result = useResource(session, `${state.generation}:${slug}:${courseId}:${moduleId}:${materialId}`, async client => {
    const parent = await getCourseModule(client, slug, moduleId, courseId);
    const item = await getMaterial(client, slug, materialId, moduleId);
    return { parent, item };
  });
  if (!state.context?.user) return <LoadingState />;
  if (result.error) return <ErrorState feedback={result.error} onRetry={() => void result.reload()} />;
  if (!result.data) return <LoadingState />;
  return <article className="material-reader stack">
    <Link className="reader-return" href={`/courses/${courseId}/modules#module-${moduleId}`}><ArrowLeft size={16} aria-hidden="true" />Volver a módulos · {result.data.parent.title}</Link>
    <header className="reader-heading"><p className="section-label"><FileText size={16} aria-hidden="true" />{result.data.parent.title}</p><h1 className="serif">{result.data.item.title}</h1><span className="chip">{result.data.item.publishedAt ? "Publicado" : "Borrador"}</span></header>
    <div className="card reader-paper">{result.data.item.markdownBody.trim() ? <AcademicMarkdown source={result.data.item.markdownBody} /> : <p role="status">Este material aún no tiene contenido.</p>}</div>
  </article>;
}
