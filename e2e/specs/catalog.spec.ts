import {test,expect} from '../fixtures/test.ts';
import {catalog} from '../helpers/catalog.ts';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';

const catalogue=test.extend<{catalogue:Awaited<ReturnType<typeof catalog>>}>({
  catalogue:[async ({},use)=>{const c=await catalog();try{await use(c);}finally{await c.close();}},{timeout:120000}],
});
const operations=async (page:import('@playwright/test').Page)=>{
  await expect(page.locator('.opblock')).toHaveCount(50);
  await expect(page.getByRole('button',{name:/Try it out/i})).toHaveCount(0);
};
catalogue('E2E-CATALOG-001 static catalogue filter and deep link / filter-deeplink @regression',async ({catalogue:c,page})=>{
  const foreign:string[]=[];
  page.on('request',r=>{if(new URL(r.url()).origin!==c.base || r.url().includes('/api/v1/'))foreign.push(new URL(r.url()).pathname);});
  await page.goto(c.base+'/');await expect(page).toHaveURL(c.url);await operations(page);
  await page.getByPlaceholder('Filter by tag').fill('cursos');
  await expect(page.locator('.opblock')).not.toHaveCount(50);
  await page.getByPlaceholder('Filter by tag').fill('');await operations(page);
  const operation=page.locator('.opblock').filter({hasText:'login'}).first();
  await operation.locator('.opblock-summary-control').click();
  await expect(operation.locator('.opblock-body')).toBeVisible();
  const deep=page.url();expect(new URL(deep).hash).not.toBe('');
  const tab=await page.context().newPage();await tab.goto(deep);
  await expect(tab.locator('.opblock.is-open')).toHaveCount(1);expect(foreign).toEqual([]);
});
catalogue('E2E-CATALOG-002 OpenAPI download revision and operations / download @regression',async ({catalogue:c,page})=>{
  await page.goto(c.url);await operations(page);
  const download=page.waitForEvent('download');await page.getByRole('link',{name:'Descargar descripción OpenAPI 3.1',exact:true}).click();
  const file=await download;const doc=JSON.parse(await readFile((await file.path())!,'utf8'));
  expect(doc.openapi).toBe('3.1.0');expect(doc.info['x-source-revision']).toBe(c.manifest.revision);
  await expect(page.locator('header code')).toHaveText(c.manifest.revision);
  const ops=Object.values(doc.paths).flatMap((item:any)=>Object.values(item).filter((op:any)=>op?.operationId)) as any[];
  expect(ops).toHaveLength(50);expect(new Set(ops.map(op=>op.operationId)).size).toBe(50);
  expect(ops.every(op=>op['x-availability']==='implementada')).toBe(true);
  expect(JSON.stringify(doc)).not.toMatch(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  const noJs=await page.context().browser()!.newContext({javaScriptEnabled:false});
  try {const p=await noJs.newPage();await p.goto(c.url);await expect(p.getByRole('link',{name:'Descargar descripción OpenAPI 3.1',exact:true})).toBeVisible();}finally{await noJs.close();}
});
for(const fault of ['json500','invalid-json','bundle','keyboard-mobile'])catalogue(`E2E-CATALOG-003 static errors and accessible recovery / ${fault} @extended`,async ({catalogue:c,page})=>{
  if(fault==='json500')await page.route('**/openapi.json',r=>r.fulfill({status:500,body:'unavailable'}));
  if(fault==='invalid-json')await page.route('**/openapi.json',r=>r.fulfill({contentType:'application/json',body:'{"invalid":'}));
  if(fault==='bundle')await page.route('**/swagger-ui-bundle.js',r=>r.abort());
  await page.goto(c.url);
  if(fault==='keyboard-mobile') {
    await page.setViewportSize({width:375,height:812});await operations(page);
    await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Saltar al catálogo',exact:true})).toBeFocused();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.setViewportSize({width:720,height:450});await page.evaluate(()=>{document.documentElement.style.zoom='2';});
    await expect(page.getByRole('link',{name:'Descargar descripción OpenAPI 3.1',exact:true})).toBeVisible();
  } else {
    await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('.opblock')).toHaveCount(0);
    await expect(page.getByRole('link',{name:'Descargar descripción OpenAPI 3.1',exact:true})).toBeVisible();
    await page.unrouteAll();await page.reload();await operations(page);
  }
});
catalogue('E2E-CATALOG-004 failed build preserves published release / atomic-build @extended',async ({catalogue:c})=>{
  const entry=await readFile(join(c.output,'index.html'),'utf8');
  const releases=await readdir(join(c.output,'releases'));
  const original=JSON.parse(await readFile(join(c.manifest.directory,'openapi.json'),'utf8'));
  original.paths['/broken']={$ref:'./missing.json'};
  const source=join(c.folder,'invalid.json');await writeFile(source,JSON.stringify(original));
  await expect(c.build(source)).rejects.toThrow(/missing.json/);
  expect(await readFile(join(c.output,'index.html'),'utf8')).toBe(entry);
  expect(await readdir(join(c.output,'releases'))).toEqual(releases);
  expect((await readdir(c.output)).filter(name=>name.startsWith('.staging-'))).toEqual([]);
});
