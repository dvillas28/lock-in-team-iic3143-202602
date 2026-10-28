import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { QuizList } from "../src/components/quizzes/quiz-list.tsx";
import { QuizEditor } from "../src/components/quizzes/quiz-editor.tsx";
import { QuizCreate } from "../src/components/quizzes/quiz-create.tsx";
import { mount, draft, emptyDraft, published, reply, course, section, id } from "./fixtures/quizzes.ts";
import { useSession } from "../src/components/auth/session-provider.tsx";

test("combined quiz filters stay local and creation remains separate from results", async () => {
  const items = [draft, { ...published, id: id(80), title: "Prueba de integración", sectionId: null }];
  const ui = await mount(h(QuizList, { courseId: course.id }), r => r.url.endsWith('/quizzes') ? Response.json({ items }) : reply(r), "teacher");
  try {
    assert.equal(ui.doc.querySelector('h1')?.textContent, 'Quizzes');
    assert.equal(ui.doc.querySelectorAll('.quiz-resource-list a').length, 2);
    const disclosure = ui.doc.querySelector<HTMLDetailsElement>('.quiz-create')!;
    assert.equal(disclosure.open, false);
    const requests = ui.requests.length;
    const filters = ui.doc.querySelectorAll<HTMLSelectElement>('.quiz-filters select');
    await ui.settle(() => { filters[0].value = 'published';filters[0].dispatchEvent(new ui.dom.window.Event('change', { bubbles: true })); });
    assert.equal(ui.doc.querySelectorAll('.quiz-resource-list a').length, 1);
    const search = ui.doc.querySelector<HTMLInputElement>('input[type="search"]')!;
    await ui.settle(() => { search.value = '  INTEGRACIÓN  ';search.dispatchEvent(new ui.dom.window.Event('input', { bubbles: true })); });
    assert.match(ui.doc.querySelector('.quiz-resource-list')!.textContent!, /integración/);
    await ui.settle(() => { filters[1].value = section.id;filters[1].dispatchEvent(new ui.dom.window.Event('change', { bubbles: true })); });
    assert.match(ui.doc.body.textContent!, /No hay quizzes que coincidan/);
    assert.ok(ui.doc.querySelector('form[aria-label="Crear quiz"]'));
    await ui.click('Mostrar todos los quizzes');
    assert.equal(ui.doc.querySelectorAll('.quiz-resource-list a').length, 2);
    assert.equal(ui.requests.length, requests);
  } finally { await ui.close(); }
});

test("invalid creation stays local, preserves input and opens the relevant field", async () => {
  for (const [values, field] of [
    [{ title: '   ' }, 'title'],
    [{ title: 'x'.repeat(201) }, 'title'],
    [{ title: 'Quiz', maxAttempts: '0' }, 'maxAttempts'],
    [{ title: 'Quiz', maxAttempts: '1.5' }, 'maxAttempts'],
    [{ title: 'Quiz', maxAttempts: '1e2' }, 'maxAttempts'],
    [{ title: 'Quiz', instructions: '😀'.repeat(1100) }, 'form'],
  ] as const) {
    const ui = await mount(h(QuizList, { courseId: course.id }), r => reply(r), 'teacher');
    try {
      await ui.submit('form', values);
      assert.equal(ui.requests.some(r => r.method === 'POST' && !r.url.endsWith('/login')), false);
      assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="title"]')!.value, values.title);
      assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="title"]')!.disabled, false);
      assert.equal(ui.doc.activeElement?.getAttribute('name'), field === 'form' ? null : field);
      if (field !== 'form') assert.equal(ui.doc.querySelector<HTMLDetailsElement>('.quiz-create')!.open, true);
    } finally { await ui.close(); }
  }
});

test("a native incomplete optional number cannot be submitted as unlimited attempts", async () => {
  const ui = await mount(h(QuizList, { courseId: course.id }), r => reply(r), 'teacher');
  try {
    const control = ui.doc.querySelector<HTMLInputElement>('[name="maxAttempts"]')!;
    Object.defineProperty(control, 'validity', { configurable: true, value: { badInput: true } });
    await ui.submit('form', { title: 'Quiz' });
    assert.equal(ui.requests.some(r => r.method === 'POST' && !r.url.endsWith('/login')), false);
    assert.equal(ui.doc.activeElement, control);
    assert.equal(control.getAttribute('aria-invalid'), 'true');
  } finally { await ui.close(); }
});

