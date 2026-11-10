import {addContent} from '../helpers/management.ts';
import {readFile} from 'node:fs/promises';
import type {Locator,Page} from '@playwright/test';
import {test,expect} from '../fixtures/test.ts';
import {modulePanel} from '../helpers/content.ts';
import {compatibilityNavigate} from '../helpers/browser.ts';
import {academicPdf} from '../helpers/academic-pdf.ts';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR42mMAAQAABQABoIJXOAAAAABJRU5ErkJggg==','base64');
async function upload(page:Page,panel:Locator,name:string,mimeType:string,buffer:Buffer) {
 if(!await panel.getByRole('region',{name:'Subir archivo',exact:true}).isVisible())await addContent(panel,'Subir archivo');
 await panel.getByLabel('Seleccionar archivo',{exact:true}).setInputFiles({name,mimeType,buffer});
 const response=page.waitForResponse(r=>r.url().endsWith('/files')&&r.request().method()==='POST');
 await panel.getByRole('button',{name:'Subir como borrador'}).click();
 const uploaded=await response;
 expect(uploaded.status()).toBe(201);
 await expect(panel.getByRole('link',{name,exact:true})).toBeVisible();
 await expect(panel.getByRole('region',{name:'Subir archivo',exact:true})).toBeHidden();
 return uploaded.json();
}

