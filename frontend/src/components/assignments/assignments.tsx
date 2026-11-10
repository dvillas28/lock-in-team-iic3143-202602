"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, ClipboardList, Info, Plus } from "lucide-react";
import { useSession } from "../auth/session-provider.tsx";
import { ContentNotices, useContentNotice } from "../content/content-notices.tsx";
import { CourseNavigation } from "../courses/course-navigation.tsx";
import { useResource } from "../courses/use-resource.ts";
import { ErrorState, LoadingState } from "../route-states.tsx";
import { getCourse } from "../../lib/api/courses.ts";
import { listSections } from "../../lib/api/sections.ts";
import {
  createAssignment, getAssignment, listAssignments, listEvaluationGroups, publishAssignment, updateAssignment,
  type Assignment, type AssignmentCreate,
} from "../../lib/api/assignments.ts";
import { ApiHttpError } from "../../lib/api/errors.ts";
import { canAuthor, destinations } from "../../lib/quizzes/capabilities.ts";
import { getRouteFeedback } from "../../lib/route-feedback.ts";
import { dateBucket } from "../../lib/assignments/dates.ts";
import { AssignmentForm } from "./assignment-form.tsx";
import { AssignmentStatus, ChileDate, points } from "./assignment-facts.tsx";

type Route = {courseId:string;assignmentId?:string};
type Draft = Omit<AssignmentCreate,"idempotencyKey"|"confirmPastDue">;
type SaveOperation = {kind:"create";body:AssignmentCreate} | {kind:"edit";item:Assignment;body:Draft};
type Operation = SaveOperation | {kind:"visibility";item:Assignment;published:boolean};

export function Assignments(props:Route) {
  const {state} = useSession();
  const key = JSON.stringify([state.generation,state.context?.slug,state.context?.user,props.courseId,props.assignmentId]);
  return <ContentNotices key={key}><Workspace {...props} scope={key}/></ContentNotices>;
}

