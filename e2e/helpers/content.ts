import {expect,type Page} from '@playwright/test';
import type {Environment} from '../fixtures/environment.ts';
import {go} from './browser.ts';
export async function modulePanel(page:Page,e:Environment,id=e.data.modules.M1,course=e.data.courses.C1) {
 await go(page,course,'/modules');const row=page.locator('#module-'+id),toggle=row.locator('button[aria-expanded]');
 await expect(toggle).toBeVisible();if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();await expect(page.locator('#materials-'+id)).toBeVisible();return row;
}
export async function reader(page:Page,e:Environment,material=e.data.materials.R1,module=e.data.modules.M1,course=e.data.courses.C1) {
 const row=await modulePanel(page,e,module,course);await row.locator(`a[href="/courses/${course}/modules/${module}/materials/${material}"]`).click();await expect(page.locator('.material-reader')).toBeVisible();
}
