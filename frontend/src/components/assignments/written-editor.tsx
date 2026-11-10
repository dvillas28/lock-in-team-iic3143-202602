"use client";
import { useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Bold, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";

const limit=10_000;
const tools=[
 {label:"Negrita",icon:Bold,command:"bold"},
 {label:"Cursiva",icon:Italic,command:"italic"},
 {label:"Lista con viñetas",icon:List,command:"insertUnorderedList"},
 {label:"Lista numerada",icon:ListOrdered,command:"insertOrderedList"},
];

export function WrittenEditor({value,onChange}:{value:string;onChange:(text:string)=>void}) {
 const id=useId(), field=useRef<HTMLDivElement>(null);
 const [active,setActive]=useState<Record<string,boolean>>({});
 const count=(value.replace(/<[^>]*>/g," ").replace(/^\s*\d+[.)](?=\s|$)/gm,"").match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)??[]).length;

 useEffect(()=>{
  const input=field.current;
  if (input && input.innerHTML!==value) input.innerHTML=value;
 },[value]);

 function sync() {
  const input=field.current;
  if (!input) return;
  const text=input.textContent??"";
  if ([...text].length>limit) {
  input.innerHTML=value;
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

 function paste(event: ClipboardEvent<HTMLDivElement>) {
  event.preventDefault();
  document.execCommand("insertText",false,event.clipboardData.getData("text/plain"));
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
  <label className="field-label" htmlFor={id}>Respuesta escrita</label>
  <div className="actions" role="group" aria-label="Formato de la respuesta">
  {tools.map(tool=><button key={tool.label} type="button" className={`btn btn-ghost${active[tool.command] ? " is-active" : ""}`} title={tool.label}
   aria-label={tool.label} aria-pressed={active[tool.command]??false} onMouseDown={event=>event.preventDefault()} onClick={()=>format(tool.command)}><tool.icon size={16} aria-hidden="true"/></button>)}
  <span className="assignment-editor-divider" aria-hidden="true"/>
  <button type="button" className="btn btn-ghost" title="Deshacer" aria-label="Deshacer" onClick={()=>format("undo")}><Undo2 size={16} aria-hidden="true"/></button>
  <button type="button" className="btn btn-ghost" title="Rehacer" aria-label="Rehacer" onClick={()=>format("redo")}><Redo2 size={16} aria-hidden="true"/></button>
  </div>
  <div id={id} ref={field} className="field assignment-rich-editor" contentEditable role="textbox" aria-multiline="true"
  aria-describedby={`${id}-hint`} aria-label="Respuesta escrita" onInput={sync} onPaste={paste} onKeyDown={splitListItem}
  onKeyUp={sync} onMouseUp={sync} suppressContentEditableWarning />
  <p id={`${id}-hint`} className="hint tnum">{count} {count===1 ? "palabra" : "palabras"} · Hasta 10.000 caracteres.</p>
 </div>;
}
