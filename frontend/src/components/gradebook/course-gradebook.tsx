"use client";
import {useState} from 'react';
import Link from 'next/link';
import {useSession} from '../auth/session-provider.tsx';
import {useResource} from '../courses/use-resource.ts';
import {getCourse} from '../../lib/api/courses.ts';
import {listSections} from '../../lib/api/sections.ts';
import {listCourseGradeItems,getCourseGradebook} from '../../lib/api/gradebook.ts';
import {gradebookCapabilities} from '../../lib/gradebook/capabilities.ts';
import {ApiHttpError} from '../../lib/api/errors.ts';
import {LoadingState,ErrorState} from '../route-states.tsx';
import {WeightsForm} from './weights-form.tsx';
import {GradePublication} from './grade-publication.tsx';
export function CourseGradebook({courseId}:{courseId:string}){
 const {state}=useSession();if(!state.context?.user)return <LoadingState/>;
 return <BookView key={`${state.generation}:${state.context.slug}:${courseId}:${JSON.stringify(state.context.user)}`} courseId={courseId}/>;
}
function BookView({courseId}:{courseId:string}){
 const {session,state}=useSession(),user=state.context!.user!,slug=state.context!.slug;
 const [sectionId,setSection]=useState(''),[cursor,setCursor]=useState<string>(),[pages,setPages]=useState<(string|undefined)[]>([]);
 const [locked,setLocked]=useState(false),[busy,setBusy]=useState(false);
 const r=useResource(session,`${state.generation}:${slug}:${user.id}:${courseId}:${sectionId}:${cursor}`,async c=>{
  const course=await getCourse(c,slug,courseId),cap=gradebookCapabilities(user,course,sectionId||undefined);if(!cap.book)throw new ApiHttpError(403);
  const sections=await listSections(c,slug,courseId),items=await listCourseGradeItems(c,slug,courseId),book=await getCourseGradebook(c,slug,courseId,items.items,{sectionId:sectionId||undefined,cursor});
  if(!cap.global&&book.items.some(x=>!cap.readSections.includes(x.sectionId)))throw new ApiHttpError(403);
  return {course,cap,sections,items,book};
 },true);
 if(r.error&&!r.data)return <div className="stack"><ErrorState feedback={r.error} onRetry={()=>void r.reload()}/><button className="btn btn-ghost" onClick={()=>{setSection('');setCursor(undefined);setPages([]);}}>Reiniciar libro</button></div>;if(!r.data)return <LoadingState/>;
 const {cap,sections,items,book}=r.data;
 return <div className="stack"><Link href={`/courses/${courseId}`}>Volver al curso</Link><h1 className="serif">Libro de notas</h1>
 {r.error&&<><p role="alert">Consulta fallida: representación anterior, no vigente. La operación de publicación conserva su clave.</p><ErrorState feedback={r.error} onRetry={()=>void r.reload()}/></>}
 <label className="field-label">Sección histórica<select disabled={busy} className="field" value={sectionId} onChange={e=>{setSection(e.target.value);setCursor(undefined);setPages([]);}}><option value="">Todas las autorizadas</option>{sections.filter(s=>cap.global||cap.readSections.includes(s.id)).map(s=><option key={s.id} value={s.id}>{s.code}</option>)}</select></label>
 <p>Promedios publicados calculados por backend. Las notas sin publicar son de consulta académica.</p>
 {!book.items.length&&<p role="status">No hay resultados en esta página.</p>}
 <div className="table-scroll"><table className="data-table"><caption>Resultados por estudiante y sección histórica</caption><thead><tr>{['Estudiante','Sección histórica',...items.items.map(i=>i.title),'Promedio publicado','Peso publicado'].map((x,n)=><th scope="col" key={n}>{x}</th>)}</tr></thead><tbody>{book.items.map(row=><tr key={row.student.id+'/'+row.sectionId}><th scope="row">{row.student.name}<br/>{row.student.email}{!row.student.active?' · Usuario inactivo':''}</th><td>{sections.find(s=>s.id===row.sectionId)?.code??row.sectionId}</td>{items.items.map(i=>{const g=row.grades.find(g=>g.gradeItemId===i.id);return <td key={i.id} className="tnum">{g?<><Link href={`/courses/${courseId}/quizzes/${i.quizId}/attempts/${g.attemptId}`}>{g.grade}</Link><br/>{g.publishedAt?'Publicada':'Sin publicar'}</>:'Pendiente'}</td>;})}<td className="tnum">{row.partialAverage??'Pendiente'}</td><td className="tnum">{row.publishedWeightPercent} %</td></tr>)}</tbody></table></div>
 <nav className="actions" aria-label="Páginas del libro"><button className="btn btn-ghost" disabled={busy||!pages.length} onClick={()=>{setCursor(pages.at(-1));setPages(p=>p.slice(0,-1));}}>Anterior</button><button className="btn btn-ghost" disabled={busy||!book.hasMore} onClick={()=>{setPages(p=>[...p,cursor]);setCursor(book.nextCursor!);}}>Siguiente</button><button className="btn btn-ghost" disabled={r.refreshing} onClick={()=>void r.reload()}>Consultar estado actual</button></nav>
 {cap.weights&&<WeightsForm session={session} slug={slug} courseId={courseId} items={items.items} busy={busy||!!r.error||!!r.refreshing} locked={locked||book.items.some(r=>r.grades.some(g=>g.publishedAt!==null))} onSaved={r.reload}/>}
 {cap.publish&&<GradePublication key={`${sectionId}:${cursor}`} session={session} slug={slug} courseId={courseId} disabled={!!r.error||!!r.refreshing} items={items.items} rows={book.items} sections={sections.filter(s=>(cap.global||cap.writeSections.includes(s.id))&&(!sectionId||s.id===sectionId))} onBusy={setBusy} onConfirmed={()=>{setLocked(true);void r.reload();}}/>}
 </div>;
}
