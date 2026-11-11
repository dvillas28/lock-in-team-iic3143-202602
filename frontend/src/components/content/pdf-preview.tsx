"use client";

import {useEffect,useRef,useState} from "react";
import {ChevronLeft,ChevronRight,Minus,Plus,Scan} from "lucide-react";
import type {PDFDocumentLoadingTask,PDFDocumentProxy,RenderTask,TextLayer} from "pdfjs-dist";

export function PdfPreview({file}:{file:Blob}) {
 const [document,setDocument]=useState<{pdf:PDFDocumentProxy;library:typeof import("pdfjs-dist")}>();
 const [page,setPage]=useState(1);
 const [zoom,setZoom]=useState(1);
 const [width,setWidth]=useState(0);
 const [failure,setFailure]=useState("");
 const [rendered,setRendered]=useState("");
 const viewport=useRef<HTMLDivElement>(null);
 const sheet=useRef<HTMLDivElement>(null);
 const canvas=useRef<HTMLCanvasElement>(null);
 const text=useRef<HTMLDivElement>(null);
 const current=`${page}:${zoom}:${width}`;

 useEffect(()=>{
  let active=true, task:PDFDocumentLoadingTask|undefined;
  async function load() {
   try {
    const [library,data]=await Promise.all([import("pdfjs-dist"),file.arrayBuffer()]);
    if (!active) return;
    const assets=`/pdfjs/${library.version}/`;
    library.GlobalWorkerOptions.workerSrc=`${assets}pdf.worker.min.mjs`;
    task=library.getDocument({data,cMapUrl:`${assets}cmaps/`,standardFontDataUrl:`${assets}standard_fonts/`,
     wasmUrl:`${assets}wasm/`,iccUrl:`${assets}iccs/`,enableXfa:false,stopAtErrors:true,
     maxImageSize:24_000_000});
    const pdf=await task.promise;
    if (active) setDocument({pdf,library});
   } catch(error) {
    if (active) setFailure(error instanceof Error && error.name==="PasswordException" ?
     "Este PDF está protegido con contraseña. Descárgalo para abrirlo con la contraseña." :
     "No se pudo abrir este PDF. Prueba descargarlo o vuelve a intentar.");
   }
  }
  void load();
  return ()=>{active=false;void task?.destroy().catch(()=>undefined);};
 },[file]);

 useEffect(()=>{
  if (!viewport.current) return;
  const observer=new ResizeObserver(([entry])=>setWidth(Math.floor(entry.contentRect.width)));
  observer.observe(viewport.current);
  return ()=>observer.disconnect();
 },[]);

 useEffect(()=>{
  const surface=sheet.current, bitmap=canvas.current, layer=text.current;
  if (!document || !surface || !bitmap || !layer || !width) return;
  const {pdf,library}=document;
  let active=true, render:RenderTask|undefined, textLayer:TextLayer|undefined;
  async function draw(surface:HTMLDivElement,bitmap:HTMLCanvasElement,layer:HTMLDivElement) {
   try {
    const pdfPage=await pdf.getPage(page);
    if (!active) return;
    const original=pdfPage.getViewport({scale:1});
    const scale=Math.min((Math.max(100,width-32)/original.width)*zoom,4096/Math.max(original.width,original.height));
    const view=pdfPage.getViewport({scale});
    const pixels=Math.min(window.devicePixelRatio||1,2,4096/Math.max(view.width,view.height));
    bitmap.width=Math.max(1,Math.floor(view.width*pixels));
    bitmap.height=Math.max(1,Math.floor(view.height*pixels));
    surface.style.width=`${view.width}px`;
    surface.style.height=`${view.height}px`;
    surface.style.setProperty("--total-scale-factor",String(scale));
    layer.replaceChildren();
    render=pdfPage.render({canvas:bitmap,viewport:view,transform:[pixels,0,0,pixels,0,0],
     annotationMode:library.AnnotationMode.DISABLE});
    textLayer=new library.TextLayer({textContentSource:pdfPage.streamTextContent(),container:layer,viewport:view});
    await Promise.all([render.promise,textLayer.render()]);
    if (active) setRendered(current);
   } catch {
    if (active) setFailure("No se pudo mostrar esta página. Prueba descargar el PDF.");
   }
  }
  void draw(surface,bitmap,layer);
  return ()=>{active=false;render?.cancel();textLayer?.cancel();};
 },[document,page,zoom,width,current]);

 if (failure) return <p className="notice" role="alert">{failure}</p>;
 return <section className="card pdf-preview" aria-label="Visor de PDF">
  <div className="pdf-toolbar">
   <div className="pdf-controls">
    <button className="icon-btn" type="button" aria-label="Página anterior" disabled={!document||page===1}
     onClick={()=>{setPage(p=>p-1);viewport.current?.scrollTo(0,0);}}><ChevronLeft size={18} aria-hidden="true"/></button>
    <span className="tnum" role="status">{document?`Página ${page} de ${document.pdf.numPages}`:"Abriendo PDF…"}</span>
    <button className="icon-btn" type="button" aria-label="Página siguiente" disabled={!document||page===document.pdf.numPages}
     onClick={()=>{setPage(p=>p+1);viewport.current?.scrollTo(0,0);}}><ChevronRight size={18} aria-hidden="true"/></button>
   </div>
   <div className="pdf-controls">
    <button className="icon-btn" type="button" aria-label="Reducir zoom" disabled={!document||zoom<=.5}
     onClick={()=>setZoom(value=>value-.25)}><Minus size={18} aria-hidden="true"/></button>
    <span className="tnum" aria-live="polite">{Math.round(zoom*100)} %</span>
    <button className="icon-btn" type="button" aria-label="Aumentar zoom" disabled={!document||zoom>=2.5}
     onClick={()=>setZoom(value=>value+.25)}><Plus size={18} aria-hidden="true"/></button>
    <button className="icon-btn" type="button" aria-label="Ajustar al ancho" disabled={!document||zoom===1}
     onClick={()=>setZoom(1)}><Scan size={18} aria-hidden="true"/></button>
   </div>
  </div>
  <div className="pdf-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Página del documento" aria-busy={rendered!==current}>
   {rendered!==current && <p className="pdf-loading" role="status">Cargando página…</p>}
   <div className="pdf-sheet" ref={sheet} style={{visibility:rendered===current?"visible":"hidden"}}>
    <canvas ref={canvas} aria-hidden="true"/>
    <div className="pdf-text-layer" ref={text}/>
   </div>
  </div>
 </section>;
}
