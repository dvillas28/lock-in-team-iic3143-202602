import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { InstitutionShell } from '../src/components/institutions/institution-shell.tsx';
import { mount } from './fixtures/course-ui.ts';
import { course, user } from './fixtures/courses.ts';

test('shell exposes one identity, course scope and active navigation; theme and Escape work by keyboard', async () => {
  const previous = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = callback => { callback(0); return 0; };
  const path = `/courses/${course.id}/modules`;
  const ui = await mount(h(InstitutionShell, {institutionSlug:'uc', user:user('multi'), pathname:path}, h('h1',null,'Contenido')),()=>Response.json({}),'multi');
  try {
    assert.equal(ui.doc.querySelectorAll('.institution-user .name').length,1);
    assert.equal(ui.doc.querySelector('.institution-user .role')?.textContent,'Docente · Ayudante · Estudiante');
    assert.doesNotMatch(ui.doc.querySelector('.institution-user')!.textContent!, /ana@example\.test/);
    assert.match(ui.doc.querySelector('.institution-user')!.textContent!,/Docente · Ayudante · Estudiante/);
    assert.equal(ui.doc.querySelector('.sidebar-nav [aria-current="page"]')?.getAttribute('href'),path);
    assert.equal(ui.doc.querySelector('.sidebar-nav a[href="/courses"]')?.classList.contains('active'),false);
    const toggle=ui.doc.querySelector<HTMLButtonElement>('.mobile-menu-button')!;
    await ui.settle(()=>toggle.click());
    assert.equal(toggle.getAttribute('aria-expanded'),'true');
    const first=ui.doc.querySelector<HTMLAnchorElement>('.sidebar-nav a')!;
    assert.equal(ui.doc.activeElement,first);
    await ui.settle(()=>first.dispatchEvent(new ui.dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
    assert.equal(toggle.getAttribute('aria-expanded'),'false'); assert.equal(ui.doc.activeElement,toggle);
    const theme=ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Cambiar tema"]')!;
    await ui.settle(()=>theme.click());
    assert.equal(ui.doc.documentElement.dataset.theme,'dark');
    await ui.settle(()=>theme.click()); assert.equal(ui.doc.documentElement.dataset.theme,'light');
    await ui.settle(()=>toggle.click());
    first.addEventListener('click',event=>event.preventDefault());
    await ui.settle(()=>first.click()); assert.equal(toggle.getAttribute('aria-expanded'),'false');
  } finally { await ui.close(); globalThis.requestAnimationFrame=previous; }
});

test('mobile navigation closes from each native link and respects Escape consumed by a control', async () => {
  const previous = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = callback => { callback(0); return 0; };
  const ui = await mount(h(InstitutionShell, { institutionSlug: 'uc', pathname: `/courses/${course.id}` }, h('button', { type: 'button', 'aria-label': 'Control del curso' }, 'Control')), () => Response.json({}));
  try {
    const toggle = ui.doc.querySelector<HTMLButtonElement>('.mobile-menu-button')!;
    for (const link of ui.doc.querySelectorAll<HTMLAnchorElement>('.sidebar-nav a')) {
      link.addEventListener('click', event => event.preventDefault());
      await ui.settle(() => toggle.click());
      await ui.settle(() => link.click());
      assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    }
    await ui.settle(() => toggle.click());
    const control = ui.doc.querySelector('button[aria-label="Control del curso"]')!;
    control.addEventListener('keydown', event => event.preventDefault(), { once: true });
    await ui.settle(() => control.dispatchEvent(new ui.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    await ui.settle(() => control.dispatchEvent(new ui.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(ui.doc.activeElement, toggle);
    const closedEscape = new ui.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    await ui.settle(() => control.dispatchEvent(closedEscape));
    assert.equal(closedEscape.defaultPrevented, false);
  } finally { await ui.close(); globalThis.requestAnimationFrame = previous; }
});
