"use client";
import { useFeedbackState } from "../use-feedback.ts";
import { useEffect, useId, useRef } from "react";
import { Trash2 } from "lucide-react";
import { formNumber, formValue } from "../../lib/quizzes/form-values.ts";
import type { Question } from "../../lib/quizzes/validation.ts";
import { Field } from "../courses/form-fields.tsx";
type Row = Omit<Question,"alternatives"> & {key: number; alternatives: (Question["alternatives"][number] & {key: number})[]};
export function readQuestions(form: FormData, rows: Row[]): Question[] {
  return rows.map((q,i)=>({...(q.id ? {id:q.id} : {}),prompt:formValue(form,`questions.${i}.prompt`),position:q.position,points:formNumber(formValue(form,`questions.${i}.points`),`questions.${i}.points`),alternatives:q.alternatives.map((a,j)=>({id:formValue(form,`questions.${i}.alternatives.${j}.id`),text:formValue(form,`questions.${i}.alternatives.${j}.text`),isCorrect:formValue(form,`correct-${q.key}`) === String(a.key)}))}));
}
export function QuestionEditor({rows,onRows,field,message}:{rows:Row[];onRows:(rows:Row[])=>void;field?:string;message?:string}) {
  const sequence=useRef(1000000), container=useRef<HTMLDivElement>(null);
  const [notice,setNotice]=useFeedbackState();
  const errorId=useId();
  const pendingFocus=useRef("");
  useEffect(()=>{if(pendingFocus.current){container.current?.querySelector<HTMLElement>(pendingFocus.current)?.focus();pendingFocus.current="";}},[rows]);
  function update(next: Row[], focus:string, notice:string) {
    pendingFocus.current=focus;onRows(next.map((q,i)=>({...q,position:i+1})));setNotice(notice);
  }
  return <div className="stack quiz-questions" ref={container}>
    <div className="quiz-section-heading"><div><h2 className="serif">Preguntas y pauta</h2><p className="hint">Agrega al menos dos alternativas y marca exactamente una correcta por pregunta.</p></div><span className="chip tnum">{rows.length} {rows.length===1 ? "pregunta" : "preguntas"}</span></div>
    {!rows.length && <p className="notice">Todavía no hay preguntas. Puedes guardar un borrador vacío y completarlo antes de publicar.</p>}
    {rows.map((q,i)=><fieldset className="card panel stack quiz-question" key={q.key}><legend>Pregunta {i+1}</legend>
      <div className="quiz-question-fields"><Field name={`questions.${i}.prompt`} label={`Enunciado ${i+1}`} multiline value={q.prompt} invalid={field===`questions.${i}` || field===`questions.${i}.prompt`} error={field===`questions.${i}` || field===`questions.${i}.prompt` ? message : undefined}/>
      <label className="stack field-label">Puntaje {i+1}<input className="field tnum" name={`questions.${i}.points`} type="number" min="0.01" max="999999.99" step="0.01" required defaultValue={q.points} aria-invalid={field===`questions.${i}.points` || undefined} aria-describedby={field===`questions.${i}.points` ? `${errorId}-${q.key}` : undefined}/></label></div>
      {q.alternatives.map((a,j)=><div className="quiz-alternative" key={a.key}>
        <input type="hidden" name={`questions.${i}.alternatives.${j}.id`} value={a.id}/>
        <label className="quiz-correct-option"><input type="radio" name={`correct-${q.key}`} value={a.key} defaultChecked={a.isCorrect} aria-label={`Correcta: alternativa ${j+1} de pregunta ${i+1}`} data-error-field={`questions.${i}.correct`} aria-invalid={field===`questions.${i}.correct` || undefined} aria-describedby={field===`questions.${i}.correct` ? `${errorId}-${q.key}` : undefined}/><span>Correcta<span className="quiz-sr-only">: alternativa {j+1} de pregunta {i+1}</span></span></label>
        <Field name={`questions.${i}.alternatives.${j}.text`} label={`Alternativa ${i+1}.${j+1}`} value={a.text} invalid={field===`questions.${i}.alternatives.${j}.text`} error={field===`questions.${i}.alternatives.${j}.text` ? message : undefined}/>
        <button className="icon-btn" type="button" aria-label={`Quitar alternativa ${i+1}.${j+1}`} title={q.alternatives.length<=2 ? "Cada pregunta necesita al menos dos alternativas" : "Quitar alternativa"} disabled={q.alternatives.length<=2} onClick={()=>{if(q.alternatives.length>2)update(rows.map(p=>p.key===q.key?{...p,alternatives:p.alternatives.filter(x=>x.key!==a.key)}:p),`[name="questions.${i}.prompt"]`,"Alternativa eliminada.");}}><Trash2 size={16} aria-hidden="true"/><span className="quiz-sr-only">Quitar alternativa {i+1}.{j+1}</span></button>
      </div>)}
      {field?.startsWith(`questions.${i}.`) || field===`questions.${i}` ? <p id={`${errorId}-${q.key}`} className="quiz-field-error">{message}</p> : null}
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={()=>{
          let key=sequence.current++;
          while(q.alternatives.some(a=>a.id===`opcion-${key}`))key=sequence.current++;
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
