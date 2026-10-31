import type {Page,Locator} from '@playwright/test';
import {expect} from '@playwright/test';
import type {Environment} from '../fixtures/environment.ts';
import {go} from './browser.ts';
export async function disclose(page:Page,name:string) {
 const summary=page.locator('summary').filter({hasText:new RegExp('^'+name+'$')});
 if(!await summary.evaluate(s=>(s.parentElement as HTMLDetailsElement).open))await summary.click();
}
export async function sections(page:Page,e:Environment,section=e.data.sections.S1,course=e.data.courses.C1) {
 await go(page,course,'/sections');
 const picker=page.getByLabel('Sección a gestionar',{exact:true});await expect(picker).toBeVisible();
 if(await picker.inputValue()!==section)await picker.selectOption(section);
 await expect(page.getByRole('heading',{name:/^Participantes e historial/})).toBeVisible();
}
export async function fillCourse(page:Page,input={code:'E2E-NEW',name:'Curso E2E nuevo',term:'2026-2'},edit=false) {
 await disclose(page,edit?'Configurar curso':'Crear curso');
 const form=page.getByRole('form',{name:edit?'Configurar curso':'Crear curso',exact:true});
 for(const [label,value] of [['Código',input.code],['Nombre',input.name],['Período',input.term]])await form.getByLabel(label,{exact:true}).fill(value);
 if(!edit){await form.getByLabel('Código de sección inicial',{exact:true}).fill('1');await form.getByLabel('Capacidad inicial (vacío: sin límite)',{exact:true}).fill('0');}
 return form;
}
export async function search(page:Page,query:string) {
 await disclose(page,'Asignar participante');const form=page.getByRole('form',{name:'Buscar participantes',exact:true});
 await form.getByLabel('Nombre o correo de participante',{exact:true}).fill(query);await form.getByRole('button',{name:'Buscar',exact:true}).click();
}
export const participant=(page:Page,id:string)=>page.locator(`tr[data-enrollment-id="${id}"]`);
export async function selectPerson(page:Page,e:Environment,actor='ST2') {
 await search(page,e.data.actors[actor].email);
 await page.getByRole('button',{name:e.data.actors[actor].name+' · '+e.data.actors[actor].email,exact:true}).click();
}
export async function assign(page:Page,e:Environment,actor='ST2',role='student') {
 await selectPerson(page,e,actor);const form=page.getByRole('form',{name:'Asignar rol',exact:true});
 await form.getByLabel('Rol',{exact:true}).selectOption(role);await form.getByRole('button',{name:'Asignar rol',exact:true}).click();
}
export async function focus(page:Page) {
 const refreshed=page.waitForResponse(r=>r.url().endsWith('/me'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));return refreshed;
}
export async function submit(form:Locator,name:string){await form.getByRole('button',{name,exact:true}).click();}
