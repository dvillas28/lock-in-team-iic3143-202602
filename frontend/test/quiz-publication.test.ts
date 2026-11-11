import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { QuizEditor } from "../src/components/quizzes/quiz-editor.tsx";
import { QuizCreate } from "../src/components/quizzes/quiz-create.tsx";
import { QuizList } from "../src/components/quizzes/quiz-list.tsx";
import { mount, reply, course, draft, emptyDraft, published, grade, deferred } from "./fixtures/quizzes.ts";

type UI = Awaited<ReturnType<typeof mount>>;
const view = () => h(QuizEditor, { courseId: course.id, quizId: draft.id });
const publishes = (ui: UI) => ui.requests.filter(r => r.url.endsWith("/publish")).length;
const dialog = (ui: UI) => ui.doc.querySelector("dialog[open]");
const confirm = (ui: UI) => ui.settle(() => ui.doc.querySelector<HTMLButtonElement>("dialog[open] .btn-primary")!.click());

test("editor confirmation is concise, cancellable and leaves the editor after publishing", async () => {
  let quiz = draft;
  const ui = await mount(view(), r => {
    if (r.url.endsWith("/publish")) { quiz = published; return Response.json(quiz); }
    return reply(r, quiz);
  }, "teacher");
  try {
    await ui.click("Publicar quiz");
    const text = dialog(ui)?.textContent ?? "";
    assert.match(text, /¿Publicar este quiz\?/);
    assert.match(text, /Quiz de aislamiento/);
    assert.match(text, /Sección 1/);
    assert.match(text, /Desde que se publique, sin fecha de cierre/);
    assert.match(text, /no podrás editarlo/);
    assert.doesNotMatch(text, /0 %|congel|pauta impide|inmutable/i);
    assert.equal(ui.doc.activeElement?.textContent, "Cancelar");
    await ui.click("Cancelar");
    assert.equal(dialog(ui), null);
    assert.equal(publishes(ui), 0);
    await ui.click("Publicar quiz");
    await confirm(ui);
    assert.equal(publishes(ui), 1);
    assert.equal(ui.destinations.at(-1), `/courses/${course.id}/quizzes/${draft.id}`);
    assert.doesNotMatch(ui.doc.body.textContent!, /Publicación confirmada\.|Resultado incierto/);
  } finally { await ui.close(); }
});

test("unsaved edits are saved once and then published", async () => {
  let quiz = draft;
  const ui = await mount(view(), async r => {
    if (r.method === "PATCH") { quiz = { ...quiz, ...await r.clone().json() }; return Response.json(quiz); }
    if (r.url.endsWith("/publish")) { quiz = { ...quiz, status: "published", publishedAt: published.publishedAt }; return Response.json(quiz); }
    return reply(r, quiz);
  }, "teacher");
  try {
    await ui.settle(() => {
      const title = ui.doc.querySelector<HTMLInputElement>('[name="title"]')!;
      title.value = "Título revisado";
      title.dispatchEvent(new ui.dom.window.Event("input", { bubbles: true }));
    });
    await ui.click("Publicar quiz");
    assert.match(dialog(ui)?.textContent ?? "", /Título revisado/);
    assert.match(dialog(ui)?.textContent ?? "", /Primero se guardarán tus cambios/);
    await confirm(ui);
    assert.equal(ui.requests.filter(r => r.method === "PATCH").length, 1);
    assert.equal(publishes(ui), 1);
    assert.equal(quiz.title, "Título revisado");
    assert.equal(ui.destinations.at(-1), `/courses/${course.id}/quizzes/${draft.id}`);
  } finally { await ui.close(); }
});

test("rejected, lost and unreadable publications stay in the dialog without duplicating", async () => {
  for (const mode of ["conflict", "lost", "unreadable"] as const) {
    let sent = 0;
    const ui = await mount(view(), r => {
      if (r.url.endsWith("/publish")) { sent++; return mode === "conflict" ? Response.json({}, { status: 409 }) : Promise.reject(new Error("lost")); }
      if (sent && r.url.endsWith("/authoring")) return mode === "unreadable" ? Response.json({}, { status: 503 }) : reply(r, published);
      return reply(r, draft);
    }, "teacher");
    try {
      await ui.click("Publicar quiz");
      await confirm(ui);
      if (mode === "lost") {
        assert.equal(ui.destinations.at(-1), `/courses/${course.id}/quizzes/${draft.id}`);
      } else {
        assert.ok(dialog(ui));
        assert.match(dialog(ui)!.textContent!, mode === "conflict" ? /cambió mientras lo publicabas/ : /No se pudo confirmar/);
        assert.equal(ui.destinations.length, 0);
        assert.equal(ui.doc.querySelector<HTMLFieldSetElement>("form fieldset")?.disabled, false);
        assert.equal(ui.doc.querySelector("dialog[open] .btn-primary")?.textContent, "Reintentar");
      }
      assert.equal(sent, 1);
      assert.equal(ui.requests.some(r => r.url.endsWith("/grade-items")), false);
    } finally { await ui.close(); }
  }
});

