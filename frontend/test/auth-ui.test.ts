import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement, type ReactNode } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { SessionProvider, useSession } from "../src/components/auth/session-provider.tsx";
import { LoginForm } from "../src/components/auth/login-form.tsx";
import { ProtectedInstitution } from "../src/components/auth/protected-institution.tsx";
import InstitutionsPage from "../src/app/institutions/page.tsx";
import Home from "../src/app/page.tsx";

const id="10000000-0000-4000-8000-000000000003";
const institution=(slug="uc")=>({id:slug==="uc"?id:"10000000-0000-4000-8000-000000000004",slug,name:slug.toUpperCase(),active:true});
const user=(slug="uc")=>({id,email:"persona@example.test",name:"Persona",institutionMembership:{id,active:true,isAdmin:false,isSuperAdmin:false,institution:institution(slug)},sectionMemberships:[]});
const login=()=>{const iat=Math.floor(Date.now()/1000);return {accessToken:`e30.${Buffer.from(JSON.stringify({sub:id,iat,exp:iat+900,iss:"academix-api",aud:"academix-clients"})).toString("base64url")}.signature`,tokenType:"Bearer",expiresIn:900};};
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
function deferred<T>() {let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return {resolve,promise};}

async function mount(options:{url?:string;hydrate?:boolean;reply?:(request:Request)=>Response|Promise<Response>}={}){
  const dom=new JSDOM('<div id="root"></div>',{url:options.url??"https://uc.academix.dvillasc.me/login"});
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
  const container=dom.window.document.getElementById("root")!;
  let root:Root;
  let initialHtml="";
  const hydrationErrors:unknown[]=[];
  let path=dom.window.location.pathname;
  if(path==="/institutions"){path="/courses";dom.window.history.replaceState({},"",path);}
  let custom:ReactNode;
  const router:AppRouterInstance={back(){},forward(){},refresh(){},prefetch(){},bfcacheId:"test",
    push(href){navigate(href);},replace(href){navigate(href);}};
  function navigate(href:string){if(href==="/institutions")href="/courses";dom.window.history.replaceState({},"",href);path=dom.window.location.pathname;render();}
  function render(){
    const match=path.match(/^\/institutions\/([a-z0-9-]+)$/);
    const view=custom??(path==="/"?createElement(Home):match || path==="/courses" || path.startsWith("/attempts/")?createElement(ProtectedInstitution,{slug:match?.[1]},createElement("p",null,"PRIVATE_CONTENT")):
      createElement(LoginForm));
    const tree=createElement(AppRouterContext.Provider,{value:router},createElement(PathnameContext.Provider,{value:path},createElement(SessionProvider,null,view)));
    if(!root && options.hydrate){
      initialHtml=renderToString(tree);container.innerHTML=initialHtml;
      root=hydrateRoot(container,tree,{onRecoverableError:error=>hydrationErrors.push(error)});
    }else{root??=createRoot(container);root.render(tree);}
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
  return {dom,doc,requests,submit,click,initialHtml,hydrationErrors,get path(){return path;},
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
    ui.doc.querySelector<HTMLButtonElement>("button[type=submit]")!.focus();await ui.submit("not an email","");assert.equal(ui.doc.activeElement?.id,"login-message");
    await ui.submit("persona@example.test", "ñ".repeat(65));assert.match(ui.doc.body.textContent!,/contraseña es demasiado larga/);assert.equal(ui.requests.length,0);
    await ui.submit();assert.equal(ui.path,"/courses");assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    assert.deepEqual(await ui.requests[0].json(),{email:"persona@example.test",password:" pass "});
    await ui.navigate("/institutions");assert.equal(ui.path,"/courses");assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    assert.ok(ui.requests.some(request=>new URL(request.url).pathname==="/api/v1/institution/uc/me"));
    assert.match(ui.doc.body.textContent!,/Persona · persona@example.test/);
    await ui.navigate("/institutions/utfsm");assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);await ui.navigate("/courses");
    await ui.click("Cerrar sesión");assert.equal(ui.path,"/login");assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT|persona@example.test/);
    await ui.navigate("/courses");assert.equal(ui.path,"/login");assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    assert.equal(ui.dom.window.localStorage.length,0);assert.equal(ui.dom.window.sessionStorage.length,0);assert.equal(ui.doc.cookie,"");
  }finally{await ui.close();}
});

