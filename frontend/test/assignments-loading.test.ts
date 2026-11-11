import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { Assignments } from "../src/components/assignments/assignments.tsx";
import { TeacherSubmissions } from "../src/components/assignments/teacher-submissions.tsx";
import { StudentSubmissions } from "../src/components/assignments/student-submissions.tsx";
import { SubmissionReview } from "../src/components/assignments/submission-review.tsx";
import { assignmentSkeletonRoute } from "../src/components/assignments/assignment-skeleton.tsx";
import { CourseRouteLoading } from "../src/components/courses/course-route-loading.tsx";
import type { Assignment } from "../src/lib/api/assignments.ts";
import type { RosterEntry } from "../src/lib/api/submissions.ts";
import { mount } from "./fixtures/course-ui.ts";
import { course, deferred, id, person, section } from "./fixtures/courses.ts";

const base = `/courses/${course.id}/assignments`, assignmentId = id(65);
const task: Assignment = {
  id:assignmentId,courseId:course.id,sectionId:null,groupId:id(66),groupTitle:"Tareas",status:"published",
  publishedAt:course.createdAt,canManage:true,title:"Análisis",description:null,instructions:"Lee el enunciado.",
  maxPoints:10,weightPercent:100,allowedExtensions:["pdf"],allowWrittenResponse:false,maxAttempts:2,
  availableFrom:null,dueAt:null,availableUntil:null,version:0,
};
const scope = {slug:"uc",courseId:course.id,assignmentId};
const student: RosterEntry = {studentId:person.id,sectionId:section.id,sectionCode:section.code,name:person.name,
  latestAttempt:null,isLate:false,gradeStatus:"none",draft:null};
const pages: [string, string, ReactElement, string | undefined, string][] = [
  ["list", base, h(Assignments, {courseId:course.id}), "Tareas", "Cargando tareas…"],
  ["detail", `${base}/${assignmentId}`, h(Assignments, {courseId:course.id,assignmentId}), undefined, "Cargando tarea…"],
];
const panels: [string, ReactElement, string, string][] = [
  ["teacher", h(TeacherSubmissions, {scope,maxPoints:10}), "Entregas y calificaciones", "Cargando entregas…"],
  ["student", h(StudentSubmissions, {item:task,scope,sections:[section],now:Date.now()}), "Tu entrega", "Cargando tu entrega…"],
  ["review", h(SubmissionReview, {scope,student,maxPoints:10,disabled:false,onChanged:async()=>{}}), person.name, `Cargando la entrega de ${person.name}…`],
];
const parse = (node: ReactElement) => new JSDOM(renderToStaticMarkup(node)).window.document;
const route = (pathname: string) => parse(h(PathnameContext.Provider, { value: pathname }, h(CourseRouteLoading)));
const shape = (doc: Document) => doc.querySelector(".academic-workspace")!.innerHTML.replace(/ style="[^"]*"/g, "");
const never = () => new Promise<Response>(() => {});
const headings = (doc: Document, level = "h1") => [...doc.querySelectorAll(level)].map(e => e.textContent);
const reply = (r: Request) => {
  const url = new URL(r.url).pathname;
  if (url.endsWith(`/courses/${course.id}`)) return Response.json(course);
  if (url.endsWith("/sections")) return Response.json({items:[section]});
  if (url.endsWith("/evaluation-groups")) return Response.json({items:[]});
  if (url.endsWith(`/assignments/${assignmentId}`)) return Response.json(task);
  if (url.endsWith("/my-submissions")) return Response.json({attempts:[],grade:null,usedAttempts:0,sections:[section.id],serverNow:new Date().toISOString()});
  if (url.endsWith("/submissions")) return Response.json({gradeItemId:id(68),students:[]});
  return Response.json({items:[]});
};

test("list and detail show their skeleton, the same one their route fallback renders", async () => {
  for (const [kind, path, view, title, label] of pages) {
    assert.equal(assignmentSkeletonRoute(path)?.kind, kind, path);
    const ui = await mount(view, never, "teacher");
    try {
      const page = ui.doc.querySelector(".academic-workspace")!;
      assert.deepEqual(headings(ui.doc), title ? [title] : [], `${kind}: only static titles are headings`);
      assert.deepEqual([...page.querySelectorAll('[role="status"]')].map(e => e.textContent), [label], kind);
      assert.equal(page.querySelector("button, input, select, textarea, label, [tabindex], nav"), null, `${kind}: no fake controls`);
      assert.doesNotMatch(ui.doc.body.textContent!, /Cargando contenido|Espera un momento/);
      assert.equal(shape(ui.doc), shape(route(path)), `${kind}: same composition`);
      const links = [...page.querySelectorAll("a")];
      if (kind === "list") assert.equal(links.length, 0);
      else {
        assert.deepEqual(links.map(a => [a.textContent!.trim(), a.getAttribute("href")]), [["Volver a Tareas", base]], "the way back stays real");
        assert.equal(links[0].closest('[aria-hidden="true"]'), null);
        assert.equal(page.querySelectorAll(".assignment-detail, .assignment-instructions").length, 2);
      }
    } finally { await ui.close(); }
  }
  assert.equal(route(base).querySelectorAll(".skeleton-content .assignment-row").length, 3);
});

