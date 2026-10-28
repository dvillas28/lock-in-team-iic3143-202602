import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import InstitutionLayout from "../src/app/institutions/[institutionSlug]/layout.tsx";
import InstitutionHome from "../src/app/courses/page.tsx";
import Loading from "../src/app/institutions/[institutionSlug]/loading.tsx";
import InstitutionError from "../src/app/institutions/[institutionSlug]/error.tsx";
import NotFound from "../src/app/not-found.tsx";
import InstitutionNotFound from "../src/app/institutions/[institutionSlug]/not-found.tsx";
import { InstitutionShell } from "../src/components/institutions/institution-shell.tsx";
import { EmptyState, ErrorState } from "../src/components/route-states.tsx";
import { ApiHttpError, ApiNetworkError, ApiResponseError } from "../src/lib/api/errors.ts";
import { institutionHomePath, isInstitutionSlug } from "../src/lib/institution-routes.ts";
import { getRouteFeedback } from "../src/lib/route-feedback.ts";

test("institution links accept contract slugs without an institution allowlist", () => {
  for (const slug of ["uc", "utfsm", "campus-2", "another-institution", "uc--other", "a".repeat(63)]) {
    assert.equal(isInstitutionSlug(slug), true);
    assert.equal(institutionHomePath(slug), "/courses");
  }
});

test("invalid slugs cannot become links, paths or URL injections", () => {
  for (const slug of ["", "UC", "uc_utfsm", "-uc", "uc-", "a".repeat(64), "uc/utfsm", "..", "uc?role=teacher", "uc#other", "uc%2Futfsm", "uc\n", "ü"]) {
    assert.equal(isInstitutionSlug(slug), false, slug);
    assert.throws(() => institutionHomePath(slug), TypeError);
  }
});

test("layout awaits params and routes malformed slugs to Next's not-found boundary", async () => {
  const layout = await InstitutionLayout({ params: Promise.resolve({ institutionSlug: "uc" }), children: "content" });
  assert.equal(layout.props.slug, "uc");
  assert.equal(layout.props.children, "content");
  await assert.rejects(
    InstitutionLayout({ params: Promise.resolve({ institutionSlug: "UC" }), children: "private" }),
    (error: unknown) => error instanceof Error && "digest" in error && error.digest === "NEXT_HTTP_ERROR_FALLBACK;404",
  );
});

test("each institution renders only its own navigation and no invented identity or roles", () => {
  for (const [slug, other] of [["uc", "utfsm"], ["utfsm", "uc"]]) {
    const html = renderToStaticMarkup(createElement(InstitutionShell, { institutionSlug: slug }, "Public structure"));
    assert.match(html, /href="\/courses"/);
    assert.doesNotMatch(html, new RegExp(`/institutions/${other}`));
    assert.match(html, new RegExp(`<strong>${slug}</strong>`));
    assert.match(html, /aria-current="page"/);
    assert.match(html, /href="#main-content"/);
    assert.match(html, /id="main-content"[^>]*tabindex="-1"/);
    assert.match(html, /aria-label="Navegación institucional"/);
    assert.doesNotMatch(html, /teacher|student|assistant|admin|@|tenant-dot/);
  }
});

test("home delegates private content to the course directory", () => {
  assert.equal(InstitutionHome().type.name,"CourseDirectory");
  assert.match(renderToStaticMarkup(createElement(EmptyState)), /aria-labelledby=/);
});

test("loading announces progress and marks the content as busy", () => {
  const html = renderToStaticMarkup(createElement(Loading));
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /role="status"/);
  assert.match(html, /Cargando contenido/);
});

for (const [status, title, retryable] of [
  [401, "Sesión requerida", false], [403, "Permisos insuficientes", false],
  [404, "Recurso no disponible", false], [400, "No se pudo completar la solicitud", false],
  [500, "No se pudo completar la solicitud", true], [503, "No se pudo completar la solicitud", true],
] as const) {
  test(`HTTP ${status} presents safe feedback with the appropriate recovery action`, () => {
    const error = new ApiHttpError(status, { title: "PRIVATE_TITLE", detail: "PRIVATE_DETAIL", traceId: "PRIVATE_TRACE" });
    const feedback = getRouteFeedback(error);
    assert.equal(feedback.title, title);
    assert.equal(feedback.retryable, retryable);
    const html = renderToStaticMarkup(createElement(ErrorState, { feedback, onRetry: () => {} }));
    assert.match(html, /role="alert"/);
    assert.match(html, /href="\/"/);
    assert.equal(html.includes("Reintentar"), retryable);
    assert.doesNotMatch(html, /PRIVATE_|\/login/);
  });
}

test("network, malformed response and unexpected errors never expose internal details", () => {
  for (const error of [new ApiNetworkError(new Error("PRIVATE_CAUSE")), new ApiResponseError(), new Error("PRIVATE_STACK"), null, { message: "PRIVATE_PAYLOAD", status: 401 }]) {
    const feedback = getRouteFeedback(error);
    assert.equal(feedback.retryable, true);
    const html = renderToStaticMarkup(createElement(ErrorState, { feedback, onRetry: () => {} }));
    assert.match(html, /Reintentar/);
    assert.doesNotMatch(html, /PRIVATE_/);
  }
  const withoutRetry = renderToStaticMarkup(createElement(ErrorState, { feedback: getRouteFeedback(new Error()) }));
  assert.doesNotMatch(withoutRetry, /<button/);
});

test("the Next error boundary safely handles redacted production errors", () => {
  const html = renderToStaticMarkup(createElement(InstitutionError, {
    error: Object.assign(new Error("PRIVATE_SERVER_ERROR"), { digest: "PRIVATE_DIGEST" }),
    reset: () => {},
  }));
  assert.match(html, /Reintentar/);
  assert.doesNotMatch(html, /PRIVATE_/);
});

test("not-found offers a working public destination without leaking a slug", () => {
  const html = renderToStaticMarkup(createElement(NotFound));
  assert.match(html, /<main/);
  assert.match(html, /Recurso no disponible/);
  assert.match(html, /href="\/"/);
  assert.match(renderToStaticMarkup(createElement(InstitutionNotFound)), /Recurso no disponible/);
});

test("course breadcrumbs reflect the real detail or section path without demo profiles",()=>{
 for(const suffix of ['abc','abc/sections']){
 const html=renderToStaticMarkup(createElement(InstitutionShell,{institutionSlug:'uc',pathname:'/courses/'+suffix}));
 assert.match(html,/aria-current="page"/);assert.match(html,suffix.endsWith('sections')?/Secciones/:/Resumen del curso/);assert.doesNotMatch(html,/profile=|role=teacher/);
 }
});

test('course breadcrumb labels cover every academic route',()=>{
 const c='/courses/10000000-0000-4000-8000-000000000010';
 for(const [suffix,label]of [['/grades','Mis notas'],['/gradebook','Libro de notas'],['/audit','Auditoría'],['/quizzes/q/attempts/a','Revisión de intento'],['/quizzes/q/attempts','Intentos'],['/quizzes/q/authoring','Autoría y pauta'],['/quizzes/q','Detalle del quiz'],['/quizzes','Quizzes'],['/modules/m/materials/x','Material'],['/modules','Módulos'],['/sections','Secciones'],['','Resumen del curso']]){
 const html=renderToStaticMarkup(createElement(InstitutionShell,{institutionSlug:'uc',pathname:c+suffix}));assert.ok(html.includes('aria-current="page">'+label+'</span>'),label);
 }
});