test("initial protected route and reload contain no private shell or content",async()=>{
  const ui=await mount({url:"https://uc.academix.dvillasc.me/courses"});try{
    assert.equal(ui.path,"/login");assert.match(ui.dom.window.location.search,/next=/);assert.doesNotMatch(ui.doc.body.innerHTML,/PRIVATE_CONTENT|Contexto institucional/);
    await ui.submit();assert.equal(ui.path,"/courses");assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
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
    assert.equal(ui.path,"/courses");
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
    status=200;await ui.submit();assert.equal(ui.path,"/courses");
  }finally{await ui.close();t.mock.timers.reset();}
});

test("unknown hosts block login and mismatched institution subdomains block content",async()=>{
  const bad=await mount({url:"https://evil.test/login"});try{assert.match(bad.doc.body.textContent!,/Elige tu universidad para continuar/);assert.equal(bad.doc.querySelector("form"),null);assert.equal(bad.requests.length,0);}finally{await bad.close();}
  const ui=await mount({url:"https://uc.academix.dvillasc.me/login?next=%2Finstitutions%2Futfsm"});try{
    await ui.submit();assert.equal(ui.path,"/courses");await ui.navigate("/institutions/utfsm");assert.match(ui.doc.body.textContent!,/Elige tu universidad para continuar/);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    await ui.navigate("/institutions");assert.equal(ui.path,"/courses");assert.equal(ui.doc.querySelector('a[href="/institutions"]'),null);
  }finally{await ui.close();}
  const picker=await mount({url:"https://evil.test/institutions"});try{assert.match(picker.doc.body.textContent!,/Elige tu universidad para continuar/);}finally{await picker.close();}
});

