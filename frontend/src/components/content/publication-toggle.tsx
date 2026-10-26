"use client";
import { Circle, CircleCheck } from "lucide-react";
import type { Session } from "../../lib/auth/session.ts";
import { setModulePublication, getCourseModule } from "../../lib/api/modules.ts";
import { setMaterialPublication, getMaterial } from "../../lib/api/materials.ts";
import { useMutation } from "../courses/use-mutation.ts";
export function PublicationToggle({session, slug, kind, id, parentId, title, published, onSaved, disabled = false}: {
  session: Session; slug: string; kind: "module" | "material"; id: string; parentId: string; title: string; published: boolean;
  onSaved: () => Promise<boolean | undefined>; disabled?: boolean;
}) {
  const mutation = useMutation(session);
  const label = kind === "module" ? "módulo" : "material";
  function toggle() {
    if (disabled || mutation.busy || mutation.uncertain) return;
    void mutation.run(async current => {
      await session.request(async c => kind === "module" ? await setModulePublication(c, slug, id, parentId, !published) : await setMaterialPublication(c, slug, id, parentId, !published), current);
      if (!current()) return;
      const refreshed = await onSaved();
      const message = `${kind === "module" ? "Módulo" : "Material"} ${published ? "ocultado" : "publicado"}.`;
      return refreshed ? message : `${message} No se pudo actualizar la consulta; reintenta solo la lectura.`;
    }, async current => {
      await session.request(async c => kind === "module" ? await getCourseModule(c, slug, id, parentId) : await getMaterial(c, slug, id, parentId), current);
      if (!current()) return "Contexto cambiado.";
      const refreshed = await onSaved();
      if (!refreshed) return "No se pudo actualizar la consulta. Revisión manual pendiente.";
      return "Se consultó la publicación actual. Revisa antes de repetir.";
    });
  }
  return <div className="publication-control">
    <button type="button" className={`btn btn-ghost${published ? " is-published" : ""}`} aria-label={`${published ? "Ocultar" : "Publicar"} ${label} ${title}`} aria-pressed={published} aria-disabled={disabled || mutation.busy || !!mutation.uncertain} onClick={toggle}>
      {published ? <CircleCheck size={18} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}
      {published ? "Publicado" : "Borrador"}
    </button>
    {mutation.message && <p role={mutation.confirmed ? "status" : "alert"}>{mutation.message}</p>}
  </div>;
}
