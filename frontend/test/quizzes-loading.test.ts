import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { QuizList } from "../src/components/quizzes/quiz-list.tsx";
import { QuizDetail } from "../src/components/quizzes/quiz-detail.tsx";
import { QuizEditor } from "../src/components/quizzes/quiz-editor.tsx";
import { QuizCreate } from "../src/components/quizzes/quiz-create.tsx";
import { AttemptList } from "../src/components/attempts/attempt-list.tsx";
import { AttemptReview } from "../src/components/attempts/attempt-review.tsx";
import { AttemptDetail } from "../src/components/attempts/attempt-detail.tsx";
import { CourseRouteLoading } from "../src/components/courses/course-route-loading.tsx";
import { QuizSkeleton, quizSkeletonKind, type QuizSkeletonKind } from "../src/components/quizzes/quiz-skeleton.tsx";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { SessionProvider } from "../src/components/auth/session-provider.tsx";
import { mount } from "./fixtures/course-ui.ts";
import { course, draft, id, reply } from "./fixtures/quizzes.ts";

const quizId = draft.id, attemptId = id(80), base = `/courses/${course.id}/quizzes`;
const views: [QuizSkeletonKind, string | undefined, ReactElement, string | undefined, string][] = [
  ["list", base, h(QuizList, { courseId: course.id }), "Quizzes", "Cargando quizzes…"],
  ["detail", `${base}/${quizId}`, h(QuizDetail, { courseId: course.id, quizId }), undefined, "Cargando quiz…"],
  ["create", `${base}/new`, h(QuizCreate, { courseId: course.id }), "Crear quiz", "Cargando formulario del quiz…"],
  ["edit", `${base}/${quizId}/authoring`, h(QuizEditor, { courseId: course.id, quizId }), undefined, "Cargando quiz…"],
  ["attempts", `${base}/${quizId}/attempts`, h(AttemptList, { courseId: course.id, quizId }), undefined, "Cargando intentos…"],
  ["review", `${base}/${quizId}/attempts/${attemptId}`, h(AttemptReview, { courseId: course.id, quizId, attemptId }), undefined, "Cargando revisión del intento…"],
  ["attempt", undefined, h(AttemptDetail, { attemptId }), undefined, "Cargando intento…"],
];
const parse = (node: ReactElement) => new JSDOM(renderToStaticMarkup(node)).window.document;
const route = (pathname: string) => parse(h(PathnameContext.Provider, { value: pathname }, h(CourseRouteLoading)));
const shape = (doc: Document) => doc.querySelector(".academic-workspace")!.innerHTML.replace(/ style="[^"]*"/g, "");
const never = () => new Promise<Response>(() => {});

test("every quiz and attempt view shows its skeleton, the same one its route fallback renders", async () => {
  for (const [kind, path, view, title, label] of views) {
    if (path) assert.equal(quizSkeletonKind(path), kind, path);
    const ui = await mount(view, never, "teacher");
    try {
      const page = ui.doc.querySelector(".academic-workspace")!;
      assert.ok(page, kind);
      assert.deepEqual([...ui.doc.querySelectorAll("h1")].map(e => e.textContent), title ? [title] : [], `${kind}: only static titles are headings`);
      assert.deepEqual([...page.querySelectorAll('[role="status"]')].map(e => e.textContent), [label], kind);
      assert.equal(page.querySelector("a, button, input, select, textarea, label, [tabindex], nav"), null, `${kind}: no fake controls`);
      assert.doesNotMatch(ui.doc.body.textContent!, /Cargando contenido|Espera un momento/);
      assert.equal(shape(ui.doc), shape(path ? route(path) : parse(h(QuizSkeleton, { kind }))), `${kind}: same composition`);
    } finally { await ui.close(); }
  }
});

test("without an institutional context each view draws its own skeleton, never the neutral fallback", () => {
  const router: AppRouterInstance = { back() {}, forward() {}, refresh() {}, prefetch() {}, push() {}, replace() {}, bfcacheId: "test" };
  for (const [kind, path, view] of views) {
    const doc = parse(h(AppRouterContext.Provider, { value: router }, h(SessionProvider, null, view)));
    assert.doesNotMatch(doc.body.textContent!, /Cargando contenido/, kind);
    assert.equal(shape(doc), shape(path ? route(path) : parse(h(QuizSkeleton, { kind }))), `${kind}: same composition`);
  }
});

test("routes outside the quiz views keep their own fallback", () => {
  for (const path of [`${base}/${quizId}/other`, `${base}/${quizId}/attempts/${attemptId}/x`, `/courses/${course.id}/assignments`]) assert.equal(quizSkeletonKind(path), undefined, path);
  const other = route(`${base}/${quizId}/other`);
  assert.equal(other.querySelector(".academic-workspace, .skeleton-course-tabs, h1"), null, "neutral fallback only");
  assert.equal(other.querySelector('[role="status"]')?.textContent, "Cargando contenido…");
});

test("the list hands over to the real directory, its empty state and the real tabs", async () => {
  let release!: () => void;
  const gate = new Promise<void>(done => { release = done; });
  const ui = await mount(views[0][2], async r => { await gate; return r.url.endsWith("/quizzes") ? Response.json({ items: [] }) : reply(r); }, "teacher");
  try {
    assert.equal(ui.doc.querySelectorAll(".skeleton-content .quiz-row").length, 3);
    await ui.settle(() => release());
    assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null);
    assert.match(ui.doc.body.textContent!, /Aún no hay quizzes/);
    assert.equal(ui.doc.querySelector('nav[aria-label="Curso"] [aria-current="page"]')?.textContent, "Quizzes");
    assert.deepEqual([...ui.doc.querySelectorAll("h1")].map(e => e.textContent), ["Quizzes"]);
  } finally { await ui.close(); }
});

test("the detail hands over to the real quiz without leftover placeholders", async () => {
  const ui = await mount(views[1][2], r => reply(r), "teacher");
  try {
    assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null);
    assert.deepEqual([...ui.doc.querySelectorAll("h1")].map(e => e.textContent), [draft.title]);
  } finally { await ui.close(); }
});

test("403, 404 and 500 keep their error states without placeholders", async () => {
  for (const [kind, , view] of views.filter(([kind]) => ["list", "detail", "review", "attempt"].includes(kind))) {
    for (const [status, text] of [[403, /Permisos insuficientes/], [404, /no disponible/], [500, /No se pudo completar/]] as const) {
      const ui = await mount(view, () => Response.json({ status }, { status }), "teacher");
      try {
        assert.match(ui.doc.body.textContent!, text, `${kind} ${status}`);
        assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null, `${kind} ${status}`);
      } finally { await ui.close(); }
    }
  }
});

test("placeholders are identical for students, assistants and teachers", async () => {
  for (const [kind, , view] of views.filter(([kind]) => ["list", "detail", "attempt"].includes(kind))) {
    const shapes = new Set<string>();
    for (const profile of ["student", "assistant", "teacher"]) {
      const ui = await mount(view, never, profile);
      try { shapes.add(shape(ui.doc)); } finally { await ui.close(); }
    }
    assert.equal(shapes.size, 1, kind);
  }
});