test('E2E-CONTENT-008 Upload publish read and download an academic file / academic-files @regression',async({e,actorPage},info)=>{
 const course=e.data.courses.C1, module=e.data.modules.M1;
 await e.pool.query('UPDATE course_modules SET title=$1 WHERE id=$2',['Semana 1 · Introducción',module]);
 await e.pool.query('UPDATE materials SET title=$1 WHERE id=$2',['Presentación del curso',e.data.materials.R1]);
 await e.pool.query('UPDATE materials SET title=$1 WHERE id=$2',['Guía de ejercicios',e.data.materials.R2]);
 await e.pool.query('UPDATE courses SET name=$1,code=$2 WHERE id=$3',['Gestión de Operaciones','ICS3213',course]);
 await e.pool.query('UPDATE course_modules SET title=$1 WHERE id=$2',['Semana 2 · Diseño de procesos',e.data.modules.M2]);
 const teacher=await actorPage('T1'), panel=await modulePanel(teacher,e);
 const notice=teacher.locator('.content-notices');
 await expect(teacher.getByRole('button',{name:/^Actualizar (módulos|materiales)$/})).toHaveCount(0);
 await addContent(panel,'Subir archivo');
 await panel.getByLabel('Seleccionar archivo',{exact:true}).setInputFiles({name:'invalido.html',mimeType:'text/html',buffer:Buffer.from('archivo inválido')});
 await expect(panel.getByRole('alert')).toContainText('formato admitido');
 const original=academicPdf(), title='Clase 01 - Introducción.pdf';
 const created=await upload(teacher,panel,title,'application/pdf',original);
 expect(created).toMatchObject({kind:'file',publishedAt:null,preview:'pdf'});
 await expect(notice).toHaveText('Archivo agregado como borrador.');
 const draft=await upload(teacher,panel,'Notas del equipo docente.txt','text/plain',Buffer.from('Material en preparación.'));
 const picture=await upload(teacher,panel,'Diagrama de procesos.png','image/png',png);
 const zip=Buffer.alloc(22);zip.writeUInt32LE(0x06054b50);
 await upload(teacher,panel,'Material complementario.zip','application/zip',zip);
 await addContent(panel,'Enlazar cuestionario');
 const quizDialog=teacher.getByRole('dialog',{name:'Enlazar cuestionario',exact:true});
 await quizDialog.getByRole('radio',{name:'Quiz E2E Q1',exact:true}).check();
 await quizDialog.getByRole('button',{name:'Enlazar cuestionario',exact:true}).click();
 await expect(panel.getByRole('link',{name:'Quiz E2E Q1',exact:true})).toBeVisible();
 await expect(quizDialog).toBeHidden();
 await expect(teacher.locator('.content-notices')).toHaveText('Cuestionario enlazado.');
 const student=await actorPage('ST1'), studentPanel=await modulePanel(student,e);
 await expect(studentPanel.getByRole('link',{name:title})).toHaveCount(0);
 const detail=`/courses/${course}/modules/${module}/files/${created.id}`;
 await compatibilityNavigate(student,detail);
 await expect(student.getByRole('heading',{name:'Recurso no disponible'})).toBeVisible();
 await student.getByRole('link',{name:'Volver a módulos',exact:true}).click();
 await expect(studentPanel.getByRole('link',{name:'Presentación del curso'})).toBeVisible();

 const position=created.position-1;
 const order=teacher.waitForResponse(r=>r.url().endsWith('/resources/order')&&r.request().method()==='PUT');
 await panel.getByRole('button',{name:`Subir recurso ${title}`,exact:true}).press('Enter');
 expect((await order).status()).toBe(204);
 await expect(panel.locator('.module-resource-list > li').nth(position-1)).toContainText(title);
 await expect(notice).toHaveText('Orden de recursos actualizado.');
 const rows=panel.locator('.module-resource-list');
 const height=await rows.evaluate(element=>element.clientHeight);
 for(const name of [title,'Diagrama de procesos.png','Material complementario.zip']) {
  await panel.getByRole('button',{name:`Publicar archivo ${name}`,exact:true}).click();
  await expect(panel.getByRole('button',{name:`Ocultar archivo ${name}`,exact:true})).toBeVisible();
 }
 await expect(notice).toHaveText('Archivo publicado.');
 expect(await rows.evaluate(element=>element.clientHeight)).toBe(height);
 await expect(rows.getByText('Archivo publicado.',{exact:true})).toHaveCount(0);
 await addContent(panel,'Subir archivo');
 async function evidence(page:Page,name:string) {
  const path=info.outputPath(name+'.png');
  await page.locator('main').evaluate(main=>{window.scrollTo(0,0);main.scrollTo(0,0);});
  await page.screenshot({path,animations:'disabled'});
  await info.attach(name,{path,contentType:'image/png'});
 }
 await teacher.setViewportSize({width:1440,height:1200});
 await expect(panel.getByRole('button',{name:`Ocultar archivo ${title}`,exact:true})).toBeInViewport();
 await evidence(teacher,'01-docente-modulos');

 await student.bringToFront();
 await student.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(studentPanel.getByRole('link',{name:title})).toBeVisible();
 await expect(studentPanel.locator(`a[href$="/${draft.id}"]`)).toHaveCount(0);
 await expect(studentPanel.getByRole('button',{name:'Añadir contenido',exact:true})).toHaveCount(0);
 await expect(studentPanel.getByRole('link',{name:'Quiz E2E Q1',exact:true})).toBeVisible();
 await student.setViewportSize({width:1440,height:1000});
 await evidence(student,'02-estudiante-modulos');
 await studentPanel.getByRole('link',{name:title}).click();
 await expect(student.getByRole('navigation',{name:'Ruta de navegación'}).getByText('Archivo',{exact:true})).toBeVisible();
 const viewer=student.getByRole('region',{name:'Visor de PDF'});
 await expect(viewer.getByText('Página 1 de 2')).toBeVisible();
 await expect(viewer.locator('.pdf-text-layer')).toContainText('Introduccion a la Gestion de Operaciones');
 await expect(viewer.locator('.pdf-sheet')).toBeVisible();
 expect(await viewer.locator('canvas').evaluate(canvas=>
  (canvas as HTMLCanvasElement).getContext('2d')!.getImageData(30,30,1,1).data[0])).toBeLessThan(100);
 await evidence(student,'03-visor-pdf');

 await viewer.getByRole('button',{name:'Página siguiente'}).press('Enter');
 await expect(viewer.getByText('Página 2 de 2')).toBeVisible();
 await expect(viewer.locator('.pdf-text-layer')).toContainText('Procesos y capacidad');
 await viewer.getByRole('button',{name:'Aumentar zoom'}).click();
 await expect(viewer.getByText('125 %')).toBeVisible();
 await expect(viewer.locator('.pdf-sheet')).toBeVisible();
 const download=student.waitForEvent('download');
 await student.getByRole('button',{name:'Descargar archivo',exact:true}).click();
 const saved=await download;
 expect(saved.suggestedFilename()).toBe(title);
 expect(await readFile((await saved.path())!)).toEqual(original);
 await student.getByRole('link',{name:/Volver a módulos/}).click();
 await expect(studentPanel.getByRole('button',{name:'Semana 1 · Introducción'})).toBeFocused();
 await studentPanel.locator(`a[href$="/${picture.id}"]`).click();
 await expect(student.getByRole('img',{name:'Diagrama de procesos.png'})).toBeVisible();
 await student.getByRole('link',{name:/Volver a módulos/}).click();
 await studentPanel.getByRole('link',{name:'Material complementario.zip'}).click();
 await expect(student.getByText('Este formato se puede consultar después de descargar el archivo.')).toBeVisible();
 await expect(student.getByRole('button',{name:'Descargar archivo'})).toBeEnabled();

 const assistant=await actorPage('AS1'), assistantPanel=await modulePanel(assistant,e);
 await expect(assistantPanel.getByRole('button',{name:'Añadir contenido',exact:true})).toHaveCount(0);
 await assistantPanel.getByRole('link',{name:title}).click();
 await expect(assistant.getByRole('region',{name:'Visor de PDF'}).locator('.pdf-text-layer')).toContainText('Gestion de Operaciones');
 await assistant.setViewportSize({width:375,height:812});
 await expect(assistant.locator('.pdf-sheet')).toBeVisible();
 expect(await assistant.evaluate(()=>document.documentElement.scrollWidth)).toBe(375);
 const toggle=assistant.getByRole('button',{name:'Cambiar tema'});
 await toggle.click();
 await expect(assistant.locator('html')).toHaveAttribute('data-theme','dark');
 await evidence(assistant,'04-visor-movil-oscuro');

 const draftRow=panel.locator('.material-item').filter({has:teacher.getByRole('link',{name:'Notas del equipo docente.txt',exact:true})});
 await draftRow.getByRole('button',{name:'Editar archivo Notas del equipo docente.txt',exact:true}).click();
 const editor=teacher.getByRole('dialog',{name:'Editar archivo',exact:true});
 await editor.getByLabel('Nombre visible').fill('Pauta de ejercicios');
 await editor.getByRole('button',{name:'Guardar cambios',exact:true}).click();
 const edited=panel.locator('.material-item').filter({has:teacher.getByRole('link',{name:'Pauta de ejercicios',exact:true})});
 await expect(edited.getByRole('link',{name:'Pauta de ejercicios'})).toBeVisible();
 await expect(notice).toHaveText('Nombre actualizado.');
 await edited.getByRole('button',{name:'Editar archivo Pauta de ejercicios',exact:true}).click();
 await editor.getByLabel('Seleccionar archivo de reemplazo').setInputFiles({name:'pauta.pdf',mimeType:'application/pdf',buffer:original});
 await editor.getByRole('button',{name:'Reemplazar archivo',exact:true}).click();
 await expect(edited.locator('.module-resource-info')).toContainText('PDF');
 await expect(notice).toHaveText('Archivo reemplazado.');
 await edited.getByRole('button',{name:'Editar archivo Pauta de ejercicios',exact:true}).click();
 await editor.getByRole('button',{name:'Eliminar archivo',exact:true}).first().click();
 await editor.getByRole('dialog').getByRole('button',{name:'Eliminar archivo',exact:true}).click();
 await expect(panel.getByRole('link',{name:'Pauta de ejercicios'})).toHaveCount(0);
 await expect(notice).toHaveText('Archivo eliminado.');
 await expect(panel.locator('.module-collapse')).toBeFocused();
 await expect(notice).toHaveText('',{timeout:6500});
 const otherTenant=await actorPage('MULTI','utfsm');
 const denied=otherTenant.waitForResponse(response=>response.url().endsWith(`/institution/utfsm/modules/${module}`));
 await compatibilityNavigate(otherTenant,detail);
 expect((await denied).status()).toBe(404);
 await expect(otherTenant.getByRole('heading',{name:'Recurso no disponible'})).toBeVisible();
 await expect(otherTenant.getByRole('region',{name:'Visor de PDF'})).toHaveCount(0);
});

