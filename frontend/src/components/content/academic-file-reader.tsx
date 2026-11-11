"use client";

import {useEffect,useState} from "react";
import {Download,File,FileText,Image as ImageIcon} from "lucide-react";
import {fileBytes,getAcademicFile} from "../../lib/api/academic-files.ts";
import {getCourseModule} from "../../lib/api/modules.ts";
import {fileExtension,formatBytes,type AcademicFile} from "../../lib/content/academic-files.ts";
import {getRouteFeedback} from "../../lib/route-feedback.ts";
import {useSession} from "../auth/session-provider.tsx";
import {useResource} from "../courses/use-resource.ts";
import {ErrorState} from "../route-states.tsx";
import {DocumentSkeleton,PreviewSkeleton,ReaderReturn} from "./document-skeleton.tsx";
import {PdfPreview} from "./pdf-preview.tsx";

function ImagePreview({blob,name}:{blob:Blob;name:string}) {
 const [image,setImage]=useState<{url:string;width:number;height:number}>();
 const [failure,setFailure]=useState(false);
 useEffect(()=>{
  let active=true;
  const url=URL.createObjectURL(blob);
  const probe=new Image();
  probe.src=url;
  void probe.decode().then(()=>{
   if (active) setImage({url,width:probe.naturalWidth,height:probe.naturalHeight});
  }).catch(()=>{if(active) setFailure(true);});
  return ()=>{active=false;URL.revokeObjectURL(url);};
 },[blob]);
 if (failure) return <p className="notice" role="alert">No se pudo mostrar la imagen. Puedes descargar el archivo.</p>;
 if (!image) return <PreviewSkeleton preview="image" label="Preparando la imagen…"/>;
 // Private blob URLs are already fetched through Session and cannot use the Next image optimizer.
 // eslint-disable-next-line @next/next/no-img-element
 return <div className="card image-preview"><img src={image.url} width={image.width} height={image.height} alt={name}/></div>;
}

const textPreviewLimit=128*1024;
const fileTransferTimeoutMs=90_000;

function TextPreview({blob}:{blob:Blob}) {
 const [text,setText]=useState<string>();
 const [failure,setFailure]=useState(false);
 useEffect(()=>{
  let active=true;
  void blob.slice(0,textPreviewLimit).text().then(value=>{if(active) setText(value);}).catch(()=>{if(active)setFailure(true);});
  return ()=>{active=false;};
 },[blob]);
 if (failure) return <p className="notice" role="alert">No se pudo mostrar el texto. Puedes descargar el archivo.</p>;
 if (text===undefined) return <PreviewSkeleton preview="text" label="Preparando el texto…"/>;
 return <div className="card reader-paper"><pre className="markdown-source">{text}</pre>
  {blob.size>textPreviewLimit && <p className="hint">La vista previa muestra el comienzo del archivo. Descárgalo para leer el resto.</p>}</div>;
}

function FilePreview({item,slug}:{item:AcademicFile;slug:string}) {
 const {session}=useSession();
 const result=useResource(session,`preview:${slug}:${item.id}`,c=>fileBytes(c,slug,item,false),false,fileTransferTimeoutMs);
 if (result.error) return <ErrorState feedback={result.error} onRetry={()=>void result.reload()}/>;
 if (!result.data) return <PreviewSkeleton preview={item.preview??"text"} label="Cargando vista previa…"/>;
 if (item.preview==="pdf") return <PdfPreview file={result.data}/>;
 if (item.preview==="image") return <ImagePreview blob={result.data} name={item.title}/>;
 return <TextPreview blob={result.data}/>;
}

export function AcademicFileReader({courseId,moduleId,fileId}:{courseId:string;moduleId:string;fileId:string}) {
 const {session,state}=useSession();
 const slug=state.context?.slug??"";
 const result=useResource(session,`file:${state.generation}:${slug}:${courseId}:${moduleId}:${fileId}`,async client=>{
  const parent=await getCourseModule(client,slug,moduleId,courseId);
  const item=await getAcademicFile(client,slug,fileId,moduleId);
  return {parent,item};
 },false);
 const [downloading,setDownloading]=useState(false);
 const [error,setError]=useState("");
 const back=<ReaderReturn courseId={courseId} moduleId={moduleId} parent={result.data?.parent.title}/>;
 // Same article and return link while pending, so only the reader's own content is replaced.
 const pending=<article className="material-reader academic-file-reader stack">{back}<DocumentSkeleton reader="file"/></article>;
 if (!state.context?.user) return pending;
 if (result.error) return <article className="material-reader stack">{back}<ErrorState feedback={result.error} onRetry={()=>void result.reload()}/></article>;
 if (!result.data) return pending;
 const {item,parent}=result.data;
 const Icon=item.preview==="image"?ImageIcon:item.preview==="pdf"?FileText:File;

 async function download() {
  if(downloading)return;
  setDownloading(true);setError("");
  try {
   const blob=await session.request(c=>fileBytes(c,slug,item,true),undefined,{timeoutMs:fileTransferTimeoutMs});
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");
   link.href=url;link.download=item.fileName;
   document.body.append(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),30_000);
  } catch(error) {setError(getRouteFeedback(error).message);}
  finally {setDownloading(false);}
 }

 return <article className="material-reader academic-file-reader stack">
  {back}
  <header className="file-reader-heading">
   <div className="reader-heading">
    <p className="section-label"><Icon size={16} aria-hidden="true"/>{parent.title}</p>
    <h1 className="serif">{item.title}</h1>
    <p className="file-reader-meta tnum">{fileExtension(item.fileName).toUpperCase()} · {formatBytes(item.byteSize)}
     {item.fileName!==item.title && <> · <span>{item.fileName}</span></>}</p>
   </div>
   <button className="btn btn-primary" type="button" disabled={downloading} onClick={()=>void download()}>
    <Download size={16} aria-hidden="true"/>{downloading?"Preparando descarga…":"Descargar archivo"}
   </button>
  </header>
  {error&&<p className="notice" role="alert">{error}</p>}
  {item.preview ? <FilePreview key={`${state.generation}:${slug}:${item.id}`} item={item} slug={slug}/> :
   <div className="card reader-paper"><p>Este formato se puede consultar después de descargar el archivo.</p></div>}
 </article>;
}
