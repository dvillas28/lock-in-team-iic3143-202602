import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { QuizList } from "../src/components/quizzes/quiz-list.tsx";
import { QuizEditor } from "../src/components/quizzes/quiz-editor.tsx";
import { QuizCreate } from "../src/components/quizzes/quiz-create.tsx";
import { mount, draft, emptyDraft, published, reply, course, section, id } from "./fixtures/quizzes.ts";

test("combined quiz filters stay local and creation remains separate from results", async () => {
  const items = [draft, { ...published, id: id(80), title: "Prueba de integración", sectionId: null }];
  const ui = await mount(h(QuizList, { courseId: course.id }), r => r.url.endsWith('/quizzes') ? Response.json({ items }) : reply(r), "teacher");
  try {
    assert.equal(ui.doc.querySelector('h1')?.textContent, 'Quizzes');
    assert.equal(ui.doc.querySelectorAll('.quiz-resource-list a').length, 2);
    assert.ok(ui.doc.querySelector('a[href$="/quizzes/new"]'));
    assert.equal(ui.doc.querySelector('form'), null);
    const requests = ui.requests.length;
    const filters = ui.doc.querySelectorAll<HTMLSelectElement>('.quiz-filters select');
    await ui.settle(() => { filters[0].value = 'published';filters[0].dispatchEvent(new ui.dom.window.Event('change', { bubbles: true })); });
    assert.equal(ui.doc.querySelectorAll('.quiz-resource-list a').length, 1);
    const search = ui.doc.querySelector<HTMLInputElement>('input[type="search"]')!;
    await ui.settle(() => { search.value = '  INTEGRACIÓN  ';search.dispatchEvent(new ui.dom.window.Event('input', { bubbles: true })); });
    assert.match(ui.doc.querySelector('.quiz-resource-list')!.textContent!, /integración/);
    await ui.settle(() => { filters[1].value = section.id;filters[1].dispatchEvent(new ui.dom.window.Event('change', { bubbles: true })); });
    assert.match(ui.doc.body.textContent!, /No hay quizzes que coincidan/);
    assert.match(ui.doc.querySelector<HTMLAnchorElement>('a[href*="/quizzes/new"]')!.search, /estado=published/);
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
    const ui = await mount(h(QuizCreate, { courseId: course.id }), r => reply(r), 'teacher');
    try {
      await ui.submit('form', values);
      assert.equal(ui.requests.some(r => r.method === 'POST' && !r.url.endsWith('/login')), false);
      assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="title"]')!.value, values.title);
      assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="title"]')!.disabled, false);
      assert.equal(ui.doc.activeElement?.getAttribute('name'), field === 'form' ? null : field);
    } finally { await ui.close(); }
  }
});

test("a native incomplete optional number cannot be submitted as unlimited attempts", async () => {
  const ui = await mount(h(QuizCreate, { courseId: course.id }), r => reply(r), 'teacher');
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
    for (const label of ["Guardar borrador", "Publicar quiz"])
      assert.equal(Array.from(ui.doc.querySelectorAll("button")).find(button => button.textContent === label)?.disabled, true);
    await ui.click('Agregar pregunta');
    await ui.submit('form', { 'questions.0.prompt': 'Pregunta', 'questions.0.alternatives.0.text': 'Sí', 'questions.0.alternatives.1.text': 'No' });
    assert.equal(ui.doc.activeElement?.getAttribute('type'), 'radio');
    assert.equal(ui.doc.activeElement?.closest('fieldset')?.getAttribute('aria-invalid'), 'true');
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
    assert.equal(ui.doc.querySelector<HTMLButtonElement>('[aria-label="Eliminar alternativa A de pregunta 1"]')!.disabled, true);
    await ui.settle(() => ui.doc.querySelector<HTMLButtonElement>('[aria-label="Agregar alternativa a pregunta 1"]')!.click());
    await ui.submit('form', { 'questions.0.alternatives.2.text': 'Otra alternativa' });
    const body = await ui.requests.find(r => r.method === 'PATCH')!.clone().json();
    const alternatives = body.questions[0].alternatives;
    assert.equal(new Set(alternatives.map((a: { id: string }) => a.id)).size, 3);
    assert.equal(alternatives[0].id, 'opcion-1000000');
  } finally { await ui.close(); }
});

test("confirmed creation navigates with the authorized receipt and the original filters", async () => {
  const view = await mount(h(QuizCreate, {
    courseId: course.id, filters: { query: "filtro anterior", status: "published", section: "" },
  }), r => r.method === 'POST' ? Response.json(emptyDraft, { status: 201 }) : reply(r), 'teacher');
  try {
    await view.submit('form', { title: 'Nuevo' });
    assert.match(view.doc.body.textContent!, /Borrador creado/);
    assert.doesNotMatch(view.doc.body.textContent!, /Resultado incierto/);
    assert.deepEqual(view.destinations, [`/courses/${course.id}/quizzes?q=filtro+anterior&estado=published&creado=${draft.id}`]);
    await view.submit('form', { title: 'Nuevo' });
    assert.equal(view.requests.filter(r => r.method === 'POST' && !r.url.endsWith('/login')).length, 1);
  } finally { await view.close(); }
});

