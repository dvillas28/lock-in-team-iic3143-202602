import {test,expect} from '../fixtures/test.ts';
import {origin,apiBase} from '../runner/settings.ts';
import {Api,status} from '../helpers/api.ts';
import {login,course,compatibilityNavigate,go} from '../helpers/browser.ts';
import {prepareProfile} from '../data/profiles.ts';

const fill = async (page: import('@playwright/test').Page,email:string,password:string) => {
  await page.getByLabel('Correo electrónico',{exact:true}).fill(email);
  await page.getByLabel('Contraseña',{exact:true}).fill(password);
};

test('E2E-AUTH-002 credential failures indistinguishable / indistinguishable @regression',async ({e,page})=>{
  await page.goto(origin()+'/login');const messages:string[]=[];const responses:unknown[]=[];
  for(const email of [e.data.actors.ST1.email,'nobody@example.test']) {
    await fill(page,email,'wrong-password');
    const response=page.waitForResponse(r=>r.url().endsWith('/auth/login'));
    await page.getByRole('button',{name:'Continuar',exact:true}).click();
    const r=await response;expect(r.status()).toBe(401);
    const {traceId: _trace,...body}=await r.json();responses.push(body);
    await expect(page.locator('#login-message')).not.toHaveText('');
    messages.push(await page.locator('#login-message').innerText());
    await expect(page.getByLabel('Contraseña',{exact:true})).toHaveValue('');
    await expect(page.getByRole('heading',{name:'Mis cursos',exact:true})).toHaveCount(0);
  }
  expect(messages[0]).toBe(messages[1]);expect(responses[0]).toEqual(responses[1]);
});
test('E2E-AUTH-004 local validation and correction / local-validation @regression',async ({e,page})=>{
  await page.goto(origin()+'/login');let requests=0;page.on('request',r=>{if(r.url().endsWith('/auth/login'))requests++;});
  for(const [email,password] of [['',''],['invalid',e.password],[e.data.actors.ST1.email,'']]) {
    await fill(page,email,password);await page.getByRole('button',{name:'Continuar',exact:true}).click();
    await expect(page.locator('#login-message')).not.toHaveText('');await expect(page.locator('#login-message')).toBeFocused();expect(requests).toBe(0);
  }
  status(await new Api().request('/api/v1/auth/login','POST',{}),400);
  await login(page,e);expect(requests).toBe(1);
});
test('E2E-AUTH-005 normalize email preserve password bytes / normalization @regression',async ({e,page})=>{
  const original=e.data.actors.ST1.email;
  e.data.actors.ST1.email='  '+original.toUpperCase()+'  ';
  await login(page,e);e.data.actors.ST1.email=original;
  await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
  await fill(page,original,e.password+' ');
  const response=page.waitForResponse(r=>r.url().endsWith('/auth/login'));
  await page.getByRole('button',{name:'Continuar',exact:true}).click();expect((await response).status()).toBe(401);
  await login(page,e);
});
const boundaries = {
  email254: {body:{email:'a'.repeat(241)+'@example.test',password:'x'},expected:401},
  email255: {body:{email:'a'.repeat(242)+'@example.test',password:'x'},expected:400},
  password128: {body:{email:'a@example.test',password:'x'.repeat(128)},expected:401},
  password129: {body:{email:'a@example.test',password:'x'.repeat(129)},expected:400},
  array:{body:[],expected:400},extra:{body:{email:'a@example.test',password:'x',extra:true},expected:400},
  malformed:{raw:'{"email":',expected:400},oversized:{raw:'x'.repeat(4097),expected:413},media:{raw:'x',media:'text/plain',expected:415},
};
for(const [name,input] of Object.entries(boundaries)) test(`E2E-AUTH-006 login transport boundaries / ${name} @extended`,async ({e})=>{
  const r='raw' in input ? await fetch(apiBase+'/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'media' in input?input.media:'application/json'},body:input.raw}) : await new Api().request('/api/v1/auth/login','POST',input.body);
  expect(r.status).toBe(input.expected);
  status(await new Api().request('/api/v1/auth/login','POST',{email:e.data.actors.ST1.email,password:e.password}),200);
});
test('E2E-AUTH-010 SPA retains session reload discards it / spa-reload @smoke',async ({e,actorPage})=>{
  const page=await actorPage('ST1');await course(page,e.data.courses.C1);
  const listed=page.waitForResponse(r=>r.url().endsWith('/api/v1/institution/uc/courses'));
  await page.getByRole('link',{name:'Mis cursos',exact:true}).click();await listed;
  await expect(page.getByRole('heading',{name:'Curso E2E C1',exact:true})).toBeVisible();
  await expect(page.getByText(e.data.actors.ST1.name,{exact:true})).toBeVisible();
  const leaked:string[]=[];page.on('request',r=>{if(r.headers().authorization)leaked.push(r.url());});
  await page.reload();await expect(page.getByRole('heading',{name:'Iniciar sesión',exact:true})).toBeVisible();
  await page.goBack();await expect(page.getByText(e.data.actors.ST1.name,{exact:true})).toHaveCount(0);expect(leaked).toEqual([]);
});
test('E2E-AUTH-012 permitted grade deep link / grades-deeplink @regression',async ({e,page})=>{
  await prepareProfile(e,'HISTORY');const destination=`/courses/${e.data.courses.C1}/grades`;
  await page.goto(origin()+destination);await expect(page).toHaveURL(origin()+'/login?next='+encodeURIComponent(destination));
  await login(page,e,'ST1','uc',destination);
  await expect(page).toHaveURL(origin()+destination);await expect(page.getByRole('row').filter({hasText:'Quiz E2E Q1'})).toBeVisible();
});
const returns={external:'https://evil.example', 'protocol-relative':'//evil.example', duplicate:'/courses&next=/institutions',query:'/courses?x=1',hash:'/courses#x'};
for(const [name,next] of Object.entries(returns))test(`E2E-AUTH-013 unsafe return rejected / ${name} @regression`,async ({e,page})=>{
  let foreign=0;
  await page.route('**/*',async route=>{const host=new URL(route.request().url()).hostname;if(['uc.localhost','127.0.0.1'].includes(host))await route.continue();else{foreign++;await route.abort();}});
  await login(page,e,'ST1','uc',next,name==='duplicate'?'next=%2Fcourses&next=%2Finstitutions':undefined);
  await expect(page).toHaveURL(origin()+'/courses');
  expect(await page.evaluate(()=>Object.keys(sessionStorage))).toEqual([]);expect(foreign).toBe(0);
});
for(const kind of ['material','authoring'])test(`E2E-AUTH-014 restricted deep link uses fallback / ${kind} @regression`,async ({e,page})=>{
  const path=kind==='material'?`/courses/${e.data.courses.C1}/modules/${e.data.modules.M1}/materials/${e.data.materials.R1}`:`/courses/${e.data.courses.C1}/quizzes/${e.data.quizzes.QD}/authoring`;
  await page.goto(origin()+path);await expect(page.getByRole('heading',{name:'Iniciar sesión',exact:true})).toBeVisible();
  await login(page,e,'T1','uc',path);await expect(page).toHaveURL(origin()+'/courses');
  await go(page,e.data.courses.C1,kind==='material'?'/modules':'/quizzes');
  await expect(page.getByRole('navigation',{name:'Curso',exact:true})).toBeVisible();
  if(kind==='material') {
    await page.getByRole('button',{name:'Unidad E2E M1',exact:true}).click();
    await page.locator(`a[href="${path}"]`).click();
    await expect(page.getByRole('heading',{name:'Lectura E2E R1',exact:true})).toBeVisible();
  } else {
    await page.locator(`a[href="/courses/${e.data.courses.C1}/quizzes/${e.data.quizzes.QD}"]`).click();
    await page.getByRole('link',{name:'Editar quiz',exact:true}).click();
    await expect(page).toHaveURL(origin()+path);
  }
});
test('E2E-AUTH-015 login route while authenticated / active-login @regression',async ({actorPage})=>{
  const page=await actorPage('ST1');let posts=0;page.on('request',r=>{if(r.url().endsWith('/auth/login'))posts++;});
  await compatibilityNavigate(page,'/login');await expect(page).toHaveURL(origin()+'/courses');
  await expect(page.getByLabel('Contraseña',{exact:true})).toHaveCount(0);expect(posts).toBe(0);
});
for(const [name,length,expected] of [['unicode128',32,401],['unicode132',33,400]] as const)test(`E2E-AUTH-022 Unicode password byte limit / ${name} @extended`,async ({e})=>{
  status(await new Api().request('/api/v1/auth/login','POST',{email:e.data.actors.ST1.email,password:'😀'.repeat(length)}),expected);
  status(await new Api().request('/api/v1/auth/login','POST',{email:e.data.actors.ST1.email,password:e.password}),200);
});
