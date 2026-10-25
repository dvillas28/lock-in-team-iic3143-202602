import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import { mount } from "./fixtures/course-ui.ts";
import { course, section, enrollment, history, id, page, deferred } from "./fixtures/courses.ts";

const sections = Array.from({ length: 100 }, (_, index) => ({ ...section, id: id(300 + index), code: String(index + 1) }));
const reply = (request: Request) => {
  if (request.url.endsWith('/sections')) return Response.json({ items: sections });
  const selected = sections.find(item => request.url.includes(item.id));
  return Response.json(selected ? request.url.includes('/enrollments') ? page([{ ...enrollment, sectionId: selected.id }]) : selected : course);
};

test('one hundred sections mount one workspace; filtering preserves selection without more requests', async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id, sections: true }), reply);
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
      assert.match(ui.doc.querySelector('section[aria-label="Participantes"] h3')!.textContent!, /Sección 1$/);
      assert.equal(ui.doc.querySelectorAll('select[name="managedSection"] option').length, query === '99' ? 2 : 1);
    }
    assert.match(ui.doc.body.textContent!, /No hay secciones que coincidan/);
    await ui.settle(() => { search.value = '99'; search.dispatchEvent(new ui.dom.window.Event('input', { bubbles: true })); });
    await ui.select('select[name="managedSection"]', sections[98].id);
    assert.equal(search.value, '');
    assert.match(ui.doc.querySelector('section[aria-label="Participantes"] h3')!.textContent!, /Sección 99$/);
    assert.equal(ui.requests.filter(r => r.url.includes('/enrollments')).length, 2);
    assert.equal(ui.doc.querySelectorAll('section[aria-label="Participantes"]').length, 1);
  } finally { await ui.close(); }
});

test('abandoned section response cannot replace the selected workspace', async () => {
  const pending = deferred<Response>();
  const ui = await mount(h(CourseDetail, { courseId: course.id, sections: true }), request =>
    request.url.endsWith(`/sections/${sections[0].id}`) ? pending.promise : reply(request));
  try {
    await ui.select('select[name="managedSection"]', sections[98].id);
    await ui.settle(() => pending.resolve(Response.json(sections[0])));
    assert.match(ui.doc.querySelector('section[aria-label="Participantes"] h3')!.textContent!, /Sección 99$/);
    assert.equal(ui.requests.some(r => r.url.includes(`${sections[0].id}/enrollments`)), false);
  } finally { await ui.close(); }
});

test('participant actions collapse by default; Escape restores focus and uncertain writes stay locked', async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id, sections: true }), request => {
    if (request.url.includes('/enrollments')) {
      if (request.method === 'PATCH') throw new Error('Response lost');
      return Response.json(page([{ ...enrollment, sectionId: sections[0].id }, { ...history, sectionId: sections[0].id }]));
    }
    return reply(request);
  });
  try {
    const details = ui.doc.querySelector<HTMLDetailsElement>('.participant-actions')!;
    const summary = details.querySelector('summary')!;
    assert.equal(details.open, false);
    assert.equal(ui.doc.querySelectorAll('.participant-actions').length, 1);
    assert.equal(ui.doc.querySelector(`[data-enrollment-id="${history.id}"] details`), null);
    await ui.settle(() => { details.open = true; details.querySelector('select')!.focus(); details.dispatchEvent(new ui.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); });
    assert.equal(details.open, false);
    assert.equal(ui.doc.activeElement, summary);
    await ui.submit(`form[aria-label="Cambiar rol ${enrollment.id}"]`, { role: 'teacher' });
    assert.match(ui.doc.body.textContent!, /incierto/i);
    await ui.settle(() => { details.open = false; details.open = true; });
    assert.equal(details.querySelector<HTMLSelectElement>('select')!.disabled, true);
    await ui.submit(`form[aria-label="Cambiar rol ${enrollment.id}"]`, { role: 'teacher' });
    assert.equal(ui.requests.filter(r => r.method === 'PATCH').length, 1);
  } finally { await ui.close(); }
});
