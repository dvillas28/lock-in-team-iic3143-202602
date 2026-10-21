import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { SessionProvider, useSession } from "../src/components/auth/session-provider.tsx";
import { LoginForm } from "../src/components/auth/login-form.tsx";
import { ProtectedInstitution } from "../src/components/auth/protected-institution.tsx";
import { InstitutionPicker } from "../src/components/auth/institution-picker.tsx";

const id="10000000-0000-4000-8000-000000000003";
const institution=(slug="uc")=>({id:slug==="uc"?id:"10000000-0000-4000-8000-000000000004",slug,name:slug.toUpperCase(),active:true});
const user=(slug="uc")=>({id,email:"persona@example.test",name:"Persona",institutionMembership:{id,active:true,isAdmin:false,isSuperAdmin:false,institution:institution(slug)},sectionMemberships:[]});
const login=()=>{const iat=Math.floor(Date.now()/1000);return {accessToken:`e30.${Buffer.from(JSON.stringify({sub:id,iat,exp:iat+900,iss:"academix-api",aud:"academix-clients"})).toString("base64url")}.signature`,tokenType:"Bearer",expiresIn:900};};
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
function deferred<T>() {let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return {resolve,promise};}

async function mount(options:{url?:string;reply?:(request:Request)=>Response|Promise<Response>}={}){
  const dom=new JSDOM('<div id="root"></div>',{url:options.url??"http://localhost:3000/login"});
  const old=new Map<string,PropertyDescriptor|undefined>();
  for(const [key,value] of Object.entries({window:dom.window,self:dom.window,document:dom.window.document,navigator:dom.window.navigator,
    HTMLElement:dom.window.HTMLElement,HTMLInputElement:dom.window.HTMLInputElement,FormData:dom.window.FormData,
    location:dom.window.location,IS_REACT_ACT_ENVIRONMENT:true})){
    old.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
  }
  const previousFetch=globalThis.fetch, previousApi=process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL="https://api.example.test";
  const requests:Request[]=[];
  globalThis.fetch=async input=>{
    const request=input as Request;requests.push(request);
    if(options.reply)return options.reply(request);
    if(request.method==="POST")return Response.json(login());
    const match=new URL(request.url).pathname.match(/institution\/([^/]+)\/me$/);
    return Response.json(match?user(match[1]):{items:[institution(),institution("utfsm")]});
  };
  const root=createRoot(dom.window.document.getElementById("root")!);
  let path=dom.window.location.pathname;
  let custom:ReactNode;
  const router:AppRouterInstance={back(){},forward(){},refresh(){},prefetch(){},bfcacheId:"test",
    push(href){navigate(href);},replace(href){navigate(href);}};
  function navigate(href:string){dom.window.history.replaceState({},"",href);path=dom.window.location.pathname;render();}
  function render(){
    const match=path.match(/^\/institutions\/([a-z0-9-]+)$/);
    const view=custom??(match?createElement(ProtectedInstitution,{slug:match[1]},createElement("p",null,"PRIVATE_CONTENT")):
      path==="/institutions"?createElement(InstitutionPicker):createElement(LoginForm));
    root.render(createElement(AppRouterContext.Provider,{value:router},createElement(SessionProvider,null,view)));
  }
  await act(async()=>{render();await flush();});
  const doc=dom.window.document;
  async function submit(email=" PERSONA@EXAMPLE.TEST ",password=" pass "){
    const emailInput=doc.querySelector<HTMLInputElement>('#email')!;
    const passwordInput=doc.querySelector<HTMLInputElement>('#password')!;
    emailInput.value=email;passwordInput.value=password;
    await act(async()=>{doc.querySelector("form")!.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));await flush();});
  }
  async function click(text:string){
    const element=Array.from(doc.querySelectorAll<HTMLElement>("button,a")).find(e=>e.textContent===text || e.getAttribute("aria-label")===text);
    assert.ok(element,`missing control ${text}`);
    await act(async()=>{element.click();await flush();});
  }
  return {dom,doc,requests,submit,click,get path(){return path;},
    async navigate(href:string){await act(async()=>{navigate(href);await flush();});},
    async custom(view:ReactNode){await act(async()=>{custom=view;render();await flush();});},
    async close(){await act(async()=>root.unmount());dom.window.close();globalThis.fetch=previousFetch;
      if(previousApi===undefined)delete process.env.NEXT_PUBLIC_API_URL;else process.env.NEXT_PUBLIC_API_URL=previousApi;
      old.forEach((descriptor,key)=>{if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);});},
  };
}

