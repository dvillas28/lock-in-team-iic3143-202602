import { useId } from "react";
export function Field({ name, label, value = "", type = "text", error, invalid, required = true, maxLength, multiline = false }: {
  multiline?: boolean;
  name: string;
  label: string;
  value?: string;
  type?: string;
  error?: string;
  invalid?: boolean;
  required?: boolean;
  maxLength?: number;
}) {
  const id = useId();
  return <div className="stack">
    <label className="field-label" htmlFor={id}>{label}</label>
    {multiline ? <textarea className="field" id={id} name={name} defaultValue={value} required={required} maxLength={maxLength} aria-invalid={invalid || undefined} aria-describedby={error ? `${id}-error` : undefined} /> : <input className="field" id={id} name={name} defaultValue={value} type={type} required={required} maxLength={maxLength} min={type === "number" ? 0 : undefined} max={type === "number" ? 2147483647 : undefined} step={type === "number" ? 1 : undefined} aria-invalid={invalid || undefined} aria-describedby={error ? `${id}-error` : undefined} />}{error && <p id={`${id}-error`} className="hint">{error}</p>}</div>;
}