test("context loading hides children; revocation, outage, retry and 401 fail closed",async()=>{
  let status=200;let pending:ReturnType<typeof deferred<Response>>|undefined;
  const ui=await mount({reply:r=>r.method==="POST"?Response.json(login()):r.url.endsWith("/me")?(pending?pending.promise:Response.json(status===200?user():{detail:"PRIVATE_INTERNAL"},{status})):Response.json({items:[institution()]})});try{
    await ui.submit();pending=deferred<Response>();await act(async()=>{ui.dom.window.dispatchEvent(new ui.dom.window.Event("focus"));await flush();});
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

test("directory verification outage prevents login and supports explicit resubmission",async()=>{
  let fail=true;
  const ui=await mount({reply:r=>r.method==="POST"?Response.json(login()):r.url.endsWith('/me')?Response.json(user()):fail?Response.json({}, {status:503}):Response.json({items:[institution()]})});
  try{await ui.submit();assert.equal(ui.path,'/login');assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    fail=false;await ui.submit();assert.equal(ui.path,'/courses');assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
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
    await ui.submit();await ui.navigate("/courses");assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    await act(async()=>{t.mock.timers.tick(900_001);await flush();});assert.equal(ui.path,"/login");assert.match(ui.doc.body.textContent!,/sesión venció/);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    await ui.submit();await ui.navigate("/courses");
    const count=ui.requests.length;globalThis.fetch=async()=>{throw new Error("offline");};await ui.click("Cerrar sesión");
    assert.equal(ui.path,"/login");assert.equal(ui.requests.length,count);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
  }finally{await ui.close();t.mock.timers.reset();}
});

for(const status of [400,403,404,413,415,503,0,-1]) {
  test(`login feedback ${status} is announced, focused, safe and never retried`,async()=>{
    const ui=await mount({reply:()=>{if(status===0)throw new Error("PRIVATE_NETWORK");return status===-1?Response.json({}):Response.json({detail:"PRIVATE_INTERNAL"},{status});}});
    try {await ui.submit();assert.equal(ui.requests.length,1);assert.equal(ui.doc.activeElement?.id,"login-message");
      assert.equal(ui.doc.querySelector('#login-message')?.getAttribute('aria-live'),"polite");
      assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_/);assert.equal(ui.doc.querySelector<HTMLInputElement>('#password')?.value,"");
    }finally{await ui.close();}
  });
}
test("UTFSM selects its own context for multi membership without opening selector",async()=>{
  const ui=await mount({url:"https://utfsm.academix.dvillasc.me/login"});try{
    await ui.submit();assert.equal(ui.path,"/courses");assert.match(ui.doc.body.textContent!,/Institución: UTFSM/);
    assert.ok(ui.requests.some(r=>r.url.endsWith('/institution/utfsm/me')));
    assert.ok(ui.requests.every(r=>!r.url.includes('/institution/uc/')));
  }finally{await ui.close();}
});
for(const value of [403,404,"inactive","malformed"] as const){
  test(`context ${value} cannot mount private children despite accessible directory`,async()=>{
    const ui=await mount({reply:r=>r.method==="POST"?Response.json(login()):!r.url.endsWith('/me')?Response.json({items:[institution()]}):
      typeof value==="number"?Response.json({detail:"PRIVATE_INTERNAL"},{status:value}):Response.json(value==="malformed"?{}:{...user(),institutionMembership:{...user().institutionMembership,institution:{...institution(),active:false}}})});
    try{await ui.submit();assert.equal(ui.path,"/courses");assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT|persona@example.test|PRIVATE_INTERNAL|Contexto institucional/);}finally{await ui.close();}
  });
}
test("unknown origins and loopback never redirect to login or fetch private context",async()=>{
  for(const origin of ["http://localhost:3000","http://127.0.0.1:3000","https://uc.academix.dvillasc.me:444","https://uc.academix.dvillasc.me.evil.test"]){
    const ui=await mount({url:origin+'/courses'});try{assert.equal(ui.path,'/courses');assert.equal(ui.requests.length,0);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);}finally{await ui.close();}
  }
});
test("late context body and pageshow cannot restore DOM after pagehide",async()=>{
  const body=deferred<Uint8Array>();let delayed=false;
  const ui=await mount({reply:r=>r.method==="POST"?Response.json(login()):r.url.endsWith('/me')?(delayed?new Response(new ReadableStream({async start(c){c.enqueue(await body.promise);c.close();}})):Response.json(user())):Response.json({items:[institution()]})});
  try{await ui.submit();assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);delayed=true;
    await act(async()=>{ui.dom.window.dispatchEvent(new ui.dom.window.Event('focus'));await flush();});
    assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    await act(async()=>{ui.dom.window.dispatchEvent(new ui.dom.window.Event('pagehide'));await flush();body.resolve(new TextEncoder().encode(JSON.stringify(user())));await flush();ui.dom.window.dispatchEvent(new ui.dom.window.Event('pageshow'));await flush();});
    assert.equal(ui.path,'/login');assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT|persona@example.test/);
    assert.equal(ui.dom.window.localStorage.length,0);assert.equal(ui.dom.window.sessionStorage.length,0);assert.equal(ui.doc.cookie,'');
  }finally{await ui.close();}
});

