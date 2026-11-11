import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionError from "../src/app/institutions/[institutionSlug]/error.tsx";
import InstitutionNotFound from "../src/app/institutions/[institutionSlug]/not-found.tsx";
import { CourseDirectory } from "../src/components/courses/course-directory.tsx";
import { CourseDetail } from "../src/components/courses/course-detail.tsx";
import { EmptyState, ErrorState } from "../src/components/route-states.tsx";
import { ApiHttpError } from "../src/lib/api/errors.ts";
import { getRouteFeedback } from "../src/lib/route-feedback.ts";
import { mount } from "./fixtures/course-ui.ts";
import { course, deferred } from "./fixtures/courses.ts";

/** Every state title must be the target of its section's aria-labelledby. */
function labelled(root: Document, level: number) {
  const panel = root.querySelector<HTMLElement>(".empty-zone")!;
  const heading = root.getElementById(panel.getAttribute("aria-labelledby")!);
  assert.ok(heading && panel.contains(heading), "aria-labelledby targets the panel title");
  assert.equal(heading?.tagName, `H${level}`);
  return { panel, heading: heading! };
}

test("a route-level error keeps a single h1 labelling the alert", () => {
  const html = renderToStaticMarkup(h(InstitutionError, { error: new Error("PRIVATE"), reset: () => {} }));
  assert.equal(html.match(/<h1/g)?.length, 1);
  const id = /aria-labelledby="([^"]+)"/.exec(html)![1];
  assert.match(html, new RegExp(`<h1 id="${id}"`));
  assert.match(html, /role="alert"/);
  assert.match(html, /Reintentar/);
});

test("nested states take the requested level without restyling or losing actions", () => {
  const feedback = getRouteFeedback(new ApiHttpError(500));
  const nested = renderToStaticMarkup(h(ErrorState, { feedback, onRetry: () => {}, headingLevel: 3 }));
  assert.doesNotMatch(nested, /<h1|<h2/);
  assert.match(nested, /<h3 id="[^"]+" class="serif state-title">No se pudo completar la solicitud<\/h3>/);
  assert.match(nested, /role="alert"/);
  assert.match(nested, /Reintentar/);
  assert.match(nested, /href="\/"/);
  const notFound = renderToStaticMarkup(h(InstitutionNotFound));
  assert.match(notFound, /<h1[^>]*>Recurso no disponible<\/h1>/);
  assert.match(notFound, /href="\/"[^>]*>Volver al inicio/);
});

test("the empty state stays compatible and only renders the action it receives", () => {
  const generic = renderToStaticMarkup(h(EmptyState));
  assert.match(generic, /<h2[^>]*>Sin contenido para mostrar<\/h2>/);
  assert.doesNotMatch(generic, /role="alert"|<button|<a |state-actions/);
  const contextual = renderToStaticMarkup(h(EmptyState, { title: "No hay secciones", message: "Este curso aún no tiene secciones.", headingLevel: 3,
    action: h("a", { href: "/courses", className: "btn btn-primary" }, "Ir a cursos") }));
  assert.match(contextual, /<h3[^>]*>No hay secciones<\/h3><p class="hint">Este curso aún no tiene secciones.<\/p>/);
  assert.match(contextual, /class="state-actions"><a href="\/courses"/);
});

for (const slug of ["uc", "utfsm"]) {
  test(`${slug}: «Mis cursos» separates loading, contextual empty and nested errors`, async () => {
    const pending = deferred<Response>();
    const ui = await mount(h(CourseDirectory), () => pending.promise, "student", slug);
    try {
      assert.equal(ui.doc.querySelector(".empty-zone"), null, "loading is never an empty state");
      assert.doesNotMatch(ui.doc.body.textContent!, /Todavía no tienes cursos/);
      await ui.settle(() => pending.resolve(Response.json({ items: [] })));
      assert.equal(ui.doc.querySelectorAll("h1").length, 1);
      const { panel, heading } = labelled(ui.doc, 2);
      assert.equal(heading.textContent, "Todavía no tienes cursos");
      assert.equal(panel.getAttribute("role"), null);
      assert.equal(panel.querySelector('[role="alert"], button, a'), null, "no action for a role that cannot create");
      assert.doesNotMatch(ui.doc.body.textContent!, /Crear curso/);
    } finally { await ui.close(); }

    const admin = await mount(h(CourseDirectory), () => Response.json({ items: [] }), "owner", slug);
    try {
      assert.match(labelled(admin.doc, 2).heading.textContent!, /Aún no hay cursos/);
      assert.ok(admin.doc.querySelector("details summary")?.textContent === "Crear curso", "the hint points to a real control");
    } finally { await admin.close(); }
  });
}

test("a nested 500 under «Mis cursos» keeps one h1 and a working retry", async () => {
  let fail = true;
  const ui = await mount(h(CourseDirectory), r => r.url.endsWith("/courses") && fail ? Response.json({}, { status: 500 }) : Response.json({ items: [course] }), "student");
  try {
    assert.equal(ui.doc.querySelectorAll("h1").length, 1);
    assert.equal(ui.doc.querySelector("h1")?.textContent, "Mis cursos");
    const { panel } = labelled(ui.doc, 2);
    assert.ok(panel.querySelector('[role="alert"]'));
    fail = false;
    await ui.click("Reintentar");
    assert.equal(ui.doc.querySelector(".empty-zone"), null);
    assert.match(ui.doc.body.textContent!, /Desarrollo de software/);
  } finally { await ui.close(); }
});

test("a nested 403 or 404 reveals nothing and keeps the return link", async () => {
  for (const [status, title] of [[403, "Permisos insuficientes"], [404, "Recurso no disponible"]] as const) {
    const ui = await mount(h(CourseDirectory), r => r.url.endsWith("/courses") ? Response.json({ title: "PRIVATE_TITLE", detail: "PRIVATE_DETAIL" }, { status }) : Response.json({}), "student");
    try {
      assert.equal(ui.doc.querySelectorAll("h1").length, 1);
      assert.equal(labelled(ui.doc, 2).heading.textContent, title);
      assert.doesNotMatch(ui.doc.body.textContent!, /PRIVATE_|Reintentar/);
      assert.equal(ui.doc.querySelector('.empty-zone a[href="/"]')?.textContent, "Volver al inicio");
    } finally { await ui.close(); }
  }
});

test("empty sections never offer creation to roles that cannot configure", async () => {
  for (const [profile, title, create] of [["student", "No tienes secciones asignadas", false], ["owner", "No hay secciones para gestionar", true]] as const) {
    const ui = await mount(h(CourseDetail, { courseId: course.id }), r => r.url.endsWith("/sections") ? Response.json({ items: [] }) : Response.json(course), profile);
    try {
      assert.equal(ui.doc.querySelectorAll("h1").length, 1);
      assert.equal(labelled(ui.doc, 3).heading.textContent, title);
      assert.equal(ui.doc.body.textContent!.includes("Crear sección"), create);
    } finally { await ui.close(); }
  }
});
