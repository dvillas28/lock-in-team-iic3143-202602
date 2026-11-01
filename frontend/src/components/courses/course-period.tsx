"use client";
import {useId, useState} from 'react';
import {academicYears} from '../../lib/courses/creation.ts';

export function CoursePeriod({value, error}: {value?: string; error?: string}) {
  const id = useId(), years = academicYears();
  const legacy = !!value && !/^\d{4}-[12]$/.test(value);
  const [year, setYear] = useState(legacy ? 'existing' : value?.slice(0, 4) ?? String(years[0]));
  const [semester, setSemester] = useState(value && !legacy ? value.slice(-1) : '1');
  const existingYear = value && !legacy ? Number(value.slice(0, 4)) : undefined;
  const historicalYear=existingYear && !years.includes(existingYear) && year===String(existingYear);
  const options = existingYear && !years.includes(existingYear) ? [existingYear, ...years].sort((a,b)=>a-b) : years;
  const term = year === 'existing' ? value! : `${year}-${semester}`;
  return <fieldset className="stack" aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}>
    <legend className="field-label">Período académico</legend>
    <input type="hidden" name="term" value={term}/>
    <div className="form-grid">
      <div className="stack"><label className="field-label" htmlFor={`${id}-year`}>Año</label><select id={`${id}-year`} name="termYear" className="field tnum" value={year} onChange={e=>setYear(e.target.value)} aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-error` : `${id}-hint`}>
        {legacy && <option value="existing">Conservar período actual: {value}</option>}
        {options.map(y=><option key={y} value={y}>{y}</option>)}
      </select></div>
      <div className="stack"><label className="field-label" htmlFor={`${id}-semester`}>Semestre</label><select id={`${id}-semester`} name="termSemester" className="field" value={semester} disabled={year === 'existing' || !!historicalYear} onChange={e=>setSemester(e.target.value)} aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-error` : `${id}-hint`}>
        <option value="1">Primer semestre</option><option value="2">Segundo semestre</option>
      </select></div>
    </div>
    <p className="hint tnum" id={`${id}-hint`}>Período seleccionado: {term}.</p>
    {error && <p id={`${id}-error`} className="hint">{error}</p>}
  </fieldset>;
}