test('E2E-CONTENT-008 Keep navigation anchored while browsing a long course / academic-layout @regression',async({e,actorPage},info)=>{
 const course=e.data.courses.C1;
 const teacher=await actorPage('T1');
 const main=teacher.locator('#main-content');
 const sidebar=teacher.getByRole('complementary',{name:'Contexto institucional'});
 const nav=teacher.getByRole('navigation',{name:'Navegación institucional'});
 async function capture(name:string) {
  const path=info.outputPath(name+'.png');
  await teacher.screenshot({path,animations:'disabled'});
  await info.attach(name,{path,contentType:'image/png'});
 }
 async function shellGeometry() {
  return sidebar.evaluate(element=>{
   const rect=element.getBoundingClientRect();
   return {top:rect.top,bottom:rect.bottom,height:window.innerHeight,rootScroll:window.scrollY,
    documentHeight:document.documentElement.scrollHeight};
  });
 }
 async function expectSidebarFits() {
  await expect.poll(async()=>{
   const g=await shellGeometry();
   return [g.top,g.bottom-g.height,g.rootScroll,g.documentHeight-g.height];
  }).toEqual([0,0,0,0]);
  await expect(sidebar.getByRole('button',{name:'Cerrar sesión'})).toBeInViewport();
 }

 await teacher.setViewportSize({width:1440,height:900});
 await expectSidebarFits();
 const seeded=await e.pool.query<{id:string}>(`INSERT INTO course_modules(id,institution_id,course_id,title,position,published_at)
  SELECT gen_random_uuid(),c.institution_id,c.id,'Semana '||n||' · Material de clase',n,now()
  FROM courses c CROSS JOIN generate_series(3,24) n WHERE c.id=$1
  RETURNING id,position`,[course]);
 const last=seeded.rows.at(-1)!.id;
 const panel=await modulePanel(teacher,e);
 await teacher.getByRole('navigation',{name:'Índice de módulos'}).locator(`a[href="#module-${last}"]`).click();
 const tail=teacher.locator('#module-'+last);
 await addContent(tail,'Subir archivo');
 await upload(teacher,tail,'Lectura de cierre.pdf','application/pdf',academicPdf());
 await panel.locator('button.module-collapse').evaluate(element=>(element as HTMLButtonElement).focus({preventScroll:true}));

 for (const width of [1440,1024]) {
  await teacher.setViewportSize({width,height:900});
  await main.evaluate(element=>element.scrollTo(0,element.scrollHeight));
  expect(await main.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
  await expectSidebarFits();
  await expect(tail.getByRole('link',{name:'Lectura de cierre.pdf'})).toBeInViewport();
  if (width===1024) {
   await teacher.getByRole('button',{name:'Cambiar tema'}).click();
   await capture('06-sidebar-escritorio-oscuro');
  }
 }
 await teacher.setViewportSize({width:1024,height:360});
 await expectSidebarFits();
 expect(await nav.evaluate(element=>element.scrollHeight-element.clientHeight)).toBeGreaterThan(0);
 await nav.evaluate(element=>element.scrollTo(0,element.scrollHeight));
 await expect(sidebar.getByRole('button',{name:'Cerrar sesión'})).toBeInViewport();

 await teacher.setViewportSize({width:375,height:812});
 await teacher.evaluate(()=>window.scrollTo(0,12));
 const menu=teacher.getByRole('button',{name:'Abrir navegación'});
 const geometry=()=>main.evaluate(element=>[window.scrollY,element.getBoundingClientRect().top]);
 const before=await geometry();
 await menu.click();
 await expect(nav).toBeVisible();
 await expect(nav.getByRole('link',{name:'Mis cursos'})).toBeFocused();
 expect(await geometry()).toEqual(before);
 await capture('07-menu-movil-oscuro');
 await teacher.keyboard.press('Escape');
 await expect(menu).toBeFocused();
 expect(await geometry()).toEqual(before);
 await teacher.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
 await expect(tail.getByRole('link',{name:'Lectura de cierre.pdf'})).toBeInViewport();
 expect(await teacher.evaluate(()=>document.documentElement.scrollWidth)).toBe(375);
});
