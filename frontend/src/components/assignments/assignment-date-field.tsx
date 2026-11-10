import { useId, useState } from "react";
import { chileCandidates, chileDateInput, chileFormWall, chileOffset, localChile } from "../../lib/assignments/dates.ts";
import { FieldError } from "../../lib/courses/validation.ts";

export function AssignmentDateField({name,label,timeLabel,original,dateError,timeError,onScheduleChange}:{
  name:string;label:string;timeLabel:string;original?:string|null;dateError?:string;timeError?:string;
  onScheduleChange?: (wall:string, choice:string) => void;
}) {
  const id = useId(), previous = localChile(original);
  const [dateTime,setDateTime] = useState(()=>previous.slice(0,16));
  const date = dateTime ? chileDateInput(dateTime.slice(0,10)) : "";
  const time = dateTime.slice(11,16);
  let wall = "";
  try {
    wall = chileFormWall(date.trim(),time.trim(),name,original);
  } catch (error) {
    if (!(error instanceof FieldError)) throw error;
  }
  const options = chileCandidates(wall);
  const selected = options.find(value=>original && value.slice(0,19)===original.slice(0,19)) ?? "";
  const [choice,setChoice] = useState(selected);
  const selectedChoice = options.includes(choice) ? choice : "";
  const notify = (nextDateTime = dateTime, nextChoice = choice) => {
    const nextWall = nextDateTime ? chileFormWall(chileDateInput(nextDateTime.slice(0,10)),nextDateTime.slice(11,16),name,original) : "";
    onScheduleChange?.(nextWall,nextChoice);
  };
  return <div className="stack">
    <div className="assignment-date-controls">
      <label className="field-label" htmlFor={id}>{label}</label>
      <input className="field tnum assignment-datetime-input" id={id} name={name} type="datetime-local"
        value={dateTime} onChange={event=>{setDateTime(event.target.value); try { notify(event.target.value,""); } catch { onScheduleChange?.("",""); }}}
        data-error-field={`${name}Time`}
        aria-label={timeLabel} aria-invalid={!!dateError || !!timeError || undefined}
        aria-describedby={dateError || timeError ? `${id}-error` : undefined}/>
      <input type="hidden" name={`${name}Date`} value={date}/>
      <input type="hidden" name={`${name}Time`} value={time}/>
    </div>
    {options.length>1 && <div className="stack">
      <label className="field-label" htmlFor={`${id}-offset`}>Hora repetida</label>
      <p className="hint" id={`${id}-offset-help`}>Esta hora ocurre dos veces. Elige una.</p>
      <select id={`${id}-offset`} key={wall} className="field" name={`${name}Offset`} value={selectedChoice}
        aria-describedby={`${id}-offset-help`} required
        onInvalid={event=>event.currentTarget.setCustomValidity("Elige cuál de las dos horas quieres usar.")}
        onChange={event=>{event.currentTarget.setCustomValidity(""); setChoice(event.target.value); notify(dateTime,event.target.value);}}>
        <option value="">Elige una ocurrencia</option>
        {options.map((option,index)=><option key={option} value={option}>
          {index===0 ? "Primera ocurrencia" : "Segunda ocurrencia"} ({chileOffset(option)})
        </option>)}
      </select>
    </div>}
    {(dateError || timeError) && <p id={`${id}-error`} className="hint assignment-field-error">{dateError ?? timeError}</p>}
  </div>;
}
