"use client";
import { useId } from "react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { safeWrittenHtml } from "../../lib/assignments/written-html.ts";
import { RichTextEditor, type RichTool } from "../rich-text/rich-text-editor.tsx";

const limit=10_000;
const words=new Intl.Segmenter("es",{granularity:"word"});
const tools:RichTool[]=[
 {label:"Negrita",icon:Bold,command:"bold"},
 {label:"Cursiva",icon:Italic,command:"italic"},
 {label:"Lista con viñetas",icon:List,command:"insertUnorderedList"},
 {label:"Lista numerada",icon:ListOrdered,command:"insertOrderedList"},
];

export function WrittenEditor({value,onChange}:{value:string;onChange:(text:string)=>void}) {
 const id=useId();
 const plain=value.replace(/<[^<>]*>/g," ").split("\n")
  .map(line=>line.trimStart().replace(/^\d+[.)](?=\s|$)/,"")).join(" ");
 const count=Array.from(words.segment(plain)).filter(segment=>segment.isWordLike).length;
 return <div className="stack assignment-editor-text">
  <span className="field-label" id={`${id}-label`}>Respuesta escrita</span>
  <RichTextEditor id={id} labelId={`${id}-label`} groupLabel="Formato de la respuesta" describedBy={`${id}-hint`} tools={tools} value={value}
   onChange={onChange} sanitize={safeWrittenHtml} textLimit={limit}/>
  <p id={`${id}-hint`} className="hint tnum">{count} {count===1 ? "palabra" : "palabras"} · Hasta 10.000 caracteres.</p>
 </div>;
}
