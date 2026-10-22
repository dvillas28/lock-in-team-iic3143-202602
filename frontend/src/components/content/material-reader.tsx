"use client";
import Link from "next/link";
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
  return <article className="stack">
    <Link href={`/courses/${courseId}/modules#module-${moduleId}`}>Volver a módulos · {result.data.parent.title}</Link>
    <h1 className="serif">{result.data.item.title}</h1>
    <p className="hint">Contenido markdown</p>
    <div className="card panel markdown-source">{result.data.item.markdownBody}</div>
  </article>;
}