test("accessible form, validation, password toggle and successful institution navigation",async()=>{
  const ui=await mount();try{
    assert.equal(ui.doc.querySelector('label[for="email"]')?.textContent,"Correo electrónico");
    assert.doesNotMatch(ui.doc.body.textContent!,/bytes|UTF-8|15 minutos/);
    assert.equal(ui.doc.querySelector('#password')?.getAttribute("autocomplete"),"current-password");
    await ui.click("Mostrar contraseña");assert.equal(ui.doc.querySelector('#password')?.getAttribute("type"),"text");
    await ui.click("Ocultar contraseña");assert.equal(ui.doc.querySelector('#password')?.getAttribute("type"),"password");
    await ui.submit("not an email","");assert.match(ui.doc.body.textContent!,/correo válido/);assert.equal(ui.requests.length,0);
    await ui.submit("persona@example.test", "ñ".repeat(65));assert.match(ui.doc.body.textContent!,/contraseña es demasiado larga/);assert.equal(ui.requests.length,0);
    await ui.submit();assert.equal(ui.path,"/institutions");assert.match(ui.doc.body.textContent!,/Tus instituciones/);
    assert.deepEqual(await ui.requests[0].json(),{email:"persona@example.test",password:" pass "});
    await ui.click("UC");assert.equal(ui.path,"/institutions/uc");assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    assert.ok(ui.requests.some(request=>new URL(request.url).pathname==="/api/v1/institution/uc/me"));
    assert.match(ui.doc.body.textContent!,/Persona · persona@example.test/);
    await ui.navigate("/institutions/utfsm");assert.match(ui.doc.body.textContent!,/Institución: UTFSM/);
    await ui.click("Cerrar sesión");assert.equal(ui.path,"/login");assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT|persona@example.test/);
    await ui.navigate("/institutions/uc");assert.equal(ui.path,"/login");assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    assert.equal(ui.dom.window.localStorage.length,0);assert.equal(ui.dom.window.sessionStorage.length,0);assert.equal(ui.doc.cookie,"");
  }finally{await ui.close();}
});

test("initial protected route and reload contain no private shell or content",async()=>{
  const ui=await mount({url:"http://localhost:3000/institutions/uc"});try{
    assert.equal(ui.path,"/login");assert.match(ui.dom.window.location.search,/next=/);assert.doesNotMatch(ui.doc.body.innerHTML,/PRIVATE_CONTENT|Contexto institucional/);
    await ui.submit();assert.equal(ui.path,"/institutions/uc");assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    await act(async()=>{ui.dom.window.dispatchEvent(new ui.dom.window.Event("pagehide"));await flush();});
    assert.equal(ui.path,"/login");assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
  }finally{await ui.close();}
});

test("double submit shows busy, clears password immediately and only sends once",async()=>{
  const pending=deferred<Response>();const ui=await mount({reply:r=>r.method==="POST"?pending.promise:Response.json({items:[]})});try{
    await ui.submit();assert.match(ui.doc.body.textContent!,/Verificando acceso/);assert.equal(ui.doc.querySelector<HTMLInputElement>('#password')?.value,"");
    assert.equal(ui.doc.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled,true);
    await act(async()=>{ui.doc.querySelector("form")!.dispatchEvent(new ui.dom.window.Event("submit",{bubbles:true,cancelable:true}));await flush();});
    assert.equal(ui.requests.length,1);
    await act(async()=>{pending.resolve(Response.json(login()));await flush();});
    assert.match(ui.doc.body.textContent!,/no tiene membresías/);
  }finally{await ui.close();}
});

test("login failure, rate limit countdown and recovery use safe messages",async t=>{
  t.mock.timers.enable({apis:["setInterval","Date"],now:1_800_000_000_000});
  let status=401;
  const ui=await mount({reply:r=>r.method==="POST"?(status===200?Response.json(login()):Response.json({detail:"PRIVATE_INTERNAL"},{status,headers:{"Retry-After":"2"}})):Response.json({items:[]})});try{
    await ui.submit();assert.match(ui.doc.body.textContent!,/Correo o contraseña incorrectos/);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_INTERNAL/);
    status=429;await ui.submit();assert.match(ui.doc.body.textContent!,/Demasiados intentos/);assert.equal(ui.doc.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled,true);
    await act(async()=>{t.mock.timers.tick(3000);await flush();});
    assert.equal(ui.doc.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled,false);
    status=200;await ui.submit();assert.equal(ui.path,"/institutions");
  }finally{await ui.close();t.mock.timers.reset();}
});