function Workspace({courseId,assignmentId,scope}:Route & {scope:string}) {
  const {session,state} = useSession(), user = state.context?.user, slug = state.context?.slug ?? "";
  const notify = useContentNotice();
  const [editing,setEditing] = useState(false), [busy,setBusy] = useState(false), [blocked,setBlocked] = useState(false);
  const [uncertain,setUncertain] = useState<{operation:Operation}>();
  const running = useRef(false), active = useRef(true), editTrigger = useRef<HTMLButtonElement>(null);
  const [now,setNow] = useState(()=>Date.now());
  useEffect(()=>{
    active.current = true;
    const timer = setInterval(()=>setNow(Date.now()),1000);
    return ()=>{active.current=false;clearInterval(timer);};
  },[]);
  const resource = useResource(session,scope,async c=>{
    const staff = user?.sectionMemberships.some(m=>m.courseId===courseId && m.role==="teacher");
    const [course,sections,groups,items] = await Promise.all([
      getCourse(c,slug,courseId), listSections(c,slug,courseId),
      staff ? listEvaluationGroups(c,slug,courseId) : [],
      assignmentId ? getAssignment(c,slug,courseId,assignmentId).then(item=>[item]) : listAssignments(c,slug,courseId),
    ]);
    return {course,sections,groups,items};
  });
  if (!user || !resource.data) return resource.error
    ? <ErrorState feedback={resource.error} onRetry={()=>void resource.reload()}/> : <LoadingState/>;
  const {course,sections,groups,items} = resource.data;
  const item = assignmentId ? items[0] : undefined;
  const allowed = destinations(user,course,sections), whole = canAuthor(user,course,sections,null);
  const staff = whole || allowed.length>0;
  const editAllowed = item ? item.canManage && canAuthor(user,course,sections,item.sectionId) : staff;
  const href = `/courses/${courseId}/assignments`;

  async function run(operation: Operation) {
    if (running.current) return;
    running.current = true;
    const context = session.getSnapshot().context;
    const current = () => active.current && context === session.getSnapshot().context;
    setBusy(true);
    try {
      await session.request(c=>{
        if (operation.kind==="create") return createAssignment(c,slug,courseId,operation.body);
        if (operation.kind==="edit") return updateAssignment(c,slug,courseId,operation.item.id,
          {...operation.body,expectedVersion:operation.item.version});
        return publishAssignment(c,slug,courseId,operation.item.id,operation.item.version,operation.published);
      },current);
      if (!current()) return;
      setEditing(false);
      setUncertain(undefined);
      const refreshed = await resource.reload();
      if (!current()) return;
      const message = operation.kind==="visibility" ? (operation.published ? "Tarea publicada." : "Tarea oculta.") :
        operation.body.publish ? "Tarea publicada." : operation.kind==="create" ? "Borrador creado." : "Tarea actualizada.";
      notify?.(refreshed ? message : `${message} Reintenta cargar la vista para ver los cambios.`);
    } catch (error) {
      if (!current()) return;
      if (error instanceof ApiHttpError && error.status<500) {
        setUncertain(undefined);
        if (error.status===409) {
          if (operation.kind==="edit") setBlocked(true);
          await resource.reload();
        }
        if ([401,403,404].includes(error.status)) await resource.reload();
        if (current()) notify?.(getRouteFeedback(error).message,"error");
      } else {
        setUncertain({operation});
        notify?.("El cambio quedó sin confirmar. Reintenta la misma operación.","error");
      }
    } finally {
      running.current = false;
      if (current()) setBusy(false);
    }
  }

  function save(draft?: Draft, publish = false) {
    if (!draft) {
      if (uncertain) void run(uncertain.operation);
      return;
    }
    const body = {...draft,publish};
    const operation: SaveOperation = item ? {kind:"edit",item,body} :
      {kind:"create",body:{...body,idempotencyKey:crypto.randomUUID()}};
    void run(operation);
  }
  function close() {
    if (uncertain) void resource.reload();
    setUncertain(undefined);
    setEditing(false);
    setBlocked(false);
    requestAnimationFrame(()=>editTrigger.current?.focus());
  }

  return <div className="stack academic-workspace assignment-workspace">
    <div className="page-heading"><div>
      <p className="section-label">{course.code} · {course.term}</p>
      <h1>{item?.title ?? "Tareas"}</h1>
      <p className="hint">{course.name}</p>
    </div></div>
    <CourseNavigation course={course} user={user} active="/assignments"/>
    {item && <Link className="text-link assignment-back" href={href}><ArrowLeft size={16} aria-hidden="true"/> Volver a Tareas</Link>}
    {resource.error && <ErrorState feedback={resource.error} onRetry={()=>void resource.reload()}/>}
    {editAllowed && !editing && <div className="actions">
      {uncertain?.operation.kind==="visibility" ? <button className="btn btn-primary" disabled={busy} onClick={()=>void run(uncertain.operation)}>Reintentar cambio de visibilidad</button> :
        <>
          <button ref={editTrigger} className={item ? "btn btn-ghost" : "btn btn-primary"} disabled={busy} onClick={()=>setEditing(true)}>
            {item ? "Editar tarea" : <><Plus size={16} aria-hidden="true"/>Nueva tarea</>}
          </button>
          {item && <button className="btn btn-primary" disabled={busy} onClick={()=>void run({kind:"visibility",item,published:item.status!=="published"})}>
            {busy ? "Actualizando…" : item.status==="published" ? "Ocultar tarea" : "Publicar tarea"}
          </button>}
        </>}
    </div>}
    {editAllowed && editing && <AssignmentForm assignment={item} groups={groups} sections={allowed} wholeCourse={whole}
      busy={busy} uncertain={!!uncertain} blocked={blocked} now={now} onSave={save} onCancel={close}/>}
    <div className={editing && editAllowed ? undefined : "stack"} hidden={editing && editAllowed}>
      {item ? <Detail item={item} now={now} staff={staff} section={sections.find(s=>s.id===item.sectionId)?.code}/> :
        <>
          {staff && groups.some(group=>group.weightPercent===0) && <aside className="notice assignment-weights">
            <Info size={18} aria-hidden="true"/>
            <p><strong>Grupos con 0 % de ponderación.</strong> Sus evaluaciones no contribuirán al promedio hasta que se configure su peso.</p>
            <Link className="text-link" href={`/courses/${courseId}/gradebook`}>Configurar ponderaciones</Link>
          </aside>}
          <Directory items={items} href={href} now={now} staff={staff}/>
        </>}
    </div>
  </div>;
}

const buckets = {late:"Atrasadas", upcoming:"Próximas", past:"Anteriores", undated:"Sin fecha"};
const searchKey = (value:string) => value.normalize("NFD").replace(/\p{M}/gu,"").toLocaleLowerCase("es");

