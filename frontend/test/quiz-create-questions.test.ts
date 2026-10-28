import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { QuizList } from "../src/components/quizzes/quiz-list.tsx";
import { mount, draft, course, id, reply, deferred } from "./fixtures/quizzes.ts";

const view = () => h(QuizList, { courseId: course.id });
const first = { 'questions.0.prompt': 'Primera pregunta', 'questions.0.points': '2.5', 'questions.0.alternatives.0.text': 'Primera alternativa', 'questions.0.alternatives.1.text': 'Segunda alternativa' };
const posts = (requests: Request[]) => requests.filter(r => r.method === 'POST' && !r.url.endsWith('/login'));
type CreatedQuestion = { id?: string; prompt: string; position: number; alternatives: { id: string; isCorrect: boolean }[] };
async function created(request: Request) {
  const body = await request.clone().json();
  return Response.json({ ...draft, ...body, id: id(80), questions: body.questions.map((q: CreatedQuestion, i: number) => ({ ...q, id: id(90 + i) })) }, { status: 201 });
}

test('creation sends reordered questions and correct answers in one POST without question UUIDs', async () => {
  const ui = await mount(view(), r => r.method === 'POST' ? created(r) : reply(r), 'teacher');
  try {
    await ui.click('Agregar pregunta');await ui.click('Agregar pregunta');
    const values = { ...first, 'questions.1.prompt': 'Segunda pregunta', 'questions.1.points': '3', 'questions.1.alternatives.0.text': 'Otra alternativa', 'questions.1.alternatives.1.text': 'Respuesta correcta' };
    await ui.settle(() => {
      for (const [name, value] of Object.entries(values)) (ui.doc.querySelector('form')!.elements.namedItem(name) as HTMLInputElement).value = value;
      const radios = ui.doc.querySelectorAll<HTMLInputElement>('input[type="radio"]');radios[0].click();radios[3].click();
    });
    await ui.click('Subir pregunta 2');
    await ui.submit('form', { title: 'Quiz con preguntas' });
    assert.equal(posts(ui.requests).length, 1);
    const body = await posts(ui.requests)[0].clone().json();
    assert.deepEqual(body.questions.map((q: CreatedQuestion) => q.prompt), ['Segunda pregunta', 'Primera pregunta']);
    assert.deepEqual(body.questions.map((q: CreatedQuestion) => q.position), [1, 2]);
    assert.ok(body.questions.every((q: CreatedQuestion) => !('id' in q)));
    assert.deepEqual(body.questions.map((q: CreatedQuestion) => q.alternatives.find(a => a.isCorrect)!.id), ['b', 'a']);
    assert.equal(body.questions[1].points, 2.5);
    assert.equal(ui.doc.querySelector('[name^="questions."]'), null);
    assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="title"]')!.value, '');
    assert.match(ui.doc.body.textContent!, /Quiz creado/);
    assert.equal(ui.requests.some(r => r.url.endsWith('/authoring') || r.method === 'PATCH'), false);
    await ui.submit('form', { title: 'Otra creación' });
    assert.equal(posts(ui.requests).length, 1);
  } finally { await ui.close(); }
});

test('invalid questions block creation locally and preserve the editable draft', async () => {
  const cases: { values: Record<string, string>; correct: boolean; field: string }[] = [
    { values: { 'questions.0.prompt': ' ' }, correct: true, field: 'questions.0.prompt' },
    { values: { 'questions.0.alternatives.0.text': '' }, correct: true, field: 'questions.0.alternatives.0.text' },
    { values: {}, correct: false, field: 'correct-' },
    { values: { 'questions.0.points': '0' }, correct: true, field: 'questions.0.points' },
    { values: { 'questions.0.points': '0.001' }, correct: true, field: 'questions.0.points' },
    { values: { 'questions.0.prompt': '😀'.repeat(1100) }, correct: true, field: '' },
  ];
  for (const entry of cases) {
    const ui = await mount(view(), r => reply(r), 'teacher');
    try {
      await ui.click('Agregar pregunta');
      if (entry.correct) await ui.settle(() => ui.doc.querySelector<HTMLInputElement>('input[type="radio"]')!.click());
      await ui.submit('form', { title: 'Quiz pendiente', ...first, ...entry.values });
      assert.equal(posts(ui.requests).length, 0);
      assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="title"]')!.value, 'Quiz pendiente');
      assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="questions.0.points"]')!.matches(':disabled'), false);
      if (entry.field) assert.ok(ui.doc.activeElement?.getAttribute('name')?.startsWith(entry.field), entry.field);
      else assert.match(ui.doc.body.textContent!, /4096 bytes UTF-8/);
    } finally { await ui.close(); }
  }
});

test('lost creation response retains questions and blocks a second POST', async () => {
  const ui = await mount(view(), r => r.method === 'POST' ? Promise.reject(new Error('lost response')) : reply(r), 'teacher');
  try {
    await ui.click('Agregar pregunta');
    await ui.settle(() => ui.doc.querySelector<HTMLInputElement>('input[type="radio"]')!.click());
    await ui.submit('form', { title: 'Quiz incierto', ...first });
    assert.match(ui.doc.body.textContent!, /Resultado incierto/);
    const prompt = ui.doc.querySelector<HTMLTextAreaElement>('[name="questions.0.prompt"]')!;
    assert.equal(prompt.value, first['questions.0.prompt']);
    assert.equal(prompt.matches(':disabled'), true);
    assert.equal(ui.doc.querySelector<HTMLInputElement>('input[type="radio"]')!.checked, true);
    await ui.submit('form');
    assert.equal(posts(ui.requests).length, 1);
  } finally { await ui.close(); }
});

test('institution change clears creation questions and discards a late success', async () => {
  const pending = deferred<Response>();
  const ui = await mount(view(), r => r.method === 'POST' ? pending.promise : reply(r), 'teacher');
  try {
    await ui.click('Agregar pregunta');
    await ui.settle(() => ui.doc.querySelector<HTMLInputElement>('input[type="radio"]')!.click());
    await ui.submit('form', { title: 'Quiz privado', ...first });
    const request = posts(ui.requests)[0];
    await ui.actor('teacher', 'utfsm');
    const response = await created(request);
    await ui.settle(() => pending.resolve(response));
    assert.equal(ui.doc.querySelector('[name^="questions."]'), null);
    assert.equal(ui.doc.querySelector<HTMLInputElement>('[name="title"]')!.value, '');
    assert.doesNotMatch(ui.doc.body.textContent!, /Quiz privado|Quiz creado/);
  } finally { await ui.close(); }
});