for(const [query,expected] of [["next=%2Finstitutions","/courses"],["next=%252Finstitutions","/courses"],["next=%2Finstitutions&next=%2Finstitutions","/courses"],["next=https%3A%2F%2Fevil.test","/courses"],["next=%2Fcourses%3Fx%3D1","/courses"],["next=%2Finstitutions%2Fuc","/courses"]]) {
  test(`login return ${query} resolves exactly once`,async()=>{
    const ui=await mount({url:`https://uc.academix.dvillasc.me/login?${query}`});
    try{await ui.submit();assert.equal(ui.path,expected);assert.doesNotMatch(ui.dom.window.location.href,/signature|password|accessToken/);}finally{await ui.close();}
  });
}
test("institutions compatibility route redirects without rendering a selector",()=>{
  assert.throws(()=>InstitutionsPage(),(error:unknown)=>error instanceof Error && 'digest' in error && String(error.digest).includes('/courses'));
});
test("accessible directory is never rendered as institution choices",async()=>{
  const ui=await mount();try{await ui.submit();assert.equal(ui.doc.querySelector('a[href="/institutions"]'),null);
    assert.doesNotMatch(ui.doc.body.textContent!,/Tus instituciones/);assert.equal(ui.doc.querySelector('input[name="slug"]'),null);
  }finally{await ui.close();}
});

test("local UC and UTFSM use configured origins and clean same/cross document destinations",async()=>{
  const old=process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS;
  process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS=JSON.stringify({'http://uc.localhost:3000':'uc','http://utfsm.localhost:3000':'utfsm'});
  try{for(const slug of ['uc','utfsm']){
    const ui=await mount({url:`http://${slug}.localhost:3000/courses`});try{
      assert.equal(ui.path,'/login');await ui.submit();assert.match(ui.doc.body.textContent!,new RegExp(`Institución: ${slug.toUpperCase()}`));
      await ui.navigate(`/institutions/${slug}`);assert.equal(ui.path,'/courses');
      const count=ui.requests.filter(r=>r.method==='POST').length;await ui.navigate('/institutions');const other=slug==='uc'?'utfsm':'uc';
      assert.equal(ui.path,'/courses');assert.equal(ui.doc.querySelector('a[href="/institutions"]'),null);
      assert.equal(ui.requests.filter(r=>r.method==='POST').length,count);
      await ui.navigate(`/institutions/${other}`);assert.match(ui.doc.body.textContent!,/Elige tu universidad para continuar/);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
    }finally{await ui.close();}
  }}finally{if(old===undefined)delete process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS;else process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS=old;}
});
test("a fresh document after authenticated teardown has no shared identity",async()=>{
  const first=await mount();try{await first.submit();assert.match(first.doc.body.textContent!,/PRIVATE_CONTENT/);}finally{await first.close();}
  const second=await mount({url:'https://uc.academix.dvillasc.me/courses'});try{assert.equal(second.path,'/login');assert.equal(second.requests.length,0);assert.doesNotMatch(second.doc.body.textContent!,/PRIVATE_CONTENT|persona@example.test/);}finally{await second.close();}
});

test("revocation revalidation wins over an older successful context body",async()=>{
  const body=deferred<Uint8Array>();let mode="active";
  const ui=await mount({reply:r=>r.method==="POST"?Response.json(login()):!r.url.endsWith('/me')?Response.json({items:[institution()]}):
    mode==="active"?Response.json(user()):mode==="revoked"?Response.json({}, {status:404}):new Response(new ReadableStream({async start(c){c.enqueue(await body.promise);c.close();}}))});
  try{await ui.submit();assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);mode="delayed";
    await act(async()=>{ui.dom.window.dispatchEvent(new ui.dom.window.Event('focus'));await flush();});
    assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);mode="revoked";
    await act(async()=>{ui.dom.window.dispatchEvent(new ui.dom.window.Event('focus'));await flush();});
    assert.match(ui.doc.body.textContent!,/Recurso no disponible/);
    await act(async()=>{body.resolve(new TextEncoder().encode(JSON.stringify(user())));await flush();});
    assert.match(ui.doc.body.textContent!,/Recurso no disponible/);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT|persona@example.test/);
  }finally{await ui.close();}
});

