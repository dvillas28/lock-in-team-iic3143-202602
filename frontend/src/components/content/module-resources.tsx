"use client";

import {useEffect,useRef,useState} from "react";
import {ArrowDown,ArrowUp,ClipboardList,File,FileText,Image,X} from "lucide-react";
import Link from "next/link";
import {useResource} from "../courses/use-resource.ts";
import {useRefreshOnReturn} from "./use-refresh-on-return.ts";
import {useContentMutation} from "./content-notices.tsx";
import {ErrorState,EmptyState,LoadingState} from "../route-states.tsx";
import {deleteAcademicFile,listModuleResources,moveResource,unlinkModuleQuiz} from "../../lib/api/academic-files.ts";
import type {Session} from "../../lib/auth/session.ts";
import {fileExtension,formatBytes,type AcademicFile,type ModuleQuiz,type ModuleResource,type UploadLimits} from "../../lib/content/academic-files.ts";
import type {CourseModule} from "../../lib/content/validation.ts";
import type {Course} from "../../lib/courses/validation.ts";
import {PublicationToggle} from "./publication-toggle.tsx";
import {MaterialForm} from "./material-form.tsx";
import {FileEditor} from "./file-editor.tsx";
import {FileUploadForm} from "./file-upload-form.tsx";
import {AddContentMenu,type ContentAction} from "./add-content-menu.tsx";
import {QuizLinkDialog} from "./quiz-link-dialog.tsx";
import {useDelayedFlag} from "./use-delayed-flag.ts";

type RowContext={
 session:Session;slug:string;parent:CourseModule;author:boolean;disabled:boolean;reload:()=>Promise<boolean|undefined>;
};
function ResourceRow({session,slug,parent,item,author,disabled,reload,limits,previous,next,move,unlink,remove}:RowContext&{
 item:ModuleResource;limits:UploadLimits;previous?:string;next?:string;
 move:(id:string,neighbor:string,direction:-1|1)=>void;unlink:(item:ModuleQuiz)=>void;remove:(item:AcademicFile)=>void;
}) {
 const [editBlocked,setEditBlocked]=useState(false);
 const isFile=item.kind==="file";
 const Icon=isFile ? item.preview==="image"?Image:item.preview==="pdf"?FileText:File :
  item.kind==="quiz"?ClipboardList:FileText;
 const base=`/courses/${parent.courseId}/modules/${parent.id}`;
 const href=item.kind==="quiz" ? `/courses/${parent.courseId}/quizzes/${item.quizId}` :
  `${base}/${isFile?"files":"materials"}/${item.id}`;
 const publication=parent.publishedAt
  ? item.publishedAt ? "Visible para estudiantes" : "No visible: recurso sin publicar"
  : "No visible: módulo sin publicar";
 return <li className="material-item">
  <div className="module-resource">
   <Icon aria-hidden="true"/>
   <div className="module-resource-info">
    <Link href={href}>{item.title}</Link>
    {isFile ? <p className="hint tnum">{fileExtension(item.fileName).toUpperCase()} · {formatBytes(item.byteSize)}
     {author && item.publishedAt && !parent.publishedAt ? ` · ${publication}` : ""}</p> :
     <p className="hint">{item.kind==="quiz"?"Cuestionario":"Página"}{author?` · ${publication}`:""}</p>}
   </div>
   {author && <div className="module-tools resource-controls">
    {item.kind!=="quiz" && <PublicationToggle session={session} slug={slug} kind={isFile?"file":"material"} id={item.id}
     parentId={parent.id} title={item.title} published={item.publishedAt!==null} onSaved={reload} disabled={disabled||editBlocked}/>}
    <button type="button" className="icon-btn" aria-label={`Subir recurso ${item.title}`} aria-disabled={disabled||!previous}
     onClick={()=>{if(previous&&!disabled) move(item.id,previous,-1);}}><ArrowUp size={16} aria-hidden="true"/></button>
    <button type="button" className="icon-btn" aria-label={`Bajar recurso ${item.title}`} aria-disabled={disabled||!next}
     onClick={()=>{if(next&&!disabled) move(item.id,next,1);}}><ArrowDown size={16} aria-hidden="true"/></button>
    {item.kind==="quiz"&&item.canUnlink&&<button type="button" className="btn btn-ghost" disabled={disabled}
     onClick={()=>unlink(item)}>Quitar enlace</button>}
   </div>}
  </div>
  {author && item.kind==="markdown" && <details className="academic-disclosure resource-editor">
   <summary>Editar material {item.title}</summary>
   <MaterialForm session={session} slug={slug} moduleId={parent.id} item={item} onSaved={reload} disabled={disabled} onBlockedChange={setEditBlocked}/>
  </details>}
  {author && isFile && <FileEditor session={session} slug={slug} item={item} limits={limits} disabled={disabled} reload={reload} remove={remove}/>}
 </li>;
}

