import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h, useState } from "react";
import { ModulesPanel } from "../src/components/content/modules-panel.tsx";
import { CourseGradebook } from "../src/components/gradebook/course-gradebook.tsx";
import { AttemptDetail } from "../src/components/attempts/attempt-detail.tsx";
import { QuestionEditor, questionRows } from "../src/components/quizzes/question-editor.tsx";
import { SUCCESS_FEEDBACK_MS } from "../src/components/use-feedback.ts";
import { mount } from "./fixtures/course-ui.ts";
import { unit, material, course, timestamp, id } from "./fixtures/content.ts";
import * as grades from "./fixtures/gradebook.ts";
import * as attempts from "./fixtures/attempts.ts";

test("module, material and publication confirmations expire without losing drafts, focus or domain state", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let parent = { ...unit }, child = { ...material };
  const ui = await mount(h(ModulesPanel, { courseId: course.id }), async r => {
    if (r.method === "PATCH") { parent = { ...parent, ...await r.json() }; return Response.json(parent); }
    if (r.method === "POST") {
      if (r.url.endsWith("/publish")) { child = { ...child, publishedAt: timestamp }; return Response.json(child); }
      return Response.json({ ...material, id: id(51), ...await r.json() }, { status: 201 });
    }
    return Response.json(r.url.endsWith("/materials") ? { items: [child] } : r.url.endsWith("/modules") ? { items: [parent] } : course);
  }, "teacher");
  try {
    await ui.click("Unidad 1");
    await ui.submit('form[aria-label="Editar módulo Unidad 1"]', { title: "Unidad revisada" });
    await ui.submit('form[aria-label="Crear material"]', { title: "Apuntes", markdownBody: "Contenido" });
    const button = ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Publicar material Lectura"]')!;
    button.focus(); await ui.settle(() => button.click());
    const draft = ui.doc.querySelector<HTMLTextAreaElement>('form[aria-label="Crear material"] textarea')!;
    draft.value = "Siguiente borrador";
    assert.match(ui.doc.body.textContent!, /Módulo actualizado/);
    assert.match(ui.doc.body.textContent!, /Material creado/);
    assert.match(ui.doc.body.textContent!, /Material publicado/);
    await ui.settle(() => t.mock.timers.tick(SUCCESS_FEEDBACK_MS));
    assert.doesNotMatch(ui.doc.body.textContent!, /Módulo actualizado|Material creado|Material publicado/);
    assert.equal(draft.value, "Siguiente borrador");
    assert.equal(ui.doc.activeElement, button);
    assert.equal(button.getAttribute("aria-pressed"), "true");
    assert.equal(ui.requests.filter(r => ["PATCH", "POST"].includes(r.method) && !r.url.endsWith("/login")).length, 3);
  } finally { await ui.close(); }
});

test("each repeated confirmation gets five seconds; an older timer cannot hide a new result", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let parent = { ...unit };
  const ui = await mount(h(ModulesPanel, { courseId: course.id }), r => {
    if (r.method === "POST") { parent = { ...parent, publishedAt: r.url.endsWith("/unpublish") ? null : timestamp }; return Response.json(parent); }
    return Response.json(r.url.endsWith("/modules") ? { items: [parent] } : course);
  }, "teacher");
  try {
    const click = () => ui.settle(() => ui.doc.querySelector<HTMLButtonElement>('.publish-toggle, .publication-control button')!.click());
    await click(); await ui.settle(() => t.mock.timers.tick(3000));
    await click(); await ui.settle(() => t.mock.timers.tick(3000));
    await click(); await ui.settle(() => t.mock.timers.tick(3000));
    assert.match(ui.doc.body.textContent!, /Módulo publicado/);
    await ui.settle(() => t.mock.timers.tick(2000));
    assert.doesNotMatch(ui.doc.body.textContent!, /Módulo publicado|Módulo ocultado/);
  } finally { await ui.close(); }
});

test("validation, uncertain writes and failed refresh warnings remain visible beyond success timeout", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  for (const mode of ["rejected", "uncertain", "refresh"]) {
    let posted = false;
    const ui = await mount(h(ModulesPanel, { courseId: course.id }), r => {
      if (r.method === "POST") { posted = true; if (mode === "uncertain") throw new Error("lost response"); return Response.json({ ...unit, publishedAt: timestamp }, { status: mode === "rejected" ? 422 : 200 }); }
      if (posted && mode === "refresh" && r.url.endsWith("/modules")) return Response.json({}, { status: 503 });
      return Response.json(r.url.endsWith("/modules") ? { items: [unit] } : r.url.endsWith(unit.id) ? unit : course);
    }, "teacher");
    try {
      await ui.settle(() => ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Publicar módulo Unidad 1"]')!.click());
      await ui.settle(() => t.mock.timers.tick(SUCCESS_FEEDBACK_MS * 2));
      assert.match(ui.doc.body.textContent!, mode === "uncertain" ? /Resultado incierto/ : mode === "refresh" ? /No se pudo actualizar/ : /Revisa los campos/);
      assert.equal(ui.requests.filter(r => r.method === "POST" && !r.url.endsWith("/login")).length, 1);
    } finally { await ui.close(); }
  }
});

