import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import { mount } from "./fixtures/course-ui.ts";
import { course, section, enrollment, history, id, page, deferred } from "./fixtures/courses.ts";
import { modalRuntime } from "./fixtures/assignment.ts";
import { manageDialog, manageSelect, manageTitle, manageButton, rowTrigger, chooseRole, save, press, escapeManage, patches } from "./fixtures/management.ts";

const sections = Array.from({ length: 100 }, (_, index) => ({ ...section, id: id(300 + index), code: String(index + 1) }));
const reply = (request: Request) => {
  if (request.url.endsWith('/sections')) return Response.json({ items: sections });
  const selected = sections.find(item => request.url.includes(item.id));
  return Response.json(selected ? request.url.includes('/enrollments') ? page([{ ...enrollment, sectionId: selected.id }]) : selected : course);
};

test('one hundred sections mount one workspace; filtering preserves selection without more requests', async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), reply);
  try {
    assert.equal(ui.doc.querySelectorAll('select[name="managedSection"] option').length, 100);
    assert.equal(ui.doc.querySelectorAll('section[aria-label="Participantes"]').length, 1);
    assert.equal(ui.requests.filter(r => r.url.includes('/enrollments')).length, 1);
    assert.equal(ui.requests.filter(r => /\/sections\/[^/]+$/.test(r.url)).length, 1);
    const search = ui.doc.querySelector<HTMLInputElement>('input[type="search"]')!;
    const initialRequests = ui.requests.length;
    for (const query of ['99', 'ninguna']) {
      await ui.settle(() => { search.value = query; search.dispatchEvent(new ui.dom.window.Event('input', { bubbles: true })); });
      assert.equal(ui.doc.querySelector<HTMLSelectElement>('select[name="managedSection"]')!.value, sections[0].id);
      assert.equal(ui.requests.length, initialRequests);
      assert.match(ui.doc.querySelector('.participants-table[role="region"]')!.getAttribute('aria-label')!, /sección 1$/);
      assert.equal(ui.doc.querySelectorAll('select[name="managedSection"] option').length, query === '99' ? 2 : 1);
    }
    assert.match(ui.doc.body.textContent!, /No hay secciones que coincidan/);
    await ui.settle(() => { search.value = '99'; search.dispatchEvent(new ui.dom.window.Event('input', { bubbles: true })); });
    await ui.select('select[name="managedSection"]', sections[98].id);
    assert.equal(search.value, '');
    assert.match(ui.doc.querySelector('.participants-table[role="region"]')!.getAttribute('aria-label')!, /sección 99$/);
    assert.equal(ui.requests.filter(r => r.url.includes('/enrollments')).length, 2);
    assert.equal(ui.doc.querySelectorAll('section[aria-label="Participantes"]').length, 1);
  } finally { await ui.close(); }
});

test('abandoned section response cannot replace the selected workspace', async () => {
  const pending = deferred<Response>();
  const ui = await mount(h(CourseDetail, { courseId: course.id }), request =>
    request.url.endsWith(`/sections/${sections[0].id}`) ? pending.promise : reply(request));
  try {
    await ui.select('select[name="managedSection"]', sections[98].id);
    await ui.settle(() => pending.resolve(Response.json(sections[0])));
    assert.match(ui.doc.querySelector('.participants-table[role="region"]')!.getAttribute('aria-label')!, /sección 99$/);
    assert.equal(ui.requests.some(r => r.url.includes(`${sections[0].id}/enrollments`)), false);
  } finally { await ui.close(); }
});

