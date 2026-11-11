import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { ModulesPanel } from "../src/components/content/modules-panel.tsx";
import { QuizList } from "../src/components/quizzes/quiz-list.tsx";
import { Assignments } from "../src/components/assignments/assignments.tsx";
import { StudentGrades } from "../src/components/gradebook/student-grades.tsx";
import { CourseGradebook } from "../src/components/gradebook/course-gradebook.tsx";
import { CourseAudit } from "../src/components/audit/course-audit.tsx";
import { CourseRouteLoading, courseSectionTitles } from "../src/components/courses/course-route-loading.tsx";
import { CourseSectionSkeleton } from "../src/components/courses/course-skeleton.tsx";
import { resetSkeletonDelay } from "../src/components/use-skeleton-delay.ts";
import { mount } from "./fixtures/course-ui.ts";
import { course, deferred } from "./fixtures/courses.ts";

const sections = {
  modules: (courseId: string) => h(ModulesPanel, { courseId }),
  quizzes: (courseId: string) => h(QuizList, { courseId }),
  assignments: (courseId: string) => h(Assignments, { courseId }),
  grades: (courseId: string) => h(StudentGrades, { courseId }),
  gradebook: (courseId: string) => h(CourseGradebook, { courseId }),
  audit: (courseId: string) => h(CourseAudit, { courseId }),
} as const;
const empty = (r: Request) => r.url.endsWith(course.id) ? Response.json(course) : Response.json({ items: [] });
const route = (pathname: string) => new JSDOM(renderToStaticMarkup(
  h(PathnameContext.Provider, { value: pathname }, h(CourseRouteLoading)))).window.document;

function assertSkeleton(doc: Document, title: string) {
  const main = doc.querySelector(".academic-workspace")!;
  assert.ok(main, "course skeleton");
  assert.deepEqual([...doc.querySelectorAll("h1")].map(e => e.textContent), [title]);
  assert.equal(doc.querySelector("h1")!.closest('[aria-hidden="true"]'), null);
  assert.equal(main.querySelector('[role="status"]')?.textContent, `Cargando ${title.toLocaleLowerCase("es")}…`);
  assert.equal(main.querySelectorAll(".skeleton-course-tabs > .course-tab").length, 2);
  assert.equal(main.querySelector("a, button, input, select, textarea, [tabindex]"), null);
  assert.equal(main.querySelector("nav"), null, "no navigation landmark before tabs are known");
  assert.doesNotMatch(doc.body.textContent!, /Espera un momento|Cargando contenido/);
}

test("route fallback and each page's pending branch render the same section skeleton", async () => {
  for (const [section, view] of Object.entries(sections)) {
    const title = courseSectionTitles[section];
    assertSkeleton(route(`/courses/${course.id}/${section}`), title);
    const pending = deferred<Response>();
    const ui = await mount(view(course.id), () => pending.promise, section === "grades" ? "student" : "teacher");
    try {
      assertSkeleton(ui.doc, title);
      assert.equal(ui.doc.querySelector(".academic-workspace")!.innerHTML.replace(/ style="[^"]*"/g, ""),
        route(`/courses/${course.id}/${section}`).querySelector(".academic-workspace")!.innerHTML.replace(/ style="[^"]*"/g, ""),
        `${section}: same composition in the route and the page`);
    } finally { await ui.close(); }
  }
});

test("other paths keep their existing states and the Mis cursos pilot is preserved", () => {
  const directory = route("/courses");
  assert.equal(directory.querySelector("h1")?.textContent, "Mis cursos");
  assert.equal(directory.querySelector('[role="status"]')?.textContent, "Cargando cursos…");
  assert.equal(directory.querySelectorAll(".course-grid > .course-card").length, 6);
  for (const path of [`/courses/${course.id}/modules/${course.id}/materials/${course.id}`, `/courses/${course.id}/sections`, `/courses/${course.id}`, `/courses/${course.id}/unknown`]) {
    const doc = route(path);
    assert.equal(doc.querySelector(".skeleton"), null, path);
    assert.match(doc.body.textContent!, /Cargando contenido/, path);
  }
});