test("an unavailable resource context unmounts private content without revalidation loops",async()=>{
 let session:ReturnType<typeof useSession>['session']|undefined;
 function ResourceProbe(){session=useSession().session;return null;}
 const ui=await mount({reply:r=>r.method==='POST'?Response.json(login()):r.url.endsWith('/me')?Response.json(user()):r.url.endsWith('/courses')?Response.json({},{status:403}):Response.json({items:[institution()]})});
 try{await ui.submit();await ui.custom(createElement(ProtectedInstitution,null,createElement(ResourceProbe),'PRIVATE_RESOURCE'));
 await act(async()=>{try{await session!.request(c=>c.GET('/api/v1/institution/{institutionSlug}/courses',{params:{path:{institutionSlug:'uc'}}}));}catch{}await flush();});
 assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_RESOURCE|persona@example.test/);assert.match(ui.doc.body.textContent!,/Permisos insuficientes/);assert.ok(ui.requests.filter(r=>r.url.endsWith('/me')).length<=3);
 }finally{await ui.close();}
});

test("login keeps one known attempt next, rejects duplicate next",async()=>{
 const path="/attempts/10000000-0000-4000-8000-000000000080";
 for(const query of [`?next=${encodeURIComponent(path)}`,`?next=${encodeURIComponent(path)}&next=${encodeURIComponent(path)}`]){
 const ui=await mount({url:"https://uc.academix.dvillasc.me/login"+query});
 try{await ui.submit();assert.equal(ui.path,query.includes("&")?"/courses":path);}finally{await ui.close();}
 }
});

test("protected known attempt returns through login to exact pathname",async()=>{
 const path='/attempts/10000000-0000-4000-8000-000000000080';
 const ui=await mount({url:'https://uc.academix.dvillasc.me'+path});
 try{assert.equal(ui.path,'/login');assert.equal(new URLSearchParams(ui.dom.window.location.search).get('next'),path);await ui.submit();assert.equal(ui.path,path);assert.match(ui.doc.body.textContent!,/PRIVATE_CONTENT/);}finally{await ui.close();}
});

test("public portal hydrates neutrally and offers only configured institutional logins while backend is down",async()=>{
  const ui=await mount({url:"https://academix-frontend-2ixy.onrender.com/?next=https://evil.test",hydrate:true,reply:()=>{throw new Error("offline");}});
  try{
    assert.match(ui.initialHtml,/Preparando acceso/);assert.doesNotMatch(ui.initialHtml,/Elige tu universidad|<form|Correo electrónico/);
    assert.deepEqual(ui.hydrationErrors,[]);
    assert.equal(ui.doc.querySelector('h1')?.textContent,"Tus cursos, materiales y notas, en un solo lugar.");
    const links=Array.from(ui.doc.querySelectorAll<HTMLAnchorElement>('#instituciones a'));
    assert.deepEqual(links.map(a=>a.href),["https://uc.academix.dvillasc.me/login","https://utfsm.academix.dvillasc.me/login"]);
    assert.match(links[0].textContent!,/Pontificia Universidad Católica de Chile/);
    assert.match(links[1].textContent!,/Universidad Técnica Federico Santa María/);
    assert.equal(ui.doc.querySelector('a[href="/login"]'),null);assert.equal(ui.doc.querySelector('form'),null);
    assert.ok(Array.from(ui.doc.querySelectorAll<HTMLAnchorElement>('a')).every(a=>a.getAttribute('href')?.startsWith('#') || links.includes(a)));
    await ui.click("Cambiar tema");assert.equal(ui.doc.documentElement.dataset.theme,"dark");
    await ui.click("Cambiar tema");assert.equal(ui.doc.documentElement.dataset.theme,"light");
    ui.doc.querySelector<HTMLAnchorElement>('.skip-link')!.focus();assert.equal(ui.doc.activeElement?.textContent,"Saltar al contenido");
    assert.equal(ui.requests.length,0);assert.equal(ui.dom.window.localStorage.length,0);assert.equal(ui.dom.window.sessionStorage.length,0);assert.equal(ui.doc.cookie,"");
  }finally{await ui.close();}
});