test("double confirmation sends a single publication", async () => {
  const pending = deferred<Response>();
  const ui = await mount(view(), r => r.url.endsWith("/publish") ? pending.promise : reply(r), "teacher");
  try {
    await ui.click("Publicar quiz");
    await confirm(ui);
    await confirm(ui);
    assert.match(dialog(ui)?.textContent ?? "", /Publicando…/);
    await ui.settle(() => pending.resolve(Response.json(published)));
    assert.equal(publishes(ui), 1);
  } finally { await ui.close(); }
});

test("published authoring keeps the grade item read and retries it alone", async () => {
  let fail = true;
  const ui = await mount(view(), r => r.url.endsWith("/grade-items")
    ? fail ? Response.json({}, { status: 503 }) : Response.json({ items: [{ ...grade, weightPercent: 17.5 }], totalWeightPercent: 17.5 })
    : reply(r, published), "teacher");
  try {
    assert.match(ui.doc.body.textContent!, /lectura.*pendiente/i);
    assert.equal(ui.doc.querySelector('button[value="publish"]'), null);
    fail = false;
    await ui.click("Reintentar lectura del ítem");
    assert.match(ui.doc.body.textContent!, /17.5/);
  } finally { await ui.close(); }
});

test("creation can publish directly and a failed publication never recreates the draft", async () => {
  for (const failFirst of [false, true]) {
    let attempts = 0;
    const ui = await mount(h(QuizCreate, { courseId: course.id }), async r => {
      if (r.method === "POST" && r.url.endsWith("/quizzes")) return Response.json({ ...draft, title: "Nuevo quiz" }, { status: 201 });
      if (r.url.endsWith("/publish")) return ++attempts === 1 && failFirst ? Response.json({}, { status: 422 }) : Response.json(published);
      return reply(r);
    }, "teacher");
    try {
      await ui.click("Agregar pregunta");
      await ui.submit("form", { title: "Nuevo quiz", "questions.0.prompt": "¿Sí?", "questions.0.alternatives.0.text": "Sí", "questions.0.alternatives.1.text": "No" });
      await ui.settle(() => ui.doc.querySelector<HTMLInputElement>('input[type="radio"]')!.click());
      await ui.click("Publicar quiz");
      assert.match(dialog(ui)?.textContent ?? "", /Nuevo quiz/);
      await confirm(ui);
      if (failFirst) {
        assert.match(dialog(ui)!.textContent!, /no cumple los requisitos/);
        assert.match(dialog(ui)!.textContent!, /El borrador quedó guardado/);
        await confirm(ui);
      }
      const creates = ui.requests.filter(r => r.method === "POST" && r.url.endsWith("/quizzes")).length;
      assert.equal(creates, 1);
      assert.equal(publishes(ui), failFirst ? 2 : 1);
      assert.equal(ui.destinations.at(-1), `/courses/${course.id}/quizzes`);
    } finally { await ui.close(); }
  }
});

test("list publishes valid drafts in place and sends incomplete ones to authoring", async () => {
  let quiz = draft, listFails = false;
  const ui = await mount(h(QuizList, { courseId: course.id }), r => {
    if (r.url.endsWith("/publish")) { quiz = published; listFails = true; return Response.json(published); }
    if (listFails && r.url.endsWith("/quizzes")) return Response.json({}, { status: 503 });
    return reply(r, quiz);
  }, "teacher");
  try {
    assert.match(ui.doc.body.textContent!, /Borradores/);
    await ui.click("Publicar");
    assert.equal(ui.requests.filter(r => r.url.endsWith("/authoring")).length, 1);
    await confirm(ui);
    assert.equal(publishes(ui), 1);
    assert.equal(dialog(ui), null);
    assert.equal(ui.doc.querySelector('button[aria-label^="Publicar"]'), null);
    assert.match(ui.doc.querySelector(".quiz-row")!.textContent!, /Disponible/);
    assert.match(ui.doc.querySelector(".content-notice")?.textContent ?? "", /Quiz publicado/);
    assert.match(ui.doc.body.textContent!, /No se pudo actualizar el listado/);
    assert.ok(Array.from(ui.doc.querySelectorAll("button")).some(b => b.textContent === "Reintentar"));
  } finally { await ui.close(); }

  const incomplete = await mount(h(QuizList, { courseId: course.id }), r => reply(r, emptyDraft), "teacher");
  try {
    await incomplete.click("Publicar");
    assert.match(dialog(incomplete)?.textContent ?? "", /Completa el borrador/);
    assert.match(dialog(incomplete)!.textContent!, /Agrega al menos una pregunta/);
    assert.match(dialog(incomplete)!.querySelector("a")?.getAttribute("href") ?? "", /\/authoring$/);
    assert.equal(publishes(incomplete), 0);
  } finally { await incomplete.close(); }
});

test("list publication is offered only to authors of the draft", async () => {
  for (const role of ["student", "assistant", "owner"]) {
    const ui = await mount(h(QuizList, { courseId: course.id }), r => reply(r), role);
    try {
      assert.equal(ui.doc.querySelector('button[aria-label^="Publicar"]'), null);
      assert.equal(ui.requests.some(r => r.url.endsWith("/authoring")), false);
    } finally { await ui.close(); }
  }
});
