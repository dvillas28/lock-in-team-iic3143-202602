import { useId } from "react";
export function Field({ name, label, value = "", type = "text", error, invalid, required = true, maxLength, multiline = false, hint, min, max }: {
  multiline?: boolean;
  name: string;
  label: string;
  value?: string;
  type?: string;
  error?: string;
  invalid?: boolean;
  required?: boolean;
  maxLength?: number;
  hint?: string;
  min?: number;
  max?: number;
}) {
  const id = useId();
  const describedBy = [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined].filter(Boolean).join(' ') || undefined;
  return <div className="stack">
    <label className="field-label" htmlFor={id}>{label}</label>
    {multiline ? <textarea className="field" id={id} name={name} defaultValue={value} required={required} maxLength={maxLength} aria-invalid={invalid || undefined} aria-describedby={describedBy} /> : <input className="field" id={id} name={name} defaultValue={value} type={type} required={required} maxLength={maxLength} min={type === "number" ? min ?? 0 : undefined} max={type === "number" ? max ?? 2147483647 : undefined} step={type === "number" ? 1 : undefined} aria-invalid={invalid || undefined} aria-describedby={describedBy} />}
    {hint && <p id={`${id}-hint`} className="hint">{hint}</p>}
    {error && <p id={`${id}-error`} className="field-error">{error}</p>}</div>;
}
