"use client";
import { useEffect, useId, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";
import { Bold, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";
import { safeWrittenHtml } from "../../lib/assignments/written-html.ts";

const limit=10_000;
const words=new Intl.Segmenter("es",{granularity:"word"});
const tools=[
 {label:"Negrita",icon:Bold,command:"bold"},
 {label:"Cursiva",icon:Italic,command:"italic"},
 {label:"Lista con viñetas",icon:List,command:"insertUnorderedList"},
 {label:"Lista numerada",icon:ListOrdered,command:"insertOrderedList"},
];

export function WrittenEditor({value,onChange}:{value:string;onChange:(text:string)=>void}) {
 const id=useId(), field=useRef<HTMLDivElement>(null);
 const [active,setActive]=useState<Record<string,boolean>>({});
 const plain=value.replace(/<[^<>]*>/g," ").split("\n")
  .map(line=>line.trimStart().replace(/^\d+[.)](?=\s|$)/,"")).join(" ");
 const count=Array.from(words.segment(plain)).filter(segment=>segment.isWordLike).length;

 useEffect(()=>{
  const input=field.current;
  if (input && input.innerHTML!==value) input.innerHTML=safeWrittenHtml(value);
 },[value]);

 function sync() {
  const input=field.current;
  if (!input) return;
  const text=input.textContent??"";
  if ([...text].length>limit) {
  input.innerHTML=safeWrittenHtml(value);
  return;
  }
  onChange(input.innerHTML);
  setActive(Object.fromEntries(tools.map(tool=>[tool.command,document.queryCommandState(tool.command)])));
 }

 function format(command:string) {
  field.current?.focus();
  document.execCommand(command);
  sync();
 }

 function insertPlainText(event: ClipboardEvent<HTMLDivElement> | DragEvent<HTMLDivElement>) {
  event.preventDefault();
  const transfer="clipboardData" in event ? event.clipboardData : event.dataTransfer;
  document.execCommand("insertText",false,transfer.getData("text/plain"));
  sync();
 }

 function splitListItem(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key!=="Enter" || !event.shiftKey) return;
  const selection=window.getSelection();
  const node=selection?.anchorNode;
  const item=node instanceof Element ? node.closest("li") : node?.parentElement?.closest("li");
  if (!item || !field.current?.contains(item)) return;
  event.preventDefault();
  if (!/\p{L}/u.test(item.textContent??"")) return;
  document.execCommand("insertHTML",false,"<br></li><li><br>");
  sync();
 }

 return <div className="stack assignment-editor-text">
  <span className="field-label" id={`${id}-label`}>Respuesta escrita</span>
  <div className="actions" role="group" aria-label="Formato de la respuesta">
  {tools.map(tool=><button key={tool.label} type="button" className={`btn btn-ghost${active[tool.command] ? " is-active" : ""}`} title={tool.label}
   aria-label={tool.label} aria-pressed={active[tool.command]??false} onMouseDown={event=>event.preventDefault()} onClick={()=>format(tool.command)}><tool.icon size={16} aria-hidden="true"/></button>)}
  <span className="assignment-editor-divider" aria-hidden="true"/>
  <button type="button" className="btn btn-ghost" title="Deshacer" aria-label="Deshacer" onClick={()=>format("undo")}><Undo2 size={16} aria-hidden="true"/></button>
  <button type="button" className="btn btn-ghost" title="Rehacer" aria-label="Rehacer" onClick={()=>format("redo")}><Redo2 size={16} aria-hidden="true"/></button>
  </div>
  <div id={id} ref={field} className="field assignment-rich-editor" contentEditable role="textbox" tabIndex={0} aria-multiline="true"
  aria-describedby={`${id}-hint`} aria-labelledby={`${id}-label`} onInput={sync} onPaste={insertPlainText} onDrop={insertPlainText} onKeyDown={splitListItem}
  onKeyUp={sync} onMouseUp={sync} suppressContentEditableWarning />
  <p id={`${id}-hint`} className="hint tnum">{count} {count===1 ? "palabra" : "palabras"} · Hasta 10.000 caracteres.</p>
 </div>;
}