test("routes outside the assignment views keep their own fallback", () => {
  for (const path of [`${base}/${assignmentId}/other`, `/courses/${course.id}/assignmentsx`, `/courses/${course.id}/quizzes`]) assert.equal(assignmentSkeletonRoute(path), undefined, path);
  const other = route(`${base}/${assignmentId}/other`);
  assert.equal(other.querySelector(".academic-workspace, .skeleton-course-tabs, h1"), null, "neutral fallback only");
  assert.equal(other.querySelector('[role="status"]')?.textContent, "Cargando contenido…");
});

test("list and detail hand over to the real view without leftover placeholders", async () => {
  for (const [kind, , view] of pages) {
    const gate = deferred<void>();
    const ui = await mount(view, async r => { await gate.promise; return reply(r); }, "teacher");
    try {
      assert.ok(ui.doc.querySelector(".skeleton-region"), kind);
      await ui.settle(() => gate.resolve());
      assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null, kind);
      assert.equal(ui.doc.querySelector('nav[aria-label="Curso"] [aria-current="page"]')?.textContent, "Tareas");
      if (kind === "list") {
        assert.deepEqual(headings(ui.doc), ["Tareas"]);
        assert.match(ui.doc.body.textContent!, /Aún no hay tareas/);
      } else {
        assert.deepEqual(headings(ui.doc), [task.title]);
        assert.equal([...ui.doc.querySelectorAll("a")].filter(a => a.textContent!.trim() === "Volver a Tareas").length, 1);
      }
    } finally { await ui.close(); }
  }
});

test("submission panels keep their real heading and announce one status without controls", async () => {
  for (const [kind, view, heading, label] of panels) {
    const ui = await mount(view, never, kind === "student" ? "student" : "teacher");
    try {
      const panel = ui.doc.querySelector("section")!;
      assert.equal(ui.doc.getElementById(panel.getAttribute("aria-labelledby")!)?.textContent, heading, kind);
      assert.equal(ui.doc.getElementById(panel.getAttribute("aria-labelledby")!)!.closest('[aria-hidden="true"]'), null);
      assert.deepEqual([...ui.doc.querySelectorAll('[role="status"]')].map(e => e.textContent), [label], kind);
      assert.ok(panel.querySelector(".skeleton-region .skeleton"), kind);
      assert.equal(panel.querySelector("a, button, input, select, textarea, label, [tabindex], dialog"), null, `${kind}: no fake controls`);
      assert.doesNotMatch(ui.doc.body.textContent!, /Cargando contenido|Espera un momento/);
    } finally { await ui.close(); }
  }
});

test("submission panels hand over to their real content", async () => {
  for (const [kind, view] of panels) {
    const gate = deferred<void>();
    const ui = await mount(view, async r => {
      await gate.promise;
      return r.url.includes("/submission-review") ? Response.json({attempts:[],grade:null}) : reply(r);
    }, kind === "student" ? "student" : "teacher");
    try {
      await ui.settle(() => gate.resolve());
      assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null, kind);
      assert.match(ui.doc.body.textContent!, {
        teacher: /No hay estudiantes ni entregas/, student: /0 intentos utilizados/, review: /todavía no tiene intentos/,
      }[kind]!, kind);
    } finally { await ui.close(); }
  }
});

test("403, 404 and 500 keep their error states without placeholders", async () => {
  const views: [string, ReactElement][] = [...pages.map(([kind, , view]) => [kind, view] as [string, ReactElement]), ...panels.map(([kind, view]) => [kind, view] as [string, ReactElement])];
  for (const [kind, view] of views) {
    for (const [status, text] of [[403, /Permisos insuficientes/], [404, /no disponible/], [500, /No se pudo completar/]] as const) {
      const ui = await mount(view, () => Response.json({ status }, { status }), "teacher");
      try {
        assert.match(ui.doc.body.textContent!, text, `${kind} ${status}`);
        assert.equal(ui.doc.querySelector(".skeleton, .skeleton-region"), null, `${kind} ${status}`);
      } finally { await ui.close(); }
    }
  }
});

test("placeholders are identical for students, assistants, teachers and owners", async () => {
  for (const [kind, , view] of pages) {
    const shapes = new Set<string>();
    for (const profile of ["student", "assistant", "teacher", "owner"]) {
      const ui = await mount(view, never, profile);
      try { shapes.add(shape(ui.doc)); } finally { await ui.close(); }
    }
    assert.equal(shapes.size, 1, kind);
  }
});
