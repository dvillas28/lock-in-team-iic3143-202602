"use client";
import { useFeedbackState } from "../use-feedback.ts";
import { useEffect, useRef } from "react";
import type { Question } from "../../lib/quizzes/validation.ts";
import { Field } from "../courses/form-fields.tsx";
type Row = Omit<Question,"alternatives"> & {key: number; alternatives: (Question["alternatives"][number] & {key: number})[]};
export function readQuestions(form: FormData, rows: Row[]): Question[] {
  return rows.map((q,i)=>({...(q.id ? {id:q.id} : {}),prompt:String(form.get(`questions.${i}.prompt`) ?? ""),position:q.position,points:Number(form.get(`questions.${i}.points`)),alternatives:q.alternatives.map((a,j)=>({id:String(form.get(`questions.${i}.alternatives.${j}.id`) ?? ""),text:String(form.get(`questions.${i}.alternatives.${j}.text`) ?? ""),isCorrect:form.get(`correct-${q.key}`) === String(a.key)}))}));
}
export function QuestionEditor({rows,onRows,field,message}:{rows:Row[];onRows:(rows:Row[])=>void;field?:string;message?:string}) {
  const sequence=useRef(1000000), container=useRef<HTMLDivElement>(null);
  const [notice,setNotice]=useFeedbackState();
  const pendingFocus=useRef("");
  useEffect(()=>{if(pendingFocus.current){container.current?.querySelector<HTMLElement>(pendingFocus.current)?.focus();pendingFocus.current="";}},[rows]);
  function update(next: Row[], focus:string, notice:string) {
    pendingFocus.current=focus;onRows(next.map((q,i)=>({...q,position:i+1})));setNotice(notice);
  }
  return <div className="stack quiz-questions" ref={container}>
    <h2 className="serif">Preguntas y pauta</h2><p className="hint">Exactamente una correcta por pregunta. Guardar reemplaza la colección completa; sin fusión de ediciones concurrentes.</p>
    {rows.map((q,i)=><fieldset className="panel stack" key={q.key}><legend>Pregunta {i+1}</legend>
      <Field name={`questions.${i}.prompt`} label={`Enunciado ${i+1}`} value={q.prompt} invalid={field?.startsWith(`questions.${i}`)} error={field?.startsWith(`questions.${i}`) ? message : undefined}/>
      <label className="stack">Puntaje {i+1}<input className="field tnum" name={`questions.${i}.points`} type="number" min="0.01" max="999999.99" step="0.01" defaultValue={q.points}/></label>
      {q.alternatives.map((a,j)=><div className="quiz-alternative stack" key={a.key}>
        <Field name={`questions.${i}.alternatives.${j}.id`} label={`ID alternativa ${i+1}.${j+1}`} value={a.id}/>
        <Field name={`questions.${i}.alternatives.${j}.text`} label={`Texto alternativa ${i+1}.${j+1}`} value={a.text}/>
        <label><input type="radio" name={`correct-${q.key}`} value={a.key} defaultChecked={a.isCorrect}/> Correcta: alternativa {j+1} de pregunta {i+1}</label>
        <button className="btn btn-ghost" type="button" onClick={()=>update(rows.map(p=>p.key===q.key?{...p,alternatives:p.alternatives.filter(x=>x.key!==a.key)}:p),`[name="questions.${i}.prompt"]`,"Alternativa eliminada.")}>Quitar alternativa {i+1}.{j+1}</button>
      </div>)}
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={()=>{
          const key=sequence.current++;
          update(rows.map(p=>p.key===q.key?{...p,alternatives:[...p.alternatives,{key,id:`opcion-${key}`,text:"",isCorrect:false}]}:p),`[name="questions.${i}.alternatives.${q.alternatives.length}.text"]`,"Alternativa agregada.");
        }}>Agregar alternativa {i+1}</button>
        {[-1,1].map(delta=><button key={delta} type="button" className="btn btn-ghost" data-move={`${q.key}:${delta}`} disabled={i+delta<0 || i+delta>=rows.length} onClick={()=>{
          const next=[...rows];[next[i],next[i+delta]]=[next[i+delta],next[i]];
          update(next,`[data-move="${q.key}:${i+delta===0 ? 1 : i+delta===rows.length-1 ? -1 : delta}"]`,"Pregunta reordenada.");
        }}>{delta<0?"Subir":"Bajar"} pregunta {i+1}</button>)}
        <button type="button" className="btn btn-ghost" onClick={()=>update(rows.filter(p=>p.key!==q.key),i>0?`[name="questions.${i-1}.prompt"]`:'[data-add-question]',"Pregunta eliminada.")}>Quitar pregunta {i+1}</button>
      </div>
    </fieldset>)}
    <button type="button" data-add-question className="btn btn-ghost" onClick={()=>{
      const key=sequence.current++;
      update([...rows,{key,prompt:"",position:rows.length+1,points:1,alternatives:[{key:sequence.current++,id:"a",text:"",isCorrect:false},{key:sequence.current++,id:"b",text:"",isCorrect:false}]}],`[name="questions.${rows.length}.prompt"]`,"Pregunta agregada.");
    }}>Agregar pregunta</button>{notice && <p role="status">{notice}</p>}
  </div>;
}
export function questionRows(initial: Question[]): Row[] {
  return initial.map((q,i)=>({...q,key:i,alternatives:q.alternatives.map((a,j)=>({...a,key:i*1000+j}))}));
}
