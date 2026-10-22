import { JSDOM } from "jsdom";
import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { SessionProvider, useSession } from "../../src/components/auth/session-provider.tsx";
import { ErrorState } from "../../src/components/route-states.tsx";
import type { Session } from "../../src/lib/auth/session.ts";
import { user, id } from "./courses.ts";
export const flush=()=>new Promise<void>(r=>setImmediate(r));
export async function mount(view:ReactNode, reply:(r:Request)=>Response|Promise<Response>,profile="owner",slug="uc"){
 const dom=new JSDOM('<div id="root"></div>',{url:`http://${slug}.localhost:3000/courses`});
 // React imported before jsdom selects its legacy input event fallback.
 Object.assign(dom.window.HTMLElement.prototype,{attachEvent(){},detachEvent(){}});
 Object.assign(dom.window.HTMLDialogElement.prototype,{
  showModal(this: HTMLDialogElement){this.setAttribute("open","");},close(this: HTMLDialogElement){this.removeAttribute("open");}
 });
 const old=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value] of Object.entries({window:dom.window,self:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,HTMLInputElement:dom.window.HTMLInputElement,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true})){
 old.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});}
 const prev=globalThis.fetch;const env=process.env.NEXT_PUBLIC_API_URL;process.env.NEXT_PUBLIC_API_URL="https://api.test";
 const requests:Request[]=[];let actor=user(profile,slug);let session!:Session;
 globalThis.fetch=async input=>{const r=input as Request;requests.push(r);if(r.url.endsWith('/login')){const iat=Math.floor(Date.now()/1000);return Response.json({tokenType:"Bearer",expiresIn:900,accessToken:`e30.${Buffer.from(JSON.stringify({sub:actor.id,iat,exp:iat+900,iss:"academix-api",aud:"academix-clients"})).toString("base64url")}.signature`});}if(r.url.endsWith('/institutions'))return Response.json({items:[actor.institutionMembership.institution]});if(r.url.endsWith('/me'))return Response.json(actor);return reply(r);};
 function Probe(){const s=useSession();session=s.session;return s.state.context?.error?createElement(ErrorState,{feedback:s.state.context.error}):s.state.context?.user?view:null;}
 const root=createRoot(dom.window.document.getElementById('root')!);
 await act(async()=>{root.render(createElement(SessionProvider,null,createElement(Probe)));await flush();});
 await act(async()=>{await session.login('ana@example.test','pass');await session.loadContext(slug);await flush();});
 const doc=dom.window.document;
 return {dom,doc,requests,session,id,
 async render(next:ReactNode){view=next;await act(async()=>{root.render(createElement(SessionProvider,null,createElement(Probe)));await flush();});},
 setActor(profile:string){actor=user(profile,slug);},
 async actor(profile:string,tenant=slug){actor=user(profile,tenant);await act(async()=>{await session.loadContext(tenant);await flush();});},
 async click(text:string){const el=Array.from(doc.querySelectorAll<HTMLElement>('button,a')).find(e=>e.textContent===text);if(!el)throw new Error(`Missing ${text}: ${doc.body.textContent}`);await act(async()=>{el.click();await flush();});},
 async submit(selector='form',values:Record<string,string>={}){const form=doc.querySelector<HTMLFormElement>(selector)!;for(const [key,value]of Object.entries(values))(form.elements.namedItem(key) as HTMLInputElement).value=value;await act(async()=>{form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await flush();});},
 async settle(action:()=>void){await act(async()=>{action();await flush();});},
 async close(){await act(async()=>root.unmount());dom.window.close();globalThis.fetch=prev;if(env===undefined)delete process.env.NEXT_PUBLIC_API_URL;else process.env.NEXT_PUBLIC_API_URL=env;old.forEach((d,k)=>{if(d)Object.defineProperty(globalThis,k,d);else Reflect.deleteProperty(globalThis,k);});}
 };
}
