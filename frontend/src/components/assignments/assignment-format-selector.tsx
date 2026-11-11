import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const formatOptions = [
  { label: "PDF", extensions: ["pdf"] },
  { label: "Word", extensions: ["doc", "docx"] },
  { label: "Excel", extensions: ["xls", "xlsx"] },
  { label: "PowerPoint", extensions: ["ppt", "pptx"] },
  { label: "Imágenes", extensions: ["jpg", "jpeg", "png"] },
  { label: "ZIP", extensions: ["zip"] },
  { label: "Texto", extensions: ["txt", "csv"] },
] as const;

function normalizeExtension(value: string) {
  return value.trim().replace(/^\.+/, "").toLowerCase();
}

const knownExtensions: Set<string> = new Set(formatOptions.flatMap(option => option.extensions));
export const isAssignmentFormatExtension = (value: string) => knownExtensions.has(normalizeExtension(value));

function uniqueExtensions(values: readonly string[]) {
  const seen = new Set<string>();
  return values.reduce<string[]>((result, value) => {
    const extension = normalizeExtension(value);
    if (extension && !seen.has(extension)) {
      seen.add(extension);
      result.push(extension);
    }
    return result;
  }, []);
}

export function AssignmentFormatSelector({ value, error, invalid, required, onChange }: {
  value: readonly string[];
  error?: string;
  invalid?: boolean;
  required?: boolean;
  onChange?: () => void;
}) {
  const id = useId();
  const menu = useRef<HTMLDivElement>(null);
  const [open,setOpen] = useState(false);
  const initial = uniqueExtensions(value);
  const [selected, setSelected] = useState(() => new Set(initial));
  const selectedExtensions = uniqueExtensions([...selected]);
  const selectedLabels = formatOptions
    .filter(option => option.extensions.every(extension => selected.has(extension)))
    .map(option => option.label);
  const legacyExtensions = selectedExtensions.filter(extension => !knownExtensions.has(extension));
  const describedBy = error ? `${id}-error` : undefined;
  const summary = selectedLabels.length
    ? selectedLabels.join(", ")
    : legacyExtensions.length
      ? "Formatos históricos"
      : "Selecciona formatos";
  useEffect(()=>{
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (menu.current && !menu.current.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown",closeOutside);
    document.addEventListener("keydown",closeEscape);
    return ()=>{ document.removeEventListener("pointerdown",closeOutside); document.removeEventListener("keydown",closeEscape); };
  },[open]);

  function toggle(extensions: readonly string[], checked: boolean) {
    setSelected(current => {
      const next = new Set(current);
      extensions.forEach(extension => checked ? next.add(extension) : next.delete(extension));
      return next;
    });
    onChange?.();
  }

  return <div className="stack assignment-format-selector">
    <span className="field-label" id={`${id}-label`}>Formatos de archivo permitidos</span>
    <input type="hidden" name="allowedExtensions" value={selectedExtensions.join(",")} />
    <div className="assignment-format-menu" ref={menu}>
      <button type="button" className="field assignment-format-trigger" aria-labelledby={`${id}-label`} aria-describedby={describedBy}
        aria-expanded={open} onClick={()=>setOpen(current=>!current)}>
        <span>{summary}</span>
        <ChevronDown size={16} aria-hidden="true"/>
      </button>
      {open && <fieldset className="assignment-format-options" aria-labelledby={`${id}-label`} aria-invalid={invalid || undefined}>
        <legend className="assignment-sr-only">Selecciona uno o más formatos</legend>
        {formatOptions.map(option => {
          const checked = option.extensions.every(extension => selected.has(extension));
          return <label className="assignment-format-option" key={option.label}>
            <input type="checkbox" checked={checked} onChange={event=>toggle(option.extensions, event.currentTarget.checked)} />
            <span>{option.label}</span>
            <small>{option.extensions.map(extension => `.${extension}`).join(", ")}</small>
          </label>;
        })}
      </fieldset>}
    </div>
    {legacyExtensions.length > 0 && <p className="hint">Se conservarán los formatos históricos: {legacyExtensions.map(extension => `.${extension}`).join(", ")}.</p>}
    {required && selectedExtensions.length === 0 && <p className="hint">Selecciona al menos un formato.</p>}
    {error && <p id={`${id}-error`} className="hint">{error}</p>}
  </div>;
}