test("editing uses progressive field errors and preserves past dates with microseconds", async () => {
  const existing = {
    ...draft,
    opensAt: "2020-01-01T12:00:00.123456-03:00",
    closesAt: "2020-01-02T12:00:00.654321-03:00",
  };
  const ui = await mount(h(QuizEditor, { courseId: course.id, quizId: draft.id }), async request =>
    request.method === "PATCH" ? Response.json({ ...existing, ...await request.clone().json() }) : reply(request, existing), "teacher");
  try {
    const input = (name: string) => ui.doc.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
    async function change(name: string, value: string) {
      await ui.settle(() => {
        const control = input(name);
        control.focus();
        control.value = value;
        control.dispatchEvent(new ui.dom.window.Event("input", { bubbles: true }));
      });
    }
    await ui.settle(() => { input("opensAt").focus(); input("closesAt").focus(); input("title").focus(); });
    assert.equal(input("opensAt").getAttribute("aria-invalid"), null);
    assert.equal(input("closesAt").getAttribute("aria-invalid"), null);
    await change("title", " ");
    assert.equal(input("title").getAttribute("aria-invalid"), null);
    await ui.settle(() => input("questions.0.points").focus());
    assert.match(ui.doc.body.textContent!, /Escribe el título del quiz/);
    await change("questions.0.points", "0");
    assert.equal(input("questions.0.points").getAttribute("aria-invalid"), null);
    await ui.settle(() => input("opensAt").focus());
    assert.match(ui.doc.body.textContent!, /El puntaje debe estar entre/);
    await change("opensAt", "2099-01-03T12:00");
    await ui.settle(() => input("title").focus());
    assert.match(ui.doc.body.textContent!, /El cierre debe ser posterior a la apertura/);
    await change("opensAt", input("opensAt").defaultValue);
    assert.equal(input("closesAt").getAttribute("aria-invalid"), null);
    await change("questions.0.points", String(existing.questions[0].points));
    assert.equal(input("questions.0.points").getAttribute("aria-invalid"), null);
    await change("title", "Título corregido");
    assert.equal(input("title").getAttribute("aria-invalid"), null);
    await ui.submit("form");
    const patch = ui.requests.find(request => request.method === "PATCH");
    assert.deepEqual(await patch?.clone().json(), { title: "Título corregido" });
  } finally { await ui.close(); }
});

for (const mode of ["crear", "editar"] as const) {
  test(`${mode}: las fechas cambian de error al salir del campo y el guardado vuelve a validar el reloj`, async t => {
    let now = Date.parse("2030-05-15T15:30:00Z");
    t.mock.method(Date, "now", () => now);
    const method = mode === "crear" ? "POST" : "PATCH";
    const view = mode === "crear" ? h(QuizCreate, { courseId: course.id }) : h(QuizEditor, { courseId: course.id, quizId: draft.id });
    const ui = await mount(view, async request => request.method === method
      ? Response.json({ ...draft, ...await request.clone().json() }, { status: mode === "crear" ? 201 : 200 })
      : reply(request), "teacher");
    try {
      const input = (name: string) => ui.doc.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
      const set = async (field: string, value: string) => ui.settle(() => {
        const control = input(field);
        control.focus();
        control.value = value;
        control.dispatchEvent(new ui.dom.window.Event("input", { bubbles: true }));
      });
      const writes = () => ui.requests.filter(r => r.method === method && !r.url.endsWith("/login"));
      await set("title", "Quiz con horario");
      await set("opensAt", "2030-05-15T11:29:59");
      assert.equal(input("opensAt").getAttribute("aria-invalid"), null);
      await set("closesAt", "2030-05-15T11:30");
      assert.equal(input("opensAt").getAttribute("aria-invalid"), "true");
      await ui.settle(() => input("maxAttempts").focus());
      assert.equal(input("closesAt").getAttribute("aria-invalid"), "true");
      await ui.submit("form");
      assert.equal(writes().length, 0);
      await set("opensAt", "2030-05-15T11:30:01");
      await set("closesAt", "2030-05-15T11:30:01");
      assert.match(ui.doc.body.textContent!, /El cierre debe ser posterior a la apertura/);
      await set("closesAt", "2030-05-15T11:30:02");
      assert.equal(input("opensAt").getAttribute("aria-invalid"), null);
      assert.equal(input("closesAt").getAttribute("aria-invalid"), null);
      await set("opensAt", "");
      now += 2000;
      await ui.submit("form");
      assert.equal(writes().length, 0);
      assert.match(ui.doc.body.textContent!, /El cierre debe ser posterior a la fecha y hora actuales/);
      await set("closesAt", "2030-05-15T11:30:03");
      assert.equal(input("closesAt").getAttribute("aria-invalid"), null);
      await ui.submit("form");
      assert.equal(writes().length, 1);
      const body = await writes()[0].clone().json();
      assert.equal(body.closesAt, "2030-05-15T15:30:03.000Z");
      assert.equal(body.opensAt ?? null, null);
    } finally { await ui.close(); }
  });
}
