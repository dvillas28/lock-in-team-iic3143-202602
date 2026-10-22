"use client";
import {useEffect,useRef,useState} from 'react';import type {Session} from '../../lib/auth/session.ts';import type {Section} from '../../lib/courses/validation.ts';
import {rectangle,weightsInput,type Book,type GradeItem} from '../../lib/gradebook/validation.ts';import {PublicationOperation} from '../../lib/gradebook/publication.ts';import {publishGrades} from '../../lib/api/gradebook.ts';import {getRouteFeedback} from '../../lib/route-feedback.ts';
export function GradePublication({session,slug,courseId,items,rows,sections,disabled=false,onConfirmed,onBusy}:{session:Session;slug:string;courseId:string;items:GradeItem[];rows:Book['items'];sections:Section[];disabled?:boolean;onConfirmed:()=>void;onBusy:(busy:boolean)=>void}){
 const scope=`${session.getSnapshot().generation}:${slug}:${courseId}:${JSON.stringify(session.getSnapshot().context?.user)}`;
 const [chosen,setChosen]=useState({gradeItemIds:[] as string[],sectionIds:[] as string[],studentIds:[] as string[]}),[message,setMessage]=useState(''),[snapshot,setSnapshot]=useState<{state:PublicationOperation['state'];receipt?:PublicationOperation['receipt']}>();
 const operation=useRef<PublicationOperation|undefined>(undefined),dialog=useRef<HTMLDialogElement>(null),back=useRef<HTMLButtonElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const locked=!!snapshot;
 useEffect(()=>()=>{operation.current?.dispose();},[]);
 useEffect(()=>{
  if(!snapshot||snapshot.state==='confirmed')return;
  const unload=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};
  const navigate=(e:MouseEvent)=>{if((e.target as Element).closest?.('a[href]')&&!window.confirm('Salir pierde la clave y la recuperación de esta publicación. El resultado puede ser incierto. ¿Salir?')){e.preventDefault();e.stopPropagation();}};
  window.addEventListener('beforeunload',unload);document.addEventListener('click',navigate,true);return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',navigate,true);};
 },[snapshot]);
 const toggle=(k:keyof typeof chosen,id:string)=>setChosen(v=>({...v,[k]:v[k].includes(id)?v[k].filter(x=>x!==id):[...v[k],id],...(k==='sectionIds'?{studentIds:[]}: {})}));
 function review(){try{weightsInput(items.map(i=>({gradeItemId:i.id,weightPercent:String(i.weightPercent)})),items);rectangle(chosen,rows);setMessage('');dialog.current?.showModal();back.current?.focus();}catch(e){setMessage((e as Error).message);}}
 async function send(){
  if(operation.current?.state==='sending')return;
  if(!operation.current){try{operation.current=new PublicationOperation(scope,rectangle(chosen,rows),crypto.randomUUID());}catch(e){setMessage((e as Error).message);return;}}
  const current=operation.current,context=session.getSnapshot().context;dialog.current?.close();onBusy(true);
  const promise=current.send(scope,(body,key)=>session.request(c=>publishGrades(c,slug,courseId,body,key)));setSnapshot({state:current.state,receipt:current.receipt});
  await promise;if(context!==session.getSnapshot().context)return;setSnapshot({state:current.state,receipt:current.receipt});
  if(current.state==='confirmed'){onBusy(false);onConfirmed();}else setMessage(current.state==='uncertain'?'Resultado incierto. Conservamos selección y clave en memoria. Repetir usa exactamente la misma operación.':getRouteFeedback(current.error).message);
 }
 const students=rows.filter(r=>chosen.sectionIds.includes(r.sectionId)).filter((r,n,a)=>a.findIndex(x=>x.student.id===r.student.id)===n);
 return <section className="panel stack"><h2 className="serif">Publicar notas</h2><p>Selecciona explícitamente desde esta página revisada. No se incluyen páginas invisibles ni se cancelan intentos.</p><p>Sin clave original tras recargar, el libro solo muestra estado observado: no recupera un recibo ni repite automáticamente una publicación.</p>
 <fieldset disabled={locked||disabled}><legend>Evaluaciones</legend>{items.map(i=><label className="option" key={i.id}><input type="checkbox" value={i.id} checked={chosen.gradeItemIds.includes(i.id)} onChange={()=>toggle('gradeItemIds',i.id)}/>{i.title} · {i.id}</label>)}</fieldset>
 <fieldset disabled={locked||disabled}><legend>Secciones históricas</legend>{sections.map(s=><label className="option" key={s.id}><input type="checkbox" value={s.id} checked={chosen.sectionIds.includes(s.id)} onChange={()=>toggle('sectionIds',s.id)}/>{s.code} · {s.id}</label>)}</fieldset>
 <fieldset disabled={locked||disabled}><legend>Estudiantes de esta página revisada</legend>{students.map(r=><label className="option" key={r.student.id}><input type="checkbox" value={r.student.id} checked={chosen.studentIds.includes(r.student.id)} onChange={()=>toggle('studentIds',r.student.id)}/>{r.student.name} · {r.student.id}</label>)}</fieldset>
 <button ref={trigger} className="btn btn-primary" disabled={locked||disabled} onClick={review}>Revisar publicación</button><p role="status" aria-live="polite">{snapshot?.state==='sending'?'Enviando publicación…':message}</p>
 {snapshot?.state==='confirmed'&&<button className="btn btn-ghost" onClick={()=>{operation.current?.dispose();operation.current=undefined;setSnapshot(undefined);setChosen({gradeItemIds:[],sectionIds:[],studentIds:[]});setMessage('');}}>Nueva selección explícita</button>}
 {snapshot?.state==='confirmed'&&<p role="status" className="tnum">Recibo confirmado: {snapshot.receipt?.publishedCount} notas · {snapshot.receipt?.publishedAt}. Puede corresponder a un replay original.</p>}
 {(snapshot?.state==='uncertain'||snapshot?.state==='rejected')&&<button className="btn btn-ghost" onClick={()=>void send()}>Repetir operación exacta</button>}
 <dialog className="modal native-dialog" ref={dialog} aria-labelledby="publication-title" onClose={()=>trigger.current?.focus()}><h2 id="publication-title">Confirmar selección de publicación</h2><p className="tnum">{chosen.gradeItemIds.length} evaluaciones × {chosen.studentIds.length} estudiantes = {chosen.gradeItemIds.length*chosen.studentIds.length} notas; {chosen.sectionIds.length} secciones.</p><ul>{chosen.gradeItemIds.map(id=><li key={id}>{items.find(i=>i.id===id)?.title} · {id}</li>)}{chosen.sectionIds.map(id=><li key={id}>Sección {sections.find(s=>s.id===id)?.code} · {id}</li>)}{chosen.studentIds.map(id=><li key={id}>{students.find(r=>r.student.id===id)?.student.name} · {id}</li>)}</ul><p>El backend confirma pesos, último intento calificado y ausencia de intentos activos de forma atómica.</p><div className="actions"><button ref={back} className="btn btn-ghost" onClick={()=>dialog.current?.close()}>Volver</button><button className="btn btn-primary" disabled={disabled} onClick={()=>void send()}>Confirmar publicación</button></div></dialog>
 </section>;
}