test("skeleton tabs are identical for every role and reveal no role-specific section", async () => {
  const shapes = new Set<string>();
  for (const profile of ["student", "assistant", "teacher", "owner", "multi"]) {
    const ui = await mount(sections.quizzes(course.id), () => new Promise<Response>(() => {}), profile);
    try {
      shapes.add(ui.doc.querySelector(".skeleton-course-tabs")!.outerHTML);
      assert.doesNotMatch(ui.doc.body.textContent!, /Tareas|Secciones|Mis notas|Libro de notas|Auditoría/);
    } finally { await ui.close(); }
  }
  assert.equal(shapes.size, 1);
});

test("modules, quizzes and tasks hand over to the real header, tabs and content", async () => {
  for (const [section, title] of [["modules", "Módulos y material"], ["quizzes", "Quizzes"], ["assignments", "Tareas"]] as const) {
    const pending = deferred<void>();
    const ui = await mount(sections[section](course.id), async r => { await pending.promise; return empty(r); }, "teacher");
    try {
      assert.ok(ui.doc.querySelector(".skeleton-region"));
      await ui.settle(() => pending.resolve());
      assert.equal(ui.doc.querySelector(".skeleton"), null);
      assert.deepEqual([...ui.doc.querySelectorAll("h1")].map(e => e.textContent), [title]);
      const tabs = [...ui.doc.querySelectorAll('nav[aria-label="Curso"] a')].map(a => a.textContent);
      assert.deepEqual(tabs.slice(0, 3), ["Módulos y material", "Quizzes", "Tareas"]);
      assert.equal(ui.doc.querySelector('nav[aria-label="Curso"] [aria-current="page"]')?.textContent, title);
      assert.match(ui.doc.querySelector(".page-heading")!.textContent!, /IIC3143 · 2026-2.*Desarrollo de software/);
    } finally { await ui.close(); }
  }
});

test("403, 404 and 500 keep their error states without leftover placeholders", async () => {
  for (const section of ["modules", "quizzes", "assignments"] as const) {
    for (const [status, text] of [[403, /Permisos insuficientes/], [404, /no disponible/], [500, /No se pudo completar/]] as const) {
      const ui = await mount(sections[section](course.id), () => Response.json({ status }, { status }), "teacher");
      try {
        assert.match(ui.doc.body.textContent!, text, `${section} ${status}`);
        assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null, `${section} ${status}`);
      } finally { await ui.close(); }
    }
  }
});

test("a skeleton that replaces another continues its delay instead of restarting it", async () => {
  resetSkeletonDelay();
  let view: ReactNode = h(CourseSectionSkeleton, { title: "Quizzes", key: "route" });
  const ui = await mount(h(() => view), () => new Promise<Response>(() => {}));
  const delay = () => Number.parseFloat(ui.doc.querySelector<HTMLElement>(".academic-workspace")!.style.getPropertyValue("--skeleton-delay"));
  try {
    assert.equal(delay(), 200);
    await new Promise(done => setTimeout(done, 120));
    view = h(CourseSectionSkeleton, { title: "Quizzes", key: "page" });
    await ui.render(h(() => view));
    assert.ok(delay() <= 80 && delay() > 0, `continued, got ${delay()}`);
    await new Promise(done => setTimeout(done, 150));
    await ui.render(h(() => h(CourseSectionSkeleton, { title: "Quizzes", key: "visible" })));
    assert.ok(delay() < 0, `already visible stays visible, got ${delay()}`);
    await ui.render(h(() => h("p", null, "Contenido")));
    await new Promise(done => setTimeout(done, 150));
    await ui.render(h(() => h(CourseSectionSkeleton, { title: "Tareas", key: "later" })));
    assert.equal(delay(), 200, "a later transition starts fresh");
  } finally { await ui.close(); resetSkeletonDelay(); }
});
