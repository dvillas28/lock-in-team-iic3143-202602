import {JSDOM} from 'jsdom';
import {act,createElement as h,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {AppRouterContext,type AppRouterInstance} from 'next/dist/shared/lib/app-router-context.shared-runtime.js';
import {PathnameContext} from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js';
import {SessionProvider,useSession} from '../../src/components/auth/session-provider.tsx';
import type {Session} from '../../src/lib/auth/session.ts';
import {user} from './courses.ts';
import type {AccountProfile} from '../../src/lib/accounts/validation.ts';
export const flush=()=>new Promise<void>(r=>setImmediate(r));
export async function mountAccount(view:ReactNode,reply:(r:Request)=>Response|Promise<Response>,options:{anonymous?:boolean;url?:string;role?:string;account?:Partial<AccountProfile>;membership?:boolean}={}){
 const dom=new JSDOM('<div id="root"></div>',{url:options.url??'http://uc.localhost:3000/profile'});
 Object.assign(dom.window.HTMLElement.prototype,{attachEvent(){},detachEvent(){}});
 Object.assign(dom.window.HTMLDialogElement.prototype,{showModal(this:HTMLDialogElement){this.setAttribute('open','');},close(this:HTMLDialogElement){this.removeAttribute('open');}});
 const NativeFormData=globalThis.FormData;
 class FormDataForDOM extends NativeFormData {constructor(form?:HTMLFormElement){super();if(form)for(const control of form.elements){const field=control as HTMLInputElement;if(field.name&&!field.disabled&&field.type!=='file')this.append(field.name,field.value);}}}
 const old=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value] of Object.entries({window:dom.window,self:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,HTMLInputElement:dom.window.HTMLInputElement,FormData:FormDataForDOM,IS_REACT_ACT_ENVIRONMENT:true})){
  old.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
 }
 const fetcher=globalThis.fetch,api=process.env.NEXT_PUBLIC_API_URL,origins=process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS;
 process.env.NEXT_PUBLIC_API_URL='https://api.test';process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS='{"http://uc.localhost:3000":"uc","http://utfsm.localhost:3000":"utfsm"}';
 const actor=user(options.role??'owner','uc');
 const account:AccountProfile={id:actor.id,name:actor.name,email:actor.email,bio:null,hasAvatar:false,updatedAt:'2026-11-07T12:00:00.000001Z',capabilities:{avatar:false,invitationEmail:false},...options.account};
 const requests:Request[]=[];let session!:Session;
 globalThis.fetch=async input=>{
  const request=input as Request;requests.push(request.clone());const path=new URL(request.url).pathname;
  if(path==='/api/v1/auth/login'){const iat=Math.floor(Date.now()/1000);return Response.json({tokenType:'Bearer',expiresIn:900,accessToken:`e30.${Buffer.from(JSON.stringify({sub:actor.id,iat,exp:iat+900,iss:'academix-api',aud:'academix-clients'})).toString('base64url')}.signature`});}
  if(path==='/api/v1/institutions')return Response.json({items:options.membership===false?[]:[actor.institutionMembership.institution]});
  if(path==='/api/v1/institution/uc/me')return Response.json(actor);
  if(path==='/api/v1/me'&&request.method==='GET')return Response.json(account);
  return reply(request);
 };
 let pathname=dom.window.location.pathname;const destinations:string[]=[];
 const root=createRoot(dom.window.document.getElementById('root')!);
 const router:AppRouterInstance={back(){},forward(){},refresh(){},prefetch(){},bfcacheId:'test',push(href){destinations.push(href);},replace(href){destinations.push(href);}};
 function Probe(){const value=useSession();session=value.session;return options.anonymous||value.state.status==='authenticated'&&(options.membership===false||!!value.state.context?.user)?view:null;}
 function render(){root.render(h(AppRouterContext.Provider,{value:router},h(PathnameContext.Provider,{value:pathname},h(SessionProvider,null,h(Probe)))));}
 await act(async()=>{render();await flush();});
 if(!options.anonymous)await act(async()=>{await session.login('ana@example.test','password');if(options.membership!==false)await session.loadContext('uc');await session.loadAccount();await flush();});
 const doc=dom.window.document;
 return {dom,doc,requests,session,account,destinations,
 async click(label:string){const button=[...doc.querySelectorAll<HTMLElement>('button,a')].find(b=>b.textContent===label||b.getAttribute('aria-label')===label);if(!button)throw new Error('Missing '+label+': '+doc.body.textContent);await act(async()=>{button.click();await flush();});},
 async submit(selector:string,values:Record<string,string>={}){const form=doc.querySelector<HTMLFormElement>(selector)!;if(!form)throw new Error('Missing form '+selector);for(const [key,value] of Object.entries(values))(form.elements.namedItem(key) as HTMLInputElement).value=value;await act(async()=>{form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await flush();});},
 async settle(callback:()=>void|Promise<void>){await act(async()=>{await callback();await flush();});},
 async navigate(path:string){pathname=path;dom.window.history.replaceState({},'',path);await act(async()=>{render();await flush();});},
 async close(){await act(async()=>root.unmount());dom.window.close();globalThis.fetch=fetcher;for(const [name,value] of [['NEXT_PUBLIC_API_URL',api],['NEXT_PUBLIC_INSTITUTION_ORIGINS',origins]] as const){if(value===undefined)delete process.env[name];else process.env[name]=value;}old.forEach((descriptor,key)=>{if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);});}
 };
}
