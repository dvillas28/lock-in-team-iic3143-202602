"use client";

import {useEffect} from "react";

/** Returning to the page revalidates the visible collection. Focus and visibility often arrive together. */
export function useRefreshOnReturn(reload:()=>Promise<unknown>,enabled:boolean) {
 useEffect(()=>{
  if (!enabled) return;
  let pending:number|undefined;
  function refresh() {
   if (document.visibilityState==="hidden" || pending!==undefined) return;
   pending=window.setTimeout(()=>{
    pending=undefined;
    if (document.visibilityState!=="hidden") void reload();
   },50);
  }
  window.addEventListener("focus",refresh);
  document.addEventListener("visibilitychange",refresh);
  return ()=>{
   window.clearTimeout(pending);
   window.removeEventListener("focus",refresh);
   document.removeEventListener("visibilitychange",refresh);
  };
 },[reload,enabled]);
}
