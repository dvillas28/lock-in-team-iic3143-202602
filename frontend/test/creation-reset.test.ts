import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { useSession } from '../src/components/auth/session-provider.tsx';
import { ModuleForm } from '../src/components/content/module-form.tsx';
import { MaterialForm } from '../src/components/content/material-form.tsx';
import { CourseForm } from '../src/components/courses/course-form.tsx';
import { SectionForm } from '../src/components/courses/section-form.tsx';
import { EnrollmentForm } from '../src/components/courses/enrollment-form.tsx';
import { QuizCreate } from '../src/components/quizzes/quiz-create.tsx';
import { CourseDetail } from '../src/components/courses/course-detail.tsx';
import { mount } from './fixtures/course-ui.ts';
import { course, section, otherSection, person, enrollment, deferred } from './fixtures/courses.ts';
import { unit, material } from './fixtures/content.ts';
import { emptyDraft } from './fixtures/quizzes.ts';

type Kind = 'module' | 'material' | 'course' | 'section' | 'enrollment' | 'quiz';
function FormView({ kind, refresh = true, search = false, edit = false }: { kind: Kind; refresh?: boolean; search?: boolean; edit?: boolean }) {
  const { session, state } = useSession();
  const props = { session, slug: state.context!.slug, onSaved: async () => refresh };
  switch (kind) {
    case 'module': return h(ModuleForm, { ...props, courseId: course.id, items: [unit], item: edit ? unit : undefined });
    case 'material': return h(MaterialForm, { ...props, moduleId: unit.id, item: edit ? material : undefined });
    case 'course': return h(CourseForm, props);
    case 'section': return h(SectionForm, { ...props, courseId: course.id });
    case 'enrollment': return h(EnrollmentForm, { ...props, sectionId: section.id, search, onSaved: async () => {} });
    case 'quiz': return h(QuizCreate, { ...props, user: state.context!.user!, course, sections: [section] });
  }
}
const cases: { kind: Kind; label: string; values: Record<string, string>; message: string }[] = [
  { kind: 'module', label: 'Crear módulo', values: { title: 'Nueva unidad' }, message: 'Módulo creado.' },
  { kind: 'material', label: 'Crear material', values: { title: 'Nueva lectura', markdownBody: '  # Contenido nuevo  ' }, message: 'Material creado.' },
  { kind: 'course', label: 'Crear curso', values: { code: 'NUEVO', name: 'Nuevo curso', term: '2026-2', sectionCode: '1', capacity: '30' }, message: 'Curso creado.' },
  { kind: 'section', label: 'Crear sección', values: { code: '2', capacity: '30' }, message: 'Sección creada.' },
  { kind: 'enrollment', label: 'Asignar rol', values: { userId: person.id, role: 'assistant' }, message: 'Participante asignado.' },
  { kind: 'quiz', label: 'Crear quiz', values: { title: 'Nuevo quiz', instructions: 'Nuevas instrucciones', maxAttempts: '2' }, message: 'Quiz creado.' },
];
async function created(kind: Kind, request: Request) {
  const body = await request.json();
  const base = { module: unit, material, course, section, enrollment: { ...enrollment, role: body.role }, quiz: emptyDraft }[kind];
  return Response.json({ ...base, ...body }, { status: 201 });
}
for (const entry of cases) test(`${entry.label} clears confirmed input and reports the operation`, async () => {
  const ui = await mount(h(FormView, { kind: entry.kind }), r => r.method === 'POST' ? created(entry.kind, r) : Response.json({ items: [section] }), 'ownerTeacher');
  try {
    const selector = `form[aria-label="${entry.label}"]`;
    await ui.submit(selector, entry.values);
    const form = ui.doc.querySelector<HTMLFormElement>(selector)!;
    for (const name of Object.keys(entry.values)) {
      const control = form.elements.namedItem(name) as HTMLInputElement;
      assert.equal(control.value, name === 'role' ? 'teacher' : '', name);
    }
    assert.equal(ui.requests.filter(r => r.method === 'POST' && !r.url.endsWith('/login')).length, 1);
    if (entry.kind !== 'course') assert.match(ui.doc.querySelector('[role="status"]')!.textContent!, new RegExp(entry.message.replace('.', '\\.')));
    assert.doesNotMatch(ui.doc.body.textContent!, /Cambio confirmado/);
    await ui.submit(selector);
    assert.equal(ui.requests.filter(r => r.method === 'POST' && !r.url.endsWith('/login')).length, 1);
  } finally { await ui.close(); }
});
for (const kind of ['module', 'material'] as const) test(`${kind} keeps pending input, then clears confirmed creation even if refreshing fails`, async () => {
  const pending = deferred<Response>(), entry = cases.find(c => c.kind === kind)!;
  const ui = await mount(h(FormView, { kind, refresh: false }), () => pending.promise, 'teacher');
  try {
    const selector = `form[aria-label="${entry.label}"]`;
    await ui.submit(selector, entry.values);
    const title = ui.doc.querySelector<HTMLInputElement>(`${selector} input[name="title"]`)!;
    assert.equal(title.value, entry.values.title);
    assert.equal(ui.doc.querySelector('fieldset')!.disabled, true);
    const request = ui.requests.find(r => r.method === 'POST' && !r.url.endsWith('/login'))!;
    const response = await created(kind, request);
    await ui.settle(() => pending.resolve(response));
    assert.equal(title.value, '');
    assert.match(ui.doc.querySelector('[role="status"]')!.textContent!, /creado\. No se pudo actualizar/);
    assert.doesNotMatch(ui.doc.body.textContent!, /Resultado incierto/);
  } finally { await ui.close(); }
});

