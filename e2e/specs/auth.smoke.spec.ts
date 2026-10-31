import {test, expect} from '../fixtures/test.ts';
import {course} from '../helpers/browser.ts';

for (const actor of ['SA','AO','T1','AS1','ST1']) {
test(`E2E-AUTH-001 login real / ${actor} @smoke`, async ({e, actorPage}) => {
  const page = await actorPage(actor);
  await expect(page.getByRole('heading',{name:'Mis cursos',exact:true})).toBeVisible();
  await expect(page.getByText(e.data.actors[actor].name,{exact:true})).toBeVisible();
  await expect(page.getByText('Curso E2E F1',{exact:true})).toHaveCount(0);
  if(actor==='SA') {
    await expect(page.locator(`a[href="/courses/${e.data.courses.C1}"]`)).toHaveCount(0);
    await expect(page.getByText('Crear curso',{exact:true}).filter({visible:true})).toHaveCount(0);
  } else {
    await course(page,e.data.courses.C1);
    await expect(page.getByRole('heading',{name:'Curso E2E C1',exact:true})).toBeVisible();
  }
  const stored = await page.evaluate(()=>({cookies:document.cookie,local:{...localStorage},session:{...sessionStorage}}));
  expect(stored).toEqual({cookies:'',local:{},session:{}});
});
}
