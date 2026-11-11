import {test,expect} from '../fixtures/test.ts';
import {Api,status} from '../helpers/api.ts';
import {login,go,course} from '../helpers/browser.ts';
import {apiBase,origin} from '../runner/settings.ts';
import {request} from 'node:http';

test('E2E-AUTH-003 inactive identity and outstanding token / inactive @regression',async ({e,page})=>{
  await page.goto(origin()+'/login');
  await page.getByLabel('Correo electrónico',{exact:true}).fill(e.data.actors.INACTIVE.email);
  await page.getByLabel('Contraseña',{exact:true}).fill(e.password);
  const response=page.waitForResponse(r=>r.url().endsWith('/auth/login'));
  await page.getByRole('button',{name:'Continuar',exact:true}).click();expect((await response).status()).toBe(401);
  await expect(page.getByLabel('Contraseña',{exact:true})).toHaveValue('');
  const api=await e.api('ST1');status(await api.get('courses'),200);
  await e.pool.query('UPDATE users SET active=false WHERE id=$1',[e.data.actors.ST1.id]);
  for(const path of ['me','courses'])status(await api.get(path),401);
  await expect(page.getByRole('heading',{name:'Mis cursos',exact:true})).toHaveCount(0);
});

test('E2E-AUTH-008 global login without institutional membership / no-membership @regression',async ({e,page})=>{
  await page.goto(origin()+'/login');
  await page.getByLabel('Correo electrónico',{exact:true}).fill(e.data.actors.NONE.email);
  await page.getByLabel('Contraseña',{exact:true}).fill(e.password);
  const response=page.waitForResponse(r=>r.url().endsWith('/auth/login'));
  await page.getByRole('button',{name:'Continuar',exact:true}).click();expect((await response).status()).toBe(200);
  const api=await e.api('NONE');
  expect(status(await api.request('/api/v1/institutions'),200).body.items).toEqual([]);
  for(const path of ['me','courses'])status(await api.get(path),404);
  await expect(page.getByRole('heading',{name:'Mis cursos',exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Recurso no disponible',exact:true})).toBeVisible();
});

test('E2E-AUTH-011 logout discards actor state and requests / logout @smoke',async ({e,actorPage})=>{
  const page=await actorPage('ST1');await go(page,e.data.courses.C1,'/grades');
  await expect(page.getByRole('heading',{name:'Mis notas',exact:true})).toBeVisible();await expect(page.getByRole('navigation',{name:'Curso',exact:true})).toBeVisible();
  const token=e.tokens.get('ST1');
  await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Iniciar sesión',exact:true})).toBeVisible();
  let stale=0;page.on('request',r=>{if(r.headers().authorization===`Bearer ${token}`)stale++;});
  await login(page,e,'ST2');await course(page,e.data.courses.C1);
  await page.goBack();
  await expect(page.getByText(e.data.actors.ST1.name,{exact:true})).toHaveCount(0);
  await expect(page.getByText(e.data.actors.ST2.name,{exact:true})).toBeVisible();expect(stale).toBe(0);
  status(await new Api(token).get('me'),200); // Logout is local, not server-side JWT revocation.
});

test('E2E-AUTH-016 client expiration clears private content / expiration @regression',async ({e,page})=>{
  await page.clock.install();await login(page,e);await go(page,e.data.courses.C1,'/grades');
  await expect(page.getByRole('heading',{name:'Mis notas',exact:true})).toBeVisible();await expect(page.getByRole('navigation',{name:'Curso',exact:true})).toBeVisible();
  let writes=0;
  page.on('request',r=>{if(['POST','PUT','PATCH'].includes(r.method()))writes++;});
  await page.clock.fastForward(901000);
  await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('pageshow'));});
  await expect(page.getByRole('heading',{name:'Iniciar sesión',exact:true})).toBeVisible();
  await expect(page.getByText(e.data.actors.ST1.name,{exact:true})).toHaveCount(0);expect(writes).toBe(0);
});

const invalidClaims={expired:{iat:1,exp:901},issuer:{iss:'foreign'},audience:{aud:'foreign'},future:{iat:4102444800,exp:4102445700}};
for(const variant of ['signature','none',...Object.keys(invalidClaims)])test(`E2E-AUTH-017 invalid JWT rejected / ${variant} @extended`,async ({e})=>{
  const valid=await e.token('ST1');
  let token=variant in invalidClaims?e.syntheticToken('ST1',invalidClaims[variant as keyof typeof invalidClaims]):valid;
  if(variant==='signature') {const parts=valid.split('.');parts[2]=(parts[2][0]==='a'?'b':'a')+parts[2].slice(1);token=parts.join('.');}
  if(variant==='none')token=Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url')+'.'+valid.split('.')[1]+'.';
  for(const path of ['me','courses']) {
    const r=status(await new Api(token).get(path),401);expect(r.headers.get('www-authenticate')).toBe('Bearer');
  }
  status(await new Api(valid).get('me'),200);
});
for(const variant of ['duplicate','multiple','blank','oversized'])test(`E2E-AUTH-018 ambiguous authorization rejected / ${variant} @extended`,async ({e})=>{
  const token=await e.token('ST1');
  const headers=variant==='duplicate'?['Authorization',`Bearer ${token}`,'Authorization',`Bearer ${token}`]:['Authorization',variant==='multiple'?`Bearer ${token}, Bearer ${token}`:variant==='blank'?'Bearer ':'Bearer '+'x'.repeat(4097)];
  const result=await new Promise<{status:number;challenge?:string}>((ok,fail)=>{
    const req=request(apiBase+'/api/v1/institution/uc/me',{headers:['Host',new URL(apiBase).host,...headers]},res=>{res.resume();res.on('end',()=>ok({status:res.statusCode!,challenge:res.headers['www-authenticate']}));});req.on('error',fail);req.end();
  });
  expect(result.status).toBe(401);expect(result.challenge).toBe('Bearer');status(await new Api(token).get('me'),200);
});