test('student section context stays in course detail without a management link or useless open action', async () => {
  for (const sections of [false, true]) {
    const ui = await mount(h(CourseDetail, { courseId: course.id, sections }), r => Response.json(r.url.endsWith('/sections') ? { items: [section, otherSection] } : course), 'student');
    try {
      assert.match(ui.doc.body.textContent!, /Tu secciónSección 1Estudiante/);
      assert.equal(ui.doc.querySelector('a[href$="/sections"]'), null);
      assert.equal(ui.doc.querySelector('button,form'), null);
      assert.doesNotMatch(ui.doc.body.textContent!, /Capacidad|Secciones autorizadas|Sección 2/);
      assert.equal(ui.requests.some(r => r.url.endsWith(`/sections/${section.id}`)), false);
    } finally { await ui.close(); }
  }
});

for (const kind of ['module', 'material'] as const) test(`${kind} update retains the edited values`, async () => {
  const ui = await mount(h(FormView, { kind, edit: true }), async r => Response.json({ ...(kind === 'module' ? unit : material), ...await r.json() }), 'teacher');
  try {
    const selector = `form[aria-label="${kind === 'module' ? 'Editar módulo Unidad 1' : 'Editar material Lectura'}"]`;
    await ui.submit(selector, { title: 'Título actualizado', ...(kind === 'material' ? { markdownBody: '  Texto actualizado  ' } : {}) });
    assert.equal(ui.doc.querySelector<HTMLInputElement>(`${selector} input[name="title"]`)!.value, 'Título actualizado');
    if (kind === 'material') assert.equal(ui.doc.querySelector<HTMLTextAreaElement>(`${selector} textarea`)!.value, '  Texto actualizado  ');
    assert.match(ui.doc.querySelector('[role="status"]')!.textContent!, /actualizado/);
  } finally { await ui.close(); }
});

test('participant search and selection clear only after confirmed assignment', async () => {
  for (const status of [201, 422, 503]) {
    const ui = await mount(h(FormView, { kind: 'enrollment', search: true }), r => r.method === 'POST' ? status === 201 ? created('enrollment', r) : Response.json({}, { status }) : Response.json(r.url.includes('/users') ? { items: [person], hasMore: false, nextCursor: null } : { items: [], hasMore: false, nextCursor: null }), 'teacher');
    try {
      await ui.submit('form[aria-label="Buscar participantes"]', { search: 'María' });
      await ui.click('María Pérez · maria@example.test');
      await ui.submit('form[aria-label="Asignar rol"]', { role: 'assistant' });
      assert.equal(ui.doc.querySelector<HTMLInputElement>('input[name="search"]')!.value, status === 201 ? '' : 'María');
      assert.equal(ui.doc.body.textContent!.includes('Persona seleccionada: María Pérez'), status !== 201);
      if (status === 201) assert.equal(ui.doc.querySelector<HTMLButtonElement>('form[aria-label="Asignar rol"] button')!.disabled, true);
    } finally { await ui.close(); }
  }
});