test("institutional roots replace with local login without rendering a landing or contacting backend",async()=>{
  for(const slug of ["uc","utfsm"]){
    const ui=await mount({url:`https://${slug}.academix.dvillasc.me/`,hydrate:true,reply:()=>{throw new Error("offline");}});
    try{assert.equal(ui.path,"/login");assert.equal(ui.dom.window.location.origin,`https://${slug}.academix.dvillasc.me`);
      assert.match(ui.initialHtml,/Preparando acceso/);assert.doesNotMatch(ui.initialHtml,/Elige tu universidad|<form/);
      assert.deepEqual(ui.hydrationErrors,[]);assert.equal(ui.doc.querySelector('#instituciones'),null);assert.ok(ui.doc.querySelector('form'));assert.equal(ui.requests.length,0);
    }finally{await ui.close();}
  }
});

test("portal login and private routes reject before hydration or API calls; unknown roots also fail closed",async()=>{
  for(const origin of ["https://academix-frontend-2ixy.onrender.com","https://academix-frontend-2ixy.onrender.com.evil.test","https://uc.academix.dvillasc.me:444","https://unknown.academix.dvillasc.me"]){
    for(const path of ["/","/login","/courses","/attempts/"+id,"/institutions/uc"]){
      if(origin==="https://academix-frontend-2ixy.onrender.com" && path==="/")continue;
      const ui=await mount({url:origin+path,hydrate:true,reply:()=>{throw new Error("offline");}});
      try{
        assert.deepEqual(ui.hydrationErrors,[]);assert.equal(ui.doc.querySelector('form'),null);
        assert.equal(ui.doc.querySelector('#instituciones'),null);assert.doesNotMatch(ui.initialHtml,/<form|PRIVATE_CONTENT|Correo electrónico/);
        assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);assert.equal(ui.requests.length,0);assert.equal(ui.path,path);
        assert.ok(ui.doc.querySelector('[role="alert"]'));
      }finally{await ui.close();}
    }
  }
});

test("local portal and institutional roots reproduce the public flow without backend",async()=>{
  const saved=[process.env.NEXT_PUBLIC_PORTAL_ORIGIN,process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS];
  process.env.NEXT_PUBLIC_PORTAL_ORIGIN="http://localhost:3000";
  process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS=JSON.stringify({"http://uc.localhost:3000":"uc","http://utfsm.localhost:3000":"utfsm"});
  try{
    for(const host of ["localhost","uc.localhost","utfsm.localhost"]){
      const ui=await mount({url:`http://${host}:3000/`,reply:()=>{throw new Error("offline");}});
      try{assert.equal(ui.requests.length,0);
        if(host==="localhost")assert.deepEqual(Array.from(ui.doc.querySelectorAll<HTMLAnchorElement>('#instituciones a')).map(a=>a.href),["http://uc.localhost:3000/login","http://utfsm.localhost:3000/login"]);
        else{assert.equal(ui.path,"/login");assert.equal(ui.doc.querySelector('#instituciones'),null);}
        await ui.navigate('/courses');assert.equal(ui.requests.length,0);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT/);
        if(host==="localhost"){await ui.navigate('/login');assert.equal(ui.doc.querySelector('form'),null);}
      }finally{await ui.close();}
    }
  }finally{for(const [index,key] of ["NEXT_PUBLIC_PORTAL_ORIGIN","NEXT_PUBLIC_INSTITUTION_ORIGINS"].entries()){if(saved[index]===undefined)delete process.env[key];else process.env[key]=saved[index];}}
});

