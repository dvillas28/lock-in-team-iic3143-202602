"use client";

import {createContext,useCallback,useContext,useState,type ReactNode} from "react";
import {createPortal} from "react-dom";
import {CircleAlert,CircleCheck,X} from "lucide-react";
import type {Session} from "../../lib/auth/session.ts";
import {useMutation} from "../courses/use-mutation.ts";
import {useTransientFeedback} from "../use-feedback.ts";

type NoticeTone="success"|"error";
type Notify=(message:string,tone?:NoticeTone,host?:HTMLDialogElement|null)=>void;
const NoticeContext=createContext<Notify|undefined>(undefined);

export function ContentNotices({children}:{children:ReactNode}) {
 const [notice,setNotice]=useState<{message:string;tone:NoticeTone;host?:HTMLDialogElement|null}>();
 const notify=useCallback<Notify>((message,tone="success",host)=>setNotice({message,tone,host}),[]);
 const message=useTransientFeedback(notice?.message,true,notice);
 const error=notice?.tone==="error";
 const viewport=<div className="content-notices" role={message&&error?"alert":"status"} aria-atomic="true">
  {message&&<div className={`card content-notice${error?" content-notice-error":""}`}>
   {error?<CircleAlert size={18} aria-hidden="true"/>:<CircleCheck size={18} aria-hidden="true"/>}
   <span>{message}</span>
   <button type="button" className="icon-btn" aria-label="Cerrar notificación" onClick={()=>setNotice(undefined)}>
    <X size={15} aria-hidden="true"/>
   </button>
  </div>}
 </div>;
 // Native dialogs sit above page overlays, so modal errors share the dialog’s top layer.
 return <NoticeContext.Provider value={notify}>
  {children}
  {notice?.host ? (message && notice.host.open ? createPortal(viewport,notice.host) : null) : viewport}
 </NoticeContext.Provider>;
}

export function useContentNotice() {
 return useContext(NoticeContext);
}

export function useContentMutation(session:Session) {
 return useMutation(session,{onSuccess:useContentNotice()});
}
