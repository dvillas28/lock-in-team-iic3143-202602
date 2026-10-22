"use client";
import Link from 'next/link';
import {useSession} from '../auth/session-provider.tsx';
import {useResource} from '../courses/use-resource.ts';
import {getStudentGrades} from '../../lib/api/gradebook.ts';
import {LoadingState,ErrorState} from '../route-states.tsx';
export function StudentGrades({courseId}:{courseId:string}){
 const {session,state}=useSession(),context=state.context,slug=context?.slug??'';
 const r=useResource(session,`${state.generation}:${slug}:${context?.user?.id}:${courseId}:${JSON.stringify(context?.user)}:grades`,c=>getStudentGrades(c,slug,courseId));
 if(!context?.user)return <LoadingState/>;if(r.error)return <ErrorState feedback={r.error} onRetry={()=>void r.reload()}/>;if(!r.data)return <LoadingState/>;
 const d=r.data;return <div className="stack"><Link href={`/courses/${courseId}`}>Volver al curso</Link><h1 className="serif">Mis notas publicadas</h1>
 <section className="panel"><h2 className="serif">{d.isPartial?'Promedio parcial':'Promedio publicado'}</h2><p className="metric tnum">{d.partialAverage??'Pendiente'}</p><p className="tnum">Peso publicado: {d.publishedWeightPercent} %</p></section>
 {!d.items.length&&<p role="status">Aún no hay notas publicadas.</p>}
 <div className="table-scroll"><table className="data-table"><caption>Resultados propios publicados</caption><thead><tr>{['Evaluación','Peso','Resultado','Nota','Publicación'].map(x=><th scope="col" key={x}>{x}</th>)}</tr></thead><tbody>{d.items.map(i=><tr key={i.gradeItemId}><th scope="row">{i.title}</th><td className="tnum">{i.weightPercent} %</td><td className="tnum">{i.scorePercent} %</td><td className="tnum">{i.grade}</td><td>{i.publishedAt}</td></tr>)}</tbody></table></div></div>;
}