test("unknown hosts block login and mismatched institution subdomains block content",async()=>{
  const bad=await mount({url:"https://evil.test/login"});try{assert.match(bad.doc.body.textContent!,/dominio no está habilitado/);assert.equal(bad.doc.querySelector("form"),null);assert.equal(bad.requests.length,0);}finally{await bad.close();}
  const ui=await mount({url:"https://uc.academix.dvillasc.me/login?next=%2Finstitutions%2Futfsm"});try{
    await ui.submit();assert.equal(ui.path,"/institutions/uc");await ui.navigate("/institutions/utfsm");assert.match(ui.doc.body.textContent!,/Contexto institucional inválido/);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    await ui.navigate("/institutions");assert.match(ui.doc.querySelector('a[href^="https://utfsm."]')?.getAttribute("href")??"",/https:\/\/utfsm\.academix\.dvillasc\.me\/institutions\/utfsm/);
  }finally{await ui.close();}
  const picker=await mount({url:"https://evil.test/institutions"});try{assert.match(picker.doc.body.textContent!,/dominio no está habilitado/);}finally{await picker.close();}
});

test("context loading hides children; revocation, outage, retry and 401 fail closed",async()=>{
  let status=200;let pending:ReturnType<typeof deferred<Response>>|undefined;
  const ui=await mount({reply:r=>r.method==="POST"?Response.json(login()):r.url.endsWith("/me")?(pending?pending.promise:Response.json(status===200?user():{detail:"PRIVATE_INTERNAL"},{status})):Response.json({items:[institution()]})});try{
    await ui.submit();pending=deferred<Response>();await ui.navigate("/institutions/uc");
    assert.match(ui.doc.body.textContent!,/Cargando contenido/);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    await act(async()=>{pending!.resolve(Response.json(user()));await flush();});pending=undefined;assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    for(const code of [404,503]){
      status=code;await act(async()=>{ui.dom.window.dispatchEvent(new ui.dom.window.Event("focus"));await flush();});
      assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT|PRIVATE_INTERNAL|persona@example.test/);
      if(code===503){status=200;await ui.click("Reintentar");assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);}
    }
    status=401;await act(async()=>{ui.dom.window.dispatchEvent(new ui.dom.window.Event("pageshow"));await flush();});assert.equal(ui.path,"/login");
  }finally{await ui.close();}
});

test("directory outage hides previous list and supports recovery",async()=>{
  let fail=false;
  const ui=await mount({reply:r=>r.method==="POST"?Response.json(login()):fail?Response.json({}, {status:503}):Response.json({items:[institution()]})});try{
    await ui.submit();assert.match(ui.doc.body.textContent!,/UC/);
    fail=true;await act(async()=>{ui.dom.window.dispatchEvent(new ui.dom.window.Event("focus"));await flush();});assert.match(ui.doc.body.textContent!,/No se pudo completar/);assert.equal(ui.doc.querySelector('a[href="/institutions/uc"]'),null);
    fail=false;await ui.click("Reintentar");assert.ok(ui.doc.querySelector('a[href="/institutions/uc"]'));
  }finally{await ui.close();}
});

test("provider denies access outside its boundary; server rendering never emits private children",()=>{
  function Probe(){useSession();return null;}
  assert.throws(()=>renderToStaticMarkup(createElement(Probe)),/SessionProvider required/);
  const router:AppRouterInstance={back(){},forward(){},refresh(){},prefetch(){},push(){},replace(){},bfcacheId:"test"};
  const html=renderToStaticMarkup(createElement(AppRouterContext.Provider,{value:router},createElement(SessionProvider,null,createElement(ProtectedInstitution,{slug:"uc"},"PRIVATE_SERVER_CHILDREN"))));
  assert.doesNotMatch(html,/PRIVATE_SERVER_CHILDREN|Contexto institucional/);assert.match(html,/Cargando contenido/);
});

test("token expiry redirects private UI; logout still works during a backend outage",async t=>{
  t.mock.timers.enable({apis:["setTimeout","Date"],now:1_800_000_000_000});
  const ui=await mount();try{
    await ui.submit();await ui.navigate("/institutions/uc");assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    await act(async()=>{t.mock.timers.tick(900_001);await flush();});assert.equal(ui.path,"/login");assert.match(ui.doc.body.textContent!,/sesión venció/);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    await ui.submit();await ui.navigate("/institutions/uc");
    const count=ui.requests.length;globalThis.fetch=async()=>{throw new Error("offline");};await ui.click("Cerrar sesión");
    assert.equal(ui.path,"/login");assert.equal(ui.requests.length,count);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
  }finally{await ui.close();t.mock.timers.reset();}
});