test("a previous success timer cannot dismiss a later rejected operation", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let posts = 0, parent = { ...unit };
  const ui = await mount(h(ModulesPanel, { courseId: course.id }), r => {
    if (r.method === "POST") {
      if (++posts === 2) return Response.json({}, { status: 422 });
      parent = { ...parent, publishedAt: timestamp }; return Response.json(parent);
    }
    return Response.json(r.url.endsWith("/modules") ? { items: [parent] } : course);
  }, "teacher");
  try {
    await ui.settle(() => ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Publicar módulo Unidad 1"]')!.click());
    await ui.settle(() => t.mock.timers.tick(3000));
    await ui.settle(() => ui.doc.querySelector<HTMLButtonElement>('button[aria-label="Ocultar módulo Unidad 1"]')!.click());
    await ui.settle(() => t.mock.timers.tick(SUCCESS_FEEDBACK_MS * 2));
    assert.match(ui.doc.body.textContent!, /Revisa los campos/);
    assert.equal(posts, 2);
  } finally { await ui.close(); }
});

test("grade publication feedback expires while the confirmed receipt remains available without another POST", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const ui = await mount(h(CourseGradebook, { courseId: grades.course.id }), r => r.method === "POST" ? Response.json(grades.receipt) : grades.reply(r), "ownerTeacher");
  try {
    await ui.click("Publicar notas");
    for (const value of [grades.item.id, grades.row.sectionId, grades.row.student.id]) await ui.settle(() => ui.doc.querySelector<HTMLInputElement>(`input[value="${value}"]`)!.click());
    await ui.click("Revisar publicación"); await ui.click("Confirmar publicación");
    assert.match(ui.doc.body.textContent!, /Notas publicadas correctamente/);
    await ui.settle(() => t.mock.timers.tick(SUCCESS_FEEDBACK_MS));
    assert.doesNotMatch(ui.doc.body.textContent!, /Notas publicadas correctamente/);
    const details = Array.from(ui.doc.querySelectorAll("details")).find(d => d.querySelector("summary")?.textContent === "Comprobante de última publicación")!;
    assert.ok(details); assert.equal(details.open, false);
    assert.match(details.textContent!, /Recibo confirmado: 1 notas/);
    assert.equal(ui.requests.filter(r => r.method === "POST" && !r.url.endsWith("/login")).length, 1);
  } finally { await ui.close(); }
});

test("weights success expires, but invalid weights stay visible and editable", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const ui = await mount(h(CourseGradebook, { courseId: grades.course.id }), r => r.method === "PUT" ? Response.json(grades.items) : grades.reply(r), "ownerTeacher");
  try {
    await ui.click("Ponderaciones"); await ui.submit("form");
    assert.match(ui.doc.body.textContent!, /Ponderaciones guardadas/);
    await ui.settle(() => t.mock.timers.tick(SUCCESS_FEEDBACK_MS));
    assert.doesNotMatch(ui.doc.body.textContent!, /Ponderaciones guardadas/);
    await ui.submit("form", { [grades.item.id]: "99" });
    const error = ui.doc.querySelector('p[aria-live="polite"]')!.textContent;
    assert.ok(error);
    await ui.settle(() => t.mock.timers.tick(SUCCESS_FEEDBACK_MS * 2));
    assert.equal(ui.doc.querySelector('p[aria-live="polite"]')!.textContent, error);
    assert.equal(ui.doc.querySelector<HTMLInputElement>(`input[name="${grades.item.id}"]`)!.value, "99");
  } finally { await ui.close(); }
});

test("question editing notices renew for identical actions without moving focus when dismissed", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  function Editor() { const [rows, setRows] = useState(() => questionRows([])); return h(QuestionEditor, { rows, onRows: setRows }); }
  const ui = await mount(h(Editor), () => Response.json({}), "teacher");
  try {
    await ui.click("Agregar pregunta"); await ui.settle(() => t.mock.timers.tick(3000));
    await ui.click("Agregar pregunta"); await ui.settle(() => t.mock.timers.tick(3000));
    assert.match(ui.doc.body.textContent!, /Pregunta agregada/);
    const focus = ui.doc.activeElement;
    await ui.settle(() => t.mock.timers.tick(2000));
    assert.doesNotMatch(ui.doc.body.textContent!, /Pregunta agregada/);
    assert.equal(ui.doc.activeElement, focus);
    assert.equal(ui.doc.querySelectorAll("fieldset").length, 2);
  } finally { await ui.close(); }
});

test("answer-save confirmation expires while answers and unsaved-change warnings survive", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let saved = attempts.attempt;
  const ui = await mount(h(AttemptDetail, { attemptId: saved.id }), async r => {
    if (r.method === "PUT") { saved = { ...saved, answers: (await r.json()).answers }; return Response.json(saved); }
    return attempts.reply(r, saved);
  }, "student");
  try {
    await ui.settle(() => ui.doc.querySelector<HTMLInputElement>('input[value="a"]')!.click());
    await ui.submit(); assert.match(ui.doc.body.textContent!, /Respuestas guardadas y confirmadas/);
    await ui.settle(() => t.mock.timers.tick(SUCCESS_FEEDBACK_MS));
    assert.doesNotMatch(ui.doc.body.textContent!, /Respuestas guardadas y confirmadas/);
    assert.equal(ui.doc.querySelector<HTMLInputElement>('input[value="a"]')!.checked, true);
    await ui.click("Quitar todas las selecciones");
    await ui.settle(() => t.mock.timers.tick(SUCCESS_FEEDBACK_MS * 2));
    assert.match(ui.doc.body.textContent!, /Borrador con cambios sin guardar/);
    assert.equal(ui.requests.filter(r => r.method === "PUT").length, 1);
  } finally { await ui.close(); }
});
