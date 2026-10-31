import {test,expect} from '../fixtures/test.ts';
import {origin,portal,webPort} from '../runner/settings.ts';
import {compatibilityNavigate} from '../helpers/browser.ts';

function observePublic(page: import('@playwright/test').Page) {
  const privateRequests: string[] = [];
  page.on('request',r=>{if(r.url().includes('/api/v1') || r.headers().authorization) privateRequests.push(new URL(r.url()).pathname);});
  return privateRequests;
}

test('E2E-PUBLIC-001 portal institution directory / directory @smoke',async ({page})=>{
  const privateRequests=observePublic(page);
  await page.goto(portal);
  await page.getByRole('link',{name:'Iniciar sesión',exact:true}).click();
  await expect(page).toHaveURL(portal+'/#instituciones');
  for(const slug of ['uc','utfsm']) {
    const link=page.locator(`a[href="${origin(slug)}/login"]`);
    await expect(link).toBeVisible();await link.click();
    await expect(page).toHaveURL(origin(slug)+'/login');
    await expect(page.getByRole('heading',{name:'Iniciar sesión',exact:true})).toBeVisible();
    await page.goBack();
  }
  expect(privateRequests).toEqual([]);
});
for(const slug of ['uc','utfsm']) test(`E2E-PUBLIC-002 institutional entry / ${slug} @regression`,async ({page})=>{
  const requests=observePublic(page);await page.goto(origin(slug));
  await expect(page).toHaveURL(origin(slug)+'/login');
  await expect(page.getByLabel('Correo electrónico',{exact:true})).toBeVisible();expect(requests).toEqual([]);
});
test('E2E-PUBLIC-003 portal anchors and history / anchors @extended',async ({page})=>{
  const requests=observePublic(page);await page.goto(portal);
  await page.getByRole('link',{name:'Qué puedes hacer',exact:true}).click();
  await expect(page).toHaveURL(portal+'/#funciones');
  await expect(page.getByRole('heading',{name:'Lo que necesitas para tus cursos',exact:true})).toBeInViewport();
  await page.getByRole('link',{name:'Elegir mi universidad',exact:true}).click();
  await expect(page).toHaveURL(portal+'/#instituciones');
  await page.goBack();await expect(page).toHaveURL(portal+'/#funciones');
  await page.goForward();await expect(page).toHaveURL(portal+'/#instituciones');
  await page.getByRole('link',{name:'Elegir universidad',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Elige tu universidad',exact:true})).toBeInViewport();expect(requests).toEqual([]);
});
for(const path of ['/','/login','/courses']) test(`E2E-PUBLIC-004 unknown origin blocked / ${path} @regression`,async ({page})=>{
  const requests=observePublic(page);await page.goto(`http://desconocida.localhost:${webPort}${path}`);
  await expect(page.getByRole('heading',{name:'Elige tu universidad para continuar',exact:true})).toBeVisible();
  await expect(page.getByLabel('Contraseña',{exact:true})).toHaveCount(0);expect(requests).toEqual([]);
});
test('E2E-PUBLIC-005 nonexistent route and resource recovery / missing @regression',async ({page, e, actorPage})=>{
  await page.goto(origin()+'/no-existe');
  await expect(page.getByRole('heading',{name:'Recurso no disponible',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Volver al inicio',exact:true}).click();
  await expect(page).toHaveURL(origin()+'/login');
  const actor=await actorPage('ST1');
  const missing=e.id('missing-course');
  const response=actor.waitForResponse(r=>r.url().endsWith(`/courses/${missing}`));
  await compatibilityNavigate(actor,`/courses/${missing}`);
  expect((await response).status()).toBe(404);
  await expect(actor.locator('main').getByRole('alert')).toBeVisible();
  await actor.getByRole('link',{name:'Mis cursos',exact:true}).click();
  await expect(actor.getByRole('heading',{name:'Mis cursos',exact:true})).toBeVisible();
});
for(const slug of ['uc','utfsm']) test(`E2E-PUBLIC-006 legacy slug host agreement / ${slug} @regression`,async ({actorPage})=>{
  const page=await actorPage('ST1');const requests:string[]=[];
  page.on('request',r=>{if(r.url().includes('/institution/utfsm/'))requests.push(r.url());});
  await compatibilityNavigate(page,`/institutions/${slug}`);
  if(slug==='uc') await expect(page).toHaveURL(origin()+'/courses');
  else await expect(page.getByRole('heading',{name:'Elige tu universidad para continuar',exact:true})).toBeVisible();
  expect(requests).toEqual([]);
});
test('E2E-PUBLIC-007 legacy directory redirects without membership selector / legacy-directory @regression',async ({actorPage})=>{
  const page=await actorPage('ST1');await compatibilityNavigate(page,'/institutions');
  await expect(page).toHaveURL(origin()+'/courses');
  await expect(page.getByRole('heading',{name:'Mis cursos',exact:true})).toBeVisible();
  await page.goBack();await page.goForward();
  await expect(page.getByText('Curso E2E F1',{exact:true})).toHaveCount(0);
});