export function ModuleResources({session,slug,parent,author,disabled,course,expanded}:Omit<RowContext,"reload">&{course:Course;expanded:boolean}) {
 const result=useResource(session,`${session.getSnapshot().generation}:${slug}:${parent.courseId}:${parent.id}`,
  c=>listModuleResources(c,slug,parent.id),true);
 const mutation=useContentMutation(session);
 const [panel,setPanel]=useState<"file"|"page"|null>(null),[quizOpen,setQuizOpen]=useState(false);
 const [fileBusy,setFileBusy]=useState(false),[pageBusy,setPageBusy]=useState(false);
 const trigger=useRef<HTMLButtonElement>(null),panels=useRef<HTMLDivElement>(null);
 const slow=useDelayedFlag(!result.data&&!result.error);
 const closePanel=()=>{setPanel(null);trigger.current?.focus();};
 const {reload}=result;
 const wasExpanded=useRef(expanded);
 useEffect(()=>{
  if (expanded&&!wasExpanded.current) void reload();
  wasExpanded.current=expanded;
 },[expanded,reload]);
 useRefreshOnReturn(reload,expanded&&!!result.data&&!result.refreshing);
 useEffect(()=>{
  if (panel) panels.current?.querySelector<HTMLElement>(`[data-panel="${panel}"] input:not([type=hidden]),[data-panel="${panel}"] textarea`)?.focus();
 },[panel]);
 if (result.error&&!result.data) return <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/>;
 if (!result.data) return slow ? <LoadingState/> : <div className="resource-pending" aria-busy="true"/>;
 const {items,limits}=result.data;
 const unavailable=disabled||!!result.error||!!result.refreshing||mutation.busy||!!mutation.uncertain;
 const row={session,slug,parent,author,disabled:unavailable,reload:result.reload};
 function move(id:string,neighbor:string,direction:-1|1) {
  void mutation.run(async current=>{
   await session.request(c=>moveResource(c,slug,parent.id,id,neighbor,direction),current);
   return await result.reload() ? "Orden de recursos actualizado." : {message:"Orden guardado. Usa Reintentar para consultar los recursos.",persistent:true};
  },async()=>{await result.reload();return "Revisa el orden actual.";});
 }
 function unlink(item:ModuleQuiz) {
  void mutation.run(async current=>{
   await session.request(c=>unlinkModuleQuiz(c,slug,parent.id,item.id),current);
   return await result.reload() ? "Enlace retirado." : {message:"Enlace retirado. Usa Reintentar para consultar los recursos.",persistent:true};
  },async()=>{await result.reload();return "Revisa los recursos actuales.";});
 }
 function remove(item:AcademicFile) {
  void mutation.run(async current=>{
   await session.request(c=>deleteAcademicFile(c,slug,item.id),current);
   if (!current()) return;
   const refreshed=await reload();
   if (refreshed && current()) {
    document.querySelector<HTMLButtonElement>(`#module-${parent.id} .module-collapse`)?.focus({preventScroll:true});
   }
   return refreshed ? "Archivo eliminado." : {message:"Archivo eliminado. Usa Reintentar para consultar los recursos.",persistent:true};
  },async()=>{await reload();return "Revisa los recursos actuales.";});
 }
 return <div className="module-materials" aria-busy={result.refreshing}>
  {result.error && <><p role="alert">Consulta fallida. Se muestra la última lista disponible.</p>
   <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/></>}
  {mutation.message && <p role={mutation.confirmed?"status":"alert"}>{mutation.message}</p>}
  <div className="resource-toolbar"><span className="section-label">Materiales del módulo</span></div>
  {author && <div className="resource-creation">
   <AddContentMenu triggerRef={trigger} disabled={unavailable} onSelect={(action:ContentAction)=>{
    if (action==="quiz") setQuizOpen(true); else setPanel(action);
   }}/>
  </div>}
  {author && <div ref={panels}>
   <section className="resource-panel card" data-panel="file" aria-label="Subir archivo" hidden={panel!=="file"}>
    <div className="dialog-heading"><h3>Subir archivo</h3>
     <button type="button" className="btn btn-ghost" aria-label="Cerrar" disabled={fileBusy} onClick={closePanel}><X size={18} aria-hidden="true"/></button></div>
    <FileUploadForm session={session} slug={slug} moduleId={parent.id} limits={limits} disabled={unavailable} reload={result.reload} onBusyChange={setFileBusy} onDone={closePanel}/>
   </section>
   <section className="resource-panel card" data-panel="page" aria-label="Crear página" hidden={panel!=="page"}>
    <div className="dialog-heading"><h3>Crear página</h3>
     <button type="button" className="btn btn-ghost" aria-label="Cerrar" disabled={pageBusy} onClick={closePanel}><X size={18} aria-hidden="true"/></button></div>
    <MaterialForm session={session} slug={slug} moduleId={parent.id} onSaved={result.reload} disabled={unavailable} onBlockedChange={setPageBusy} onDone={closePanel}/>
   </section>
   <QuizLinkDialog open={quizOpen} {...row} course={course} items={items} onClose={()=>{setQuizOpen(false);trigger.current?.focus();}}/>
  </div>}
  {!result.error&&!result.refreshing&&!items.length && <EmptyState/>}
  <ul className="module-resource-list">
   {items.map((item,index)=><ResourceRow key={item.id} {...row} item={item} limits={limits} move={move} unlink={unlink} remove={remove}
    previous={items[index-1]?.id} next={items[index+1]?.id}/>)}
  </ul>
 </div>;
}
