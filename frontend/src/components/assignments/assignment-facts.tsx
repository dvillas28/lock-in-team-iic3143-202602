import { assignmentState, displayChile } from "../../lib/assignments/dates.ts";
import type { Assignment } from "../../lib/api/assignments.ts";

const availability = {
  upcoming:["Próxima","chip-primary"], open:["Disponible","chip-success"],
  late:["Atrasada","chip-warning"], closed:["Cerrada",""],
};
const publication = {draft:"Borrador", published:"Publicada", hidden:"Oculta"};
const staffTiming = {upcoming:"Por comenzar", open:null, late:"Plazo vencido", closed:"Recepción cerrada"};
export const points = new Intl.NumberFormat("es-CL",{maximumFractionDigits:2});

const staffTone = {upcoming:"chip-primary", open:"chip-success", late:"chip-warning", closed:""};

// Lists show one chip per row: publication for drafts and hidden tasks,
// otherwise the reception timing that teachers act on.
export function AssignmentStatus({item,now,staff,compact}:{item:Assignment;now:number;staff:boolean;compact?:boolean}) {
  const published = item.status==="published";
  const state = assignmentState(item,now);
  if (compact && staff) {
    const label = published ? staffTiming[state] ?? publication.published : publication[item.status];
    const tone = published ? staffTone[state] : "";
    return <span className={tone ? `chip ${tone}` : "chip"}>{label}</span>;
  }
  if (staff || !published) {
    return <div className="quiz-chips assignment-status">
      <span className={published ? "chip chip-success" : "chip"}>{publication[item.status]}</span>
      {published && staffTiming[state] && <span className="hint">{staffTiming[state]}</span>}
    </div>;
  }
  const [label,tone] = availability[state];
  return <span className={tone ? `chip ${tone}` : "chip"}>{label}</span>;
}

export function ChileDate({value,empty,showOffset}:{value:string|null;empty:string;showOffset?:boolean}) {
  return value ? <time dateTime={value}>{displayChile(value,showOffset)}</time> : <>{empty}</>;
}