test('participant management opens outside the table; Escape restores focus and uncertain writes stay locked', async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), request => {
    if (request.url.includes('/enrollments')) {
      if (request.method === 'PATCH') throw new Error('Response lost');
      return Response.json(page([{ ...enrollment, sectionId: sections[0].id }, { ...history, sectionId: sections[0].id }]));
    }
    return reply(request);
  });
  try {
    modalRuntime(ui);
    const trigger = rowTrigger(ui, enrollment.id);
    const table = ui.doc.querySelector('.participants-table')!;
    const content = table.innerHTML;
    assert.equal(table.querySelector('select, form, details'), null);
    assert.equal(ui.doc.querySelector(`[data-enrollment-id="${history.id}"] button`), null);
    await ui.settle(() => trigger.click());
    const dialog = manageDialog(ui);
    assert.ok(dialog.open);
    assert.equal(manageTitle(ui), 'Gestionar participante');
    assert.equal(table.contains(dialog), false);
    assert.equal(table.innerHTML, content);
    await ui.settle(() => {});
    assert.ok(ui.doc.activeElement === manageSelect(ui), 'the role field is focused on open');
    await escapeManage(ui);
    assert.equal(dialog.open, false);
    assert.ok(ui.doc.activeElement === trigger, 'Closing must restore trigger focus');
    await ui.settle(() => trigger.click());
    await chooseRole(ui, 'teacher'); await save(ui);
    assert.match(dialog.textContent!, /incierto/i);
    await escapeManage(ui);
    assert.ok(manageButton(ui, 'Descartar cambios'), 'the unsaved role asks before closing');
    await press(ui, 'Descartar cambios');
    assert.equal(dialog.open, false);
    assert.match(ui.doc.querySelector('section[aria-label="Participantes"] > p[role="alert"]')!.textContent!, /incierto/i);
    await ui.settle(() => trigger.click());
    assert.equal(manageSelect(ui).disabled, true);
    assert.equal(manageSelect(ui).value, 'teacher');
    await save(ui);
    assert.equal(patches(ui).length, 1);
  } finally { await ui.close(); }
});

test('role rejection stays inside the dialog; pending double submits and stale section responses cannot mutate twice', async () => {
  const pending = deferred<Response>();
  const ui = await mount(h(CourseDetail, { courseId: course.id }), request => request.method === 'PATCH' ? pending.promise : reply(request));
  try {
    modalRuntime(ui);
    const trigger = ui.doc.querySelector<HTMLButtonElement>('.participants-table button')!;
    await ui.settle(() => trigger.click());
    await chooseRole(ui, 'teacher');
    await save(ui); await save(ui);
    assert.equal(patches(ui).length, 1);
    assert.equal(manageSelect(ui).disabled, true);
    assert.equal(manageButton(ui, 'Guardando…')!.disabled, true);
    await escapeManage(ui); await press(ui, 'Cerrar');
    assert.ok(manageDialog(ui).open, 'a running write cannot be closed');
    assert.equal(manageButton(ui, 'Descartar cambios'), undefined);
    await ui.settle(() => pending.resolve(Response.json({}, { status: 422 })));
    const dialog = manageDialog(ui);
    assert.match(dialog.querySelector('[role="alert"]')!.textContent!, /Revisa los campos/);
    assert.equal(manageSelect(ui).disabled, false);
    assert.equal(manageSelect(ui).value, 'teacher');
    assert.equal(ui.doc.querySelector('.participants-table form'), null);
    await press(ui, 'Cancelar'); await press(ui, 'Descartar cambios');
    assert.ok(ui.doc.activeElement === trigger, 'Closing must restore trigger focus');
  } finally { await ui.close(); }

  const late = deferred<Response>();
  const second = await mount(h(CourseDetail, { courseId: course.id }), request => request.method === 'PATCH' ? late.promise : reply(request));
  try {
    modalRuntime(second);
    await second.settle(() => second.doc.querySelector<HTMLButtonElement>('.participants-table button')!.click());
    await chooseRole(second, 'teacher'); await save(second);
    await second.select('select[name="managedSection"]', sections[98].id);
    await second.settle(() => late.resolve(Response.json({ ...enrollment, role: 'teacher' })));
    assert.equal(second.doc.querySelector('dialog[open]'), null);
    assert.equal(second.doc.querySelector('.content-notices .content-notice'), null);
  } finally { await second.close(); }
});
