import { useId, useState } from "react";
import type { EvaluationGroup } from "../../lib/api/assignments.ts";

export function EvaluationGroupField({groups, value, kind}:{
  groups: EvaluationGroup[]; value?: string | null; kind: "Quizzes" | "Tareas";
}) {
  const id = useId();
  const [selection,setSelection] = useState(value ?? "");
  const selected = groups.find(g=>g.id===selection);
  return <div className="stack">
    <label className="field-label" htmlFor={id}>Grupo de evaluación</label>
    <select id={id} name="groupId" className="field" value={selection} onChange={e=>setSelection(e.target.value)} aria-describedby={`${id}-hint`}>
      <option value="">Grupo predeterminado de {kind.toLocaleLowerCase("es")}</option>
      {groups.map(group=><option key={group.id} value={group.id}>{group.title} ({group.weightPercent} %)</option>)}
    </select>
    <p className="hint" id={`${id}-hint`}>{selected?.weightPercent===0
      ? "Este grupo tiene 0 % de ponderación. La evaluación no contribuirá al promedio hasta que se configure su peso."
      : selection ? "El grupo determina la ponderación en el libro de notas."
      : "AcademiX reutiliza el grupo predeterminado o lo crea al guardar."}</p>
  </div>;
}
