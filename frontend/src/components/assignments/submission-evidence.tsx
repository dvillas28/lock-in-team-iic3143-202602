"use client";
import { useId, useState } from "react";
import { Download } from "lucide-react";
import Markdown from "react-markdown";
import { safeWrittenHtml } from "../../lib/assignments/written-html.ts";
import { useSession } from "../auth/session-provider.tsx";
import { downloadSubmissionFile, type Submission, type SubmissionFile, type SubmissionScope } from "../../lib/api/submissions.ts";
import { ChileDate, points } from "./assignment-facts.tsx";
import { submissionError } from "./submission-feedback.ts";

export function WrittenResponse({text}:{text:string}) {
 const rich=/<\/?(?:div|p|br|strong|b|em|i|ul|ol|li)\b/i.test(text);
 if (rich) return <div className="assignment-written" dangerouslySetInnerHTML={{__html:safeWrittenHtml(text)}}/>;
 return <div className="assignment-written">
  <Markdown allowedElements={["p","br","strong","em","ol","ul","li","img"]} unwrapDisallowed
   components={{img:({alt})=><span>{alt || "[Imagen]"}</span>}}>{text}</Markdown>
 </div>;
}

function FileDownload({scope,file}:{scope:SubmissionScope;file:SubmissionFile}) {
 const {session}=useSession();
 const [busy,setBusy]=useState(false), [error,setError]=useState("");
 const errorId=useId();
 async function download() {
  if (busy) return;
  const context=session.getSnapshot().context;
  setBusy(true);
  setError("");
  try {
   const blob=await session.request(c=>downloadSubmissionFile(c,scope,file),()=>context===session.getSnapshot().context);
   if (context!==session.getSnapshot().context) return;
   const url=URL.createObjectURL(blob), link=document.createElement("a");
   link.href=url;
   link.download=file.name;
   link.click();
   window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  } catch (error) {
   if (context===session.getSnapshot().context) setError(submissionError(error));
  } finally { setBusy(false); }
 }
 return <li>
  <button type="button" className="btn btn-ghost submission-file" disabled={busy}
   aria-describedby={error ? errorId : undefined} onClick={()=>void download()}>
   <Download size={16} aria-hidden="true"/>
   <span>{file.name}<small className="hint">{points.format(file.byteSize/1024)} KB</small></span>
   {busy && <span role="status">Descargando…</span>}
  </button>
  {error && <p id={errorId} role="alert" className="assignment-field-error">{error}</p>}
 </li>;
}

export function AttemptEvidence({attempt,scope}:{attempt:Submission;scope:SubmissionScope}) {
 return <div className="stack assignment-evidence">
  {attempt.writtenResponse && <div className="stack"><h3>Respuesta escrita</h3><WrittenResponse text={attempt.writtenResponse}/></div>}
  {attempt.files.length>0 && <div className="stack"><h3>Archivos entregados</h3>
   <ul className="submission-files">{attempt.files.map(file=><FileDownload key={file.id} scope={scope} file={file}/>)}</ul>
  </div>}
 </div>;
}

export function AttemptHistory({attempts,scope}:{attempts:Submission[];scope:SubmissionScope}) {
 if (!attempts.length) return <p className="hint">Aún no hay intentos entregados.</p>;
 return <div className="stack">{attempts.map(attempt=><details className="assignment-attempt" key={attempt.id}>
  <summary><strong>Intento {attempt.attemptNumber}</strong> · <ChileDate value={attempt.submittedAt} empty=""/>
   {attempt.isLate && <span className="chip chip-warning">Atrasado</span>}</summary>
  <AttemptEvidence attempt={attempt} scope={scope}/>
 </details>)}</div>;
}