test('E2E-AUTH-019 same-context tabs retain independent identity / independent-tabs @regression',async ({e,actorPage})=>{
  const a=await actorPage('ST1');const b=await a.context().newPage();await b.goto(origin()+'/courses');
  await expect(b.getByRole('heading',{name:'Iniciar sesión',exact:true})).toBeVisible();
  await login(b,e,'ST2');await course(a,e.data.courses.C1);await course(b,e.data.courses.C1);
  await expect(a.getByText(e.data.actors.ST1.name,{exact:true})).toBeVisible();
  await expect(b.getByText(e.data.actors.ST2.name,{exact:true})).toBeVisible();
  await a.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
  await b.getByRole('link',{name:'Mis cursos',exact:true}).click();
  await expect(b.getByText(e.data.actors.ST2.name,{exact:true})).toBeVisible();
});
for(const fault of ['unavailable','malformed'])test(`E2E-AUTH-021 directory must confirm authentication / ${fault} @regression`,async ({e,page})=>{
  await page.route('**/api/v1/institutions',r=>r.fulfill({status:fault==='unavailable'?503:200,contentType:'application/json',body:JSON.stringify(fault==='unavailable'?{status:503}:{items:'invalid'})}));
  await page.goto(origin()+'/login');
  await page.getByLabel('Correo electrónico',{exact:true}).fill(e.data.actors.ST1.email);
  await page.getByLabel('Contraseña',{exact:true}).fill(e.password);
  let posts=0;page.on('request',r=>{if(r.url().endsWith('/auth/login'))posts++;});
  const response=page.waitForResponse(r=>r.url().endsWith('/auth/login'));
  await page.getByRole('button',{name:'Continuar',exact:true}).click();expect((await response).status()).toBe(200);
  await expect(page.locator('#login-message')).not.toHaveText('');
  await expect(page.getByRole('heading',{name:'Mis cursos',exact:true})).toHaveCount(0);
  expect(posts).toBe(1);await page.unrouteAll();await login(page,e);expect(posts).toBe(2);
});

test('E2E-AUTH-007 real login quota and explicit recovery / rate-limit @extended',async ({e,page})=>{
  test.setTimeout(120000);
  for(let i=0;i<5;i++)status(await new Api().request('/api/v1/auth/login','POST',{email:e.data.actors.ST1.email,password:'incorrect'}),401);
  await page.goto(origin()+'/login');
  await page.getByLabel('Correo electrónico',{exact:true}).fill(e.data.actors.ST1.email);
  await page.getByLabel('Contraseña',{exact:true}).fill(e.password);
  let posts=0;page.on('request',r=>{if(r.url().endsWith('/auth/login'))posts++;});
  const response=page.waitForResponse(r=>r.url().endsWith('/auth/login'));
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  const r=await response;expect(r.status()).toBe(429);
  expect(Number(r.headers()['retry-after'])).toBeGreaterThan(0);
  await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeEnabled({timeout:70000});
  expect(posts).toBe(1);await login(page,e);expect(posts).toBe(2);
});

test('E2E-AUTH-009 public requests omit bearer / public-headers @regression',async ({e,page,actorPage})=>{
  const actor=await actorPage('ST1');
  const privateResponse=actor.waitForResponse(r=>r.url().endsWith(`/courses/${e.data.courses.C1}`));
  await course(actor,e.data.courses.C1);
  expect(Boolean(await (await privateResponse).request().headerValue('authorization'))).toBe(true);
  for(const path of ['/health','/ready']) {
    const response=actor.waitForResponse(r=>r.url()===apiBase+path);
    await actor.evaluate(async url=>{await fetch(url,{credentials:'omit'});},apiBase+path);
    expect(await (await response).request().headerValue('authorization')).toBeNull();
  }
  const requests:boolean[]=[];page.on('request',r=>requests.push(Boolean(r.headers().authorization)));
  await page.goto('http://localhost:'+new URL(origin()).port);
  await expect(page.getByRole('heading',{name:'Elige tu universidad',exact:true})).toBeVisible();
  expect(requests.some(Boolean)).toBe(false);
});

test('E2E-AUTH-020 focus revalidation preserves unsaved answer / draft-focus @regression',async ({e,actorPage})=>{
  const attempt=await e.attempt();const page=await actorPage('ST1','uc',`/attempts/${attempt.id}`);
  const answer=page.getByRole('radio',{name:'Respuesta correcta 1',exact:true});
  await answer.check();let saves=0;let revalidations=0;
  page.on('request',r=>{if(r.method()==='PUT')saves++;if(r.url().endsWith('/me'))revalidations++;});
  const refreshed=page.waitForResponse(r=>r.url().endsWith('/me'));
  await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('pageshow'));document.dispatchEvent(new Event('visibilitychange'));});
  expect((await refreshed).status()).toBe(200);
  await expect(answer).toBeChecked();
  expect((await e.pool.query('SELECT answers FROM quiz_attempts WHERE id=$1',[attempt.id])).rows[0].answers).toEqual([]);
  expect(saves).toBe(0);expect(revalidations).toBe(1);
  const saved=page.waitForResponse(r=>r.request().method()==='PUT' && r.url().endsWith('/answers'));
  await page.getByRole('button',{name:'Guardar',exact:true}).click();expect((await saved).status()).toBe(200);
  expect((await e.pool.query('SELECT answers FROM quiz_attempts WHERE id=$1',[attempt.id])).rows[0].answers).toHaveLength(1);
});
