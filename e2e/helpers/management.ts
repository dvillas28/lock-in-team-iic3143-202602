import type {Page,Locator} from '@playwright/test';
import {expect} from '@playwright/test';
import type {Environment} from '../fixtures/environment.ts';
import {go} from './browser.ts';
/** Course administration and participant assignment open as modals in Secciones; other disclosures remain `<details>`. */
const dialogs=new Set(['Configurar curso','Crear sección','Configurar sección','Asignar participante']);
export async function disclose(page:Page,name:string) {
 if(dialogs.has(name)){
  const form=page.getByRole('dialog').getByRole('form',{name,exact:true});
  if(!await form.isVisible())await page.getByRole('button',{name,exact:true}).click();
  await expect(form).toBeVisible();return;
 }
 const summary=page.locator('summary').filter({hasText:new RegExp('^'+name+'$')});
 if(!await summary.evaluate(s=>(s.parentElement as HTMLDetailsElement).open))await summary.click();
}
export const sectionPicker=(page:Page)=>page.getByRole('combobox',{name:'Sección',exact:true});
/** The active section is named once: the picker's value with several sections, plain text with one. */
export async function activeSection(page:Page,code:string) {
 const picker=sectionPicker(page);
 if(await picker.count())await expect(picker.locator('option:checked')).toHaveText('Sección '+code);
 else await expect(page.locator('.section-toolbar .section-name')).toHaveText('Sección '+code);
 await expect(page.getByRole('heading',{name:'Participantes',exact:true})).toBeVisible();
}
export async function addContent(scope:Locator,item:'Subir archivo'|'Crear página'|'Enlazar cuestionario') {
 await scope.getByRole('button',{name:'Añadir contenido',exact:true}).click();
 await scope.getByRole('menuitem',{name:new RegExp('^'+item)}).click();
}
export async function sections(page:Page,e:Environment,section=e.data.sections.S1,course=e.data.courses.C1) {
 await go(page,course,'/sections');
 const roster=page.getByRole('heading',{name:'Participantes',exact:true});await expect(roster).toBeVisible();
 // The picker appears only with several manageable sections; a single one is named in the toolbar.
 const picker=sectionPicker(page);
 if(await picker.count()){if(await picker.inputValue()!==section)await picker.selectOption(section);}
 else await expect(page.locator('.section-toolbar .section-name')).toBeVisible();
 await expect(roster).toBeVisible();
}
export async function fillCourse(page:Page,input={code:'E2E-NEW',name:'Curso E2E nuevo',term:'2026-2'},edit=false) {
 await disclose(page,edit?'Configurar curso':'Crear curso');
 const form=page.getByRole('form',{name:edit?'Configurar curso':'Crear curso',exact:true});
 for(const [label,value] of [['Código',input.code],['Nombre',input.name]])await form.getByLabel(label,{exact:true}).fill(value);
 await period(form,input.term);
 if(!edit){await form.getByLabel('Código de sección inicial',{exact:true}).fill('1');await form.getByLabel('Capacidad inicial',{exact:true}).fill('30');}
 return form;
}
export async function period(form:Locator,term:string) {
 const [year,semester]=term.split('-');
 await form.getByLabel('Año',{exact:true}).selectOption(year);await form.getByLabel('Semestre',{exact:true}).selectOption(semester);
}
/** The «Asignar participante» modal form; opening it is idempotent. */
export async function assignment(page:Page) {
 await disclose(page,'Asignar participante');return page.getByRole('dialog').getByRole('form',{name:'Asignar participante',exact:true});
}
/** Person search inside the modal: Enter searches at once (typing alone waits for a short pause). */
export async function search(page:Page,query:string) {
 const form=await assignment(page);
 if(await form.locator('.assignment-selected').isVisible())await form.getByRole('button',{name:/^Cambiar persona/}).click();
 const input=form.getByLabel('Buscar persona',{exact:true});await input.fill(query);await input.press('Enter');
}
/** A search result, named by its person: «Seleccionar a <name>, <email>…». */
export const result=(page:Page,name:string,email:string)=>page.getByRole('dialog').getByRole('button',{name:new RegExp('^Seleccionar a '+literal(name)+', '+literal(email))});
export const results=(page:Page)=>page.getByRole('dialog').locator('.assignment-result-list');
export const chosen=(page:Page)=>page.getByRole('dialog').locator('.assignment-selected');
const literal=(text:string)=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export const participant=(page:Page,id:string)=>page.locator(`tr[data-enrollment-id="${id}"]`);
/** The roster shows active enrollments; revoked or replaced ones live under «Historial». */
export async function rosterView(page:Page,view:'Activas'|'Historial') {
 const button=page.getByRole('region',{name:'Participantes',exact:true}).getByRole('button',{name:view,exact:true});
 await button.click();await expect(button).toHaveAttribute('aria-pressed','true');
}
export async function selectPerson(page:Page,e:Environment,actor='ST2') {
 await search(page,e.data.actors[actor].email);
 await result(page,e.data.actors[actor].name,e.data.actors[actor].email).click();
 await expect(chosen(page)).toContainText(e.data.actors[actor].email);
}
export async function assign(page:Page,e:Environment,actor='ST2',role='student') {
 await selectPerson(page,e,actor);const form=await assignment(page);
 await form.getByRole('combobox',{name:'Rol académico',exact:true}).selectOption(role);await form.getByRole('button',{name:'Asignar participante',exact:true}).click();
}
export async function focus(page:Page) {
 const refreshed=page.waitForResponse(r=>r.url().endsWith('/me'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));return refreshed;
}
export async function submit(form:Locator,name:string){await form.getByRole('button',{name,exact:true}).click();}

/** Owned synthetic directory/history profile; never logs or copies credentials outside its DB. */
export async function extraPeople(e:Environment,count=24,history=false) {
 await e.assertOwned();const db=await e.pool.connect();const ids:string[]=[];
 try{await db.query('BEGIN');for(let i=0;i<count;i++){
  const id=e.id('extra-user/'+i);ids.push(id);
  await db.query('INSERT INTO users(id,email,name,password_hash) SELECT $1,$2,$3,password_hash FROM users WHERE id=$4',[id,`extra.${i}.${e.namespace}@example.test`,`E2E Extra ${i}`,e.data.actors.ST1.id]);
  await db.query('INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3)',[e.id('extra-membership/'+i),e.data.tenants.uc,id]);
  if(history)await db.query('INSERT INTO enrollments(id,institution_id,section_id,user_id,role,active) VALUES($1,$2,$3,$4,$5,$6)',[e.id('extra-enrollment/'+i),e.data.tenants.uc,e.data.sections.S1,id,'student',i%2===0]);
 }await db.query('COMMIT');return ids;}catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}