test("missing correct answer and malformed points focus their controls without sending PATCH", async () => {
  const noCorrect = { ...draft, questions: [] };
  const ui = await mount(h(QuizEditor, { courseId: course.id, quizId: draft.id }), r => reply(r, noCorrect), 'teacher');
  try {
    assert.equal(ui.doc.querySelector<HTMLButtonElement>('button[disabled]')?.textContent, 'Publicar quiz');
    await ui.click('Agregar pregunta');
    await ui.submit('form', { 'questions.0.prompt': 'Pregunta', 'questions.0.alternatives.0.text': 'Sí', 'questions.0.alternatives.1.text': 'No' });
    assert.equal(ui.doc.activeElement?.getAttribute('type'), 'radio');
    assert.equal(ui.doc.activeElement?.getAttribute('aria-invalid'), 'true');
    assert.ok(ui.doc.getElementById(ui.doc.activeElement!.getAttribute('aria-describedby')!));
    await ui.settle(() => ui.doc.querySelector<HTMLInputElement>('input[type="radio"]')!.click());
    await ui.submit('form', { 'questions.0.points': '1e2' });
    assert.equal(ui.doc.activeElement?.getAttribute('name'), 'questions.0.points');
    assert.equal(ui.requests.some(r => r.method === 'PATCH'), false);
    assert.equal(ui.doc.querySelector('label[for]')?.textContent, 'Título del quiz');
  } finally { await ui.close(); }
});

test("alternative identifiers are internal, two options are retained, new identifiers avoid collisions", async () => {
  const initial = { ...draft, questions: [{ ...draft.questions[0], alternatives: draft.questions[0].alternatives.map((a, i) => ({ ...a, id: i === 0 ? 'opcion-1000000' : a.id })) }] };
  const ui = await mount(h(QuizEditor, { courseId: course.id, quizId: draft.id }), async r => r.method === 'PATCH' ? Response.json({ ...initial, ...await r.clone().json() }) : reply(r, initial), 'teacher');
  try {
    assert.equal(ui.doc.querySelector<HTMLInputElement>('[name$=".alternatives.0.id"]')!.type, 'hidden');
    assert.equal(ui.doc.querySelector<HTMLButtonElement>('[aria-label="Quitar alternativa 1.1"]')!.disabled, true);
    await ui.click('Agregar alternativa 1');
    await ui.submit('form', { 'questions.0.alternatives.2.text': 'Otra alternativa' });
    const body = await ui.requests.find(r => r.method === 'PATCH')!.clone().json();
    const alternatives = body.questions[0].alternatives;
    assert.equal(new Set(alternatives.map((a: { id: string }) => a.id)).size, 3);
    assert.equal(alternatives[0].id, 'opcion-1000000');
  } finally { await ui.close(); }
});

test("confirmed creation remains confirmed if refreshing the list fails", async () => {
  function CreateWithFailedRefresh() {
    const { session, state } = useSession();
    return h(QuizCreate, { session, slug: 'uc', user: state.context!.user!, course, sections: [section], onSaved: async () => { throw new Error('refresh unavailable'); } });
  }
  const view = await mount(h(CreateWithFailedRefresh), r => r.method === 'POST' ? Response.json(emptyDraft) : reply(r), 'teacher');
  try {
    await view.submit('form', { title: 'Nuevo' });
    assert.match(view.doc.body.textContent!, /Quiz creado/);
    assert.doesNotMatch(view.doc.body.textContent!, /Resultado incierto/);
    assert.ok(view.doc.querySelector('form a[href$="' + draft.id + '"]'));
    await view.submit('form', { title: 'Nuevo' });
    assert.equal(view.requests.filter(r => r.method === 'POST' && !r.url.endsWith('/login')).length, 1);
  } finally { await view.close(); }
});
