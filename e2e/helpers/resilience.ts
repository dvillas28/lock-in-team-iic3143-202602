import {expect,type Page,type Route} from '@playwright/test';
import type {Environment} from '../fixtures/environment.ts';
import {modulePanel} from './content.ts';
export const problem=(status:number)=>({status,contentType:'application/problem+json',body:JSON.stringify({status,title:'UNTRUSTED SQL password secret',detail:'UNTRUSTED SQL password secret',code:status===503?'SERVICE_UNAVAILABLE':'INTERNAL_ERROR',traceId:'injected-fault'})});
export async function materialEditor(page:Page,e:Environment){await modulePanel(page,e);await page.getByRole('button',{name:'Editar página Lectura E2E R1',exact:true}).click();return page.getByRole('form',{name:'Editar página Lectura E2E R1',exact:true});}
export async function tabTo(page:Page,target:import('@playwright/test').Locator,limit=60){for(let n=0;n<limit;n++){if(await target.evaluate(el=>el===document.activeElement))return;await page.keyboard.press('Tab');}await expect(target).toBeFocused();}
export async function recoverable(page:Page){await expect(page.locator('main').getByText(/^(Servicio no disponible|No se pudo completar la solicitud|No se pudo cargar el contenido)$/,{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Cerrar sesión',exact:true})).toBeVisible();}
export async function assertContainedFocus(page:Page,dialog:import('@playwright/test').Locator,cycles=12){for(let n=0;n<cycles;n++){await page.keyboard.press(n%3===0?'Shift+Tab':'Tab');expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);}}
export async function failOnce(route:Route,code=500){await route.fulfill(problem(code));}
