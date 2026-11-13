import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { useSession } from '../src/components/auth/session-provider.tsx';
import { ModuleForm } from '../src/components/content/module-form.tsx';
import { CourseForm } from '../src/components/courses/course-form.tsx';
import { SectionForm } from '../src/components/courses/section-form.tsx';
import { QuizCreate } from '../src/components/quizzes/quiz-create.tsx';
import { CourseDetail } from '../src/components/courses/course-detail.tsx';
import { mount } from './fixtures/course-ui.ts';
import { course, section, otherSection, deferred } from './fixtures/courses.ts';
import { unit } from './fixtures/content.ts';
import { emptyDraft, reply as quizReply } from './fixtures/quizzes.ts';
import { academicYears } from '../src/lib/courses/creation.ts';

// The assignment form lives in a dialog remounted per opening: see participant-assignment.test.ts.
type Kind = 'module' | 'course' | 'section' | 'quiz';
function FormView({ kind, refresh = true, edit = false }: { kind: Kind; refresh?: boolean; edit?: boolean }) {
  const { session, state } = useSession();
  const props = { session, slug: state.context!.slug, onSaved: async () => refresh };
  switch (kind) {
    case 'module': return h(ModuleForm, { ...props, courseId: course.id, items: [unit], item: edit ? unit : undefined });
    case 'course': return h(CourseForm, props);
    case 'section': return h(SectionForm, { ...props, courseId: course.id });
    case 'quiz': return h(QuizCreate, { courseId: course.id });
  }
}
const cases: { kind: Kind; label: string; values: Record<string, string>; message: string }[] = [
  { kind: 'module', label: 'Crear módulo', values: { title: 'Nueva unidad' }, message: 'Módulo creado.' },
  { kind: 'course', label: 'Crear curso', values: { code: 'NUEVO', name: 'Nuevo curso', term: '2026-2', sectionCode: '1', capacity: '30' }, message: 'Curso creado.' },
  { kind: 'section', label: 'Crear sección', values: { code: '2', capacity: '30' }, message: 'Sección creada.' },
  { kind: 'quiz', label: 'Crear quiz', values: { title: 'Nuevo quiz', instructions: 'Nuevas instrucciones', maxAttempts: '2' }, message: 'Borrador creado.' },
];
async function created(kind: Kind, request: Request) {
  const body = await request.json();
  const base = { module: unit, course, section, quiz: emptyDraft }[kind];
  return Response.json({ ...base, ...body }, { status: 201 });
}
for (const entry of cases) test(`${entry.label} clears confirmed input and reports the operation`, async () => {
  const ui = await mount(h(FormView, { kind: entry.kind }), r => r.method === 'POST' ? created(entry.kind, r) : entry.kind === 'quiz' ? quizReply(r) : Response.json({ items: [section] }), 'ownerTeacher');
  try {
    const selector = `form[aria-label="${entry.label}"]`;
    await ui.submit(selector, entry.values);
    const form = ui.doc.querySelector<HTMLFormElement>(selector)!;
    for (const name of Object.keys(entry.values)) {
      const control = form.elements.namedItem(name) as HTMLInputElement;
      assert.equal(control.value, entry.kind === 'course' && name === 'term' ? `${academicYears()[0]}-1` : '', name);
    }
    assert.equal(ui.requests.filter(r => r.method === 'POST' && !r.url.endsWith('/login')).length, 1);
    if (entry.kind !== 'course') {
      const status = entry.kind === 'quiz' ? form.querySelector('[role="status"]') : ui.doc.querySelector('[role="status"]');
      assert.match(status!.textContent!, new RegExp(entry.message.replace('.', '\\.')));
    }
    assert.doesNotMatch(ui.doc.body.textContent!, /Cambio confirmado/);
    await ui.submit(selector);
    assert.equal(ui.requests.filter(r => r.method === 'POST' && !r.url.endsWith('/login')).length, 1);
  } finally { await ui.close(); }
});
for (const kind of ['module'] as const) test(`${kind} keeps pending input, then clears confirmed creation even if refreshing fails`, async () => {
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
    assert.match(ui.doc.querySelector('[role="status"]')!.textContent!, /(creado|creada)\. No se pudo actualizar/);
    assert.doesNotMatch(ui.doc.body.textContent!, /Resultado incierto/);
  } finally { await ui.close(); }
});

test('student section context stays read-only: own section roster, no management action or foreign section', async () => {
  const ui = await mount(h(CourseDetail, { courseId: course.id }), r => Response.json(r.url.endsWith('/participants') ? { items: [] } : r.url.endsWith('/sections') ? { items: [section, otherSection] } : course), 'student');
  try {
    assert.equal(ui.doc.querySelector('.section-current')?.textContent, 'Sección 1');
    assert.equal(ui.doc.querySelector('button,form'), null);
    assert.doesNotMatch(ui.doc.body.textContent!, /Capacidad|Cupos de estudiantes|Secciones autorizadas|Sección 2/);
    assert.equal(ui.requests.some(r => r.url.endsWith(`/sections/${section.id}`) || r.url.includes('/enrollments')), false);
    assert.deepEqual(ui.requests.filter(r => r.url.endsWith('/participants')).map(r => r.url.includes(section.id)), [true]);
  } finally { await ui.close(); }
});

for (const kind of ['module'] as const) test(`${kind} update retains the edited values`, async () => {
  const ui = await mount(h(FormView, { kind, edit: true }), async r => Response.json({ ...unit, ...await r.json() }), 'teacher');
  try {
    const selector = 'form[aria-label="Editar módulo Unidad 1"]';
    await ui.submit(selector, { title: 'Título actualizado' });
    assert.equal(ui.doc.querySelector<HTMLInputElement>(`${selector} input[name="title"]`)!.value, 'Título actualizado');
    assert.match(ui.doc.querySelector('[role="status"]')!.textContent!, /actualizado/);
  } finally { await ui.close(); }
});