test("portal guards do not load context even with an authenticated in-memory fixture",async()=>{
  let session:ReturnType<typeof useSession>['session']|undefined;
  function Probe(){session=useSession().session;return null;}
  const ui=await mount({url:"https://academix-frontend-2ixy.onrender.com/login"});
  try{
    // Seed the session directly, bypassing the UI, to exercise the authenticated guard branch.
    await ui.custom(createElement(Probe));await act(async()=>{await session!.login("persona@example.test","fixture");await flush();});
    const before=ui.requests.length;assert.equal(session!.getSnapshot().status,"authenticated");
    await ui.custom(undefined);assert.equal(ui.doc.querySelector('form'),null);assert.equal(ui.path,'/login');
    await ui.navigate('/courses');assert.match(ui.doc.body.textContent!,/Elige tu universidad para continuar/);
    assert.equal(ui.doc.querySelector('a'),null); // No institution selection links inside an active session.
    assert.equal(ui.requests.length,before);assert.doesNotMatch(ui.doc.body.textContent!,/PRIVATE_CONTENT|persona@example.test/);
    assert.ok(ui.requests.every(r=>!r.url.endsWith('/me')));
  }finally{await ui.close();}
});

test("invalid build configuration rejects the root without landing, credentials or requests",async()=>{
  const saved=process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS;
  try{
    for(const config of ["bad",JSON.stringify({"https://academix-frontend-2ixy.onrender.com":"uc"})]){
      process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS=config;
      for(const origin of ["https://academix-frontend-2ixy.onrender.com","https://uc.academix.dvillasc.me"]){
        const ui=await mount({url:origin+'/',hydrate:true});
        try{assert.ok(ui.doc.querySelector('[role="alert"]'));assert.equal(ui.doc.querySelector('#instituciones'),null);
          assert.equal(ui.doc.querySelector('form'),null);assert.equal(ui.doc.querySelector('a'),null);assert.equal(ui.requests.length,0);assert.deepEqual(ui.hydrationErrors,[]);
        }finally{await ui.close();}
      }
    }
  }finally{if(saved===undefined)delete process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS;else process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS=saved;}
});

test("unavailable access offers only validated public recovery, without development details or API calls",async()=>{
  for(const origin of ["https://academix-frontend-2ixy.onrender.com","https://unknown.example.test"]){
    for(const path of ["/login","/courses"]){
      const ui=await mount({url:origin+path+'?next=https://evil.test',hydrate:true});
      try{
        const recovery=ui.doc.querySelector<HTMLAnchorElement>('a');assert.ok(recovery);
        assert.equal(recovery.textContent,'Elegir universidad');
        assert.equal(recovery.href,'https://academix-frontend-2ixy.onrender.com/#instituciones');
        assert.doesNotMatch(ui.doc.body.textContent!,/localhost|desarrollo|configuraci[oó]n|dominio|Contexto institucional/);
        assert.equal(ui.doc.querySelector('form'),null);assert.equal(ui.requests.length,0);
        assert.equal(ui.path,path);assert.deepEqual(ui.hydrationErrors,[]);
      }finally{await ui.close();}
    }
  }
});

test("recovery follows explicit local portal configuration and disappears if portal config is invalid",async()=>{
  const saved=[process.env.NEXT_PUBLIC_PORTAL_ORIGIN,process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS];
  process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS=JSON.stringify({'http://uc.localhost:3000':'uc','http://utfsm.localhost:3000':'utfsm'});
  try{
    for(const portal of ['http://localhost:3000','javascript:alert(1)','']){
      process.env.NEXT_PUBLIC_PORTAL_ORIGIN=portal;
      const ui=await mount({url:'http://localhost:3000/courses'});
      try{
        const recovery=ui.doc.querySelector<HTMLAnchorElement>('a');
        if(portal==='http://localhost:3000')assert.equal(recovery?.href,'http://localhost:3000/#instituciones');
        else assert.equal(recovery,null);
        assert.equal(ui.doc.querySelector('form'),null);assert.equal(ui.requests.length,0);
      }finally{await ui.close();}
    }
  }finally{for(const [index,key]of ['NEXT_PUBLIC_PORTAL_ORIGIN','NEXT_PUBLIC_INSTITUTION_ORIGINS'].entries()){if(saved[index]===undefined)delete process.env[key];else process.env[key]=saved[index];}}
});