function Directory({items,href,now,staff}:{items:Assignment[];href:string;now:number;staff:boolean}) {
  const [query,setQuery] = useState(""), [byGroup,setByGroup] = useState(staff);
  const visible = items.filter(i=>searchKey(i.title).includes(searchKey(query.trim())));
  const grouped = new Map<string,{title:string;items:Assignment[]}>();
  if (!byGroup) Object.entries(buckets).forEach(([id,title])=>grouped.set(id,{title:staff && id==="late" ? "Plazo vencido" : title,items:[]}));
  const date = (item:Assignment)=>Date.parse(item.dueAt ?? item.availableUntil ?? item.availableFrom ?? "") || Infinity;
  visible.sort((a,b)=>date(a)-date(b) || a.title.localeCompare(b.title,"es"));
  for (const item of visible) {
    const id = byGroup ? item.groupId : dateBucket(item,now);
    const section = grouped.get(id) ?? {title:item.groupTitle,items:[]};
    section.items.push(item);
    grouped.set(id,section);
  }
  return <>
    <div className="assignment-toolbar">
      <label className="field-label">Buscar por nombre<input className="field" type="search" value={query}
        onChange={e=>setQuery(e.target.value)} placeholder="Buscar tarea"/></label>
      <div className="tab-group" role="group" aria-label="Agrupar tareas">
        <button type="button" className={`tab-btn${!byGroup ? " active" : ""}`} aria-pressed={!byGroup} onClick={()=>setByGroup(false)}>Por fecha</button>
        <button type="button" className={`tab-btn${byGroup ? " active" : ""}`} aria-pressed={byGroup} onClick={()=>setByGroup(true)}>Por grupo</button>
      </div>
    </div>
    <p className="hint" role="status">{visible.length} {visible.length===1 ? "tarea" : "tareas"}</p>
    {!visible.length && <div className="empty-zone panel">
      <h2>{items.length ? "No hay coincidencias" : "Aún no hay tareas"}</h2>
      <p className="hint">{items.length ? "Prueba con otro nombre." : staff ? "Crea un borrador para organizar la primera actividad del curso." : "Las tareas publicadas de tu sección aparecerán aquí."}</p>
    </div>}
    {Array.from(grouped).filter(([,group])=>group.items.length).map(([key,group])=>
      <section key={key} className="card assignment-group">
        <header><h2 className="serif">{group.title}</h2>{byGroup && <span className="hint tnum">Ponderación: {points.format(group.items[0].weightPercent)} %</span>}</header>
        <ul className="assignment-list">{group.items.map(item=><li key={item.id}>
          <Link className="assignment-row" href={`${href}/${item.id}`}>
            <span className="course-icon"><ClipboardList size={18} aria-hidden="true"/></span>
            <div className="assignment-row-copy">
              <h3>{item.title}</h3>
              <p className="hint tnum">Entrega <ChileDate value={item.dueAt} empty="sin plazo"/>
                {item.availableFrom && <> · Abre <ChileDate value={item.availableFrom} empty=""/></>}
                {item.availableUntil && <> · Cierra <ChileDate value={item.availableUntil} empty=""/></>}
              </p>
            </div>
            <div className="assignment-row-meta"><AssignmentStatus item={item} now={now} staff={staff}/>
              <span className="hint tnum">{points.format(item.maxPoints)} pts</span></div>
            <ChevronRight className="assignment-chevron" size={16} aria-hidden="true"/>
          </Link>
        </li>)}</ul>
      </section>)}
  </>;
}

function Detail({item,now,section,staff}:{item:Assignment;now:number;section?:string;staff:boolean}) {
  return <>
    <section className="card panel stack assignment-detail" aria-label="Condiciones de la tarea">
      <header className="assignment-detail-heading">
        <div><p className="hint">{item.groupTitle} · {item.sectionId ? section ? `Sección ${section}` : "Sección asignada" : "Todo el curso"}</p>
          <AssignmentStatus item={item} now={now} staff={staff}/></div>
        <p className="assignment-points tnum"><strong>{points.format(item.maxPoints)}</strong> pts</p>
      </header>
      {item.canManage && item.weightPercent===0 && <p className="notice assignment-warning">Este grupo tiene 0 % de ponderación. La tarea no contribuirá al promedio hasta que se configure su peso.</p>}
      <dl className="assignment-dates tnum">
        <div><dt>Apertura</dt><dd><ChileDate value={item.availableFrom} empty="Sin restricción de apertura"/></dd></div>
        <div><dt>Fecha de entrega</dt><dd><ChileDate value={item.dueAt} empty="Sin plazo de entrega"/></dd></div>
        <div><dt>Cierre de recepción</dt><dd><ChileDate value={item.availableUntil ?? item.dueAt} empty="Sin fecha de cierre"/></dd></div>
      </dl>
      <p className="hint">Hora de Santiago de Chile.</p>
      <dl className="form-grid assignment-dates">
        <div><dt>Formatos permitidos</dt><dd>{item.allowedExtensions.length ? item.allowedExtensions.map(ext=>`.${ext}`).join(", ") : "Sin formatos configurados"}</dd></div>
        <div><dt>Intentos permitidos</dt><dd className="tnum">{item.maxAttempts ?? "Ilimitados"}</dd></div>
      </dl>
    </section>
    <section className="card panel stack assignment-instructions">
      {item.description && <><h2>Descripción</h2><p>{item.description}</p></>}
      <h2>Instrucciones</h2><p>{item.instructions ?? "Esta tarea aún no tiene instrucciones."}</p>
    </section>
  </>;
}
