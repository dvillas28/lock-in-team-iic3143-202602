"use client";

import {createContext,useCallback,useContext,useState,type ReactNode} from "react";
import {CircleCheck} from "lucide-react";
import type {Session} from "../../lib/auth/session.ts";
import {useMutation} from "../courses/use-mutation.ts";
import {useTransientFeedback} from "../use-feedback.ts";

const NoticeContext=createContext<((message:string)=>void)|undefined>(undefined);

export function ContentNotices({children}:{children:ReactNode}) {
 const [notice,setNotice]=useState<{message:string;id:number}>();
 const notify=useCallback((message:string)=>setNotice(previous=>({message,id:(previous?.id??0)+1})),[]);
 const message=useTransientFeedback(notice?.message,true,notice);
 return <NoticeContext.Provider value={notify}>
  {children}
  <div className="content-notices" role="status" aria-atomic="true">
   {message&&<div className="card content-notice" key={notice?.id}>
    <CircleCheck size={18} aria-hidden="true"/><span>{message}</span>
   </div>}
  </div>
 </NoticeContext.Provider>;
}

export function useContentNotice() {
 return useContext(NoticeContext);
}

export function useContentMutation(session:Session) {
 return useMutation(session,{onSuccess:useContentNotice()});
}
