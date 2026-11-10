import assert from "node:assert/strict";
import { test } from "node:test";
import { availabilityText, publicationIssues, quizPhase, sortQuizzes } from "../src/lib/quizzes/publication.ts";
import { draft, emptyDraft, published } from "./fixtures/quizzes.ts";

const now = Date.parse("2026-11-10T12:00:00Z");
const at = (offsetHours: number) => new Date(now + offsetHours * 3_600_000).toISOString();

test("lifecycle distinguishes draft, scheduled, open and closed quizzes", () => {
  assert.equal(quizPhase(draft, now), "draft");
  assert.equal(quizPhase({ ...draft, closesAt: at(-1) }, now), "draft");
  assert.equal(quizPhase(published, now), "open");
  assert.equal(quizPhase({ ...published, opensAt: at(2) }, now), "scheduled");
  assert.equal(quizPhase({ ...published, opensAt: at(-2), closesAt: at(-1) }, now), "closed");
  assert.equal(quizPhase({ ...published, closesAt: at(0) }, now), "closed");
});

test("order follows the next relevant date and then the title", () => {
  const items = [
    { ...published, id: "c", title: "C", closesAt: null },
    { ...published, id: "b", title: "B", closesAt: at(5) },
    { ...published, id: "a", title: "A", closesAt: at(1) },
    { ...published, id: "old", title: "Old", opensAt: at(-9), closesAt: at(-8) },
    { ...published, id: "recent", title: "Recent", opensAt: at(-9), closesAt: at(-1) },
  ];
  assert.deepEqual(sortQuizzes(items, now).map(q => q.id), ["recent", "old", "a", "b", "c"]);
});

test("publication issues mirror the API requirements only", () => {
  assert.deepEqual(publicationIssues(draft), []);
  assert.deepEqual(publicationIssues(emptyDraft), ["Agrega al menos una pregunta."]);
  const noCorrect = { ...draft, questions: [{ ...draft.questions[0], alternatives: draft.questions[0].alternatives.map(a => ({ ...a, isCorrect: false })) }] };
  assert.match(publicationIssues(noCorrect)[0], /^Pregunta 1: Selecciona una respuesta correcta/);
});

test("availability is described without technical detail", () => {
  const format = (value: string) => value.slice(0, 10);
  assert.equal(availabilityText(null, null, format), "Desde que se publique, sin fecha de cierre");
  assert.equal(availabilityText(at(24), null, format), "Desde el 2026-11-11, sin fecha de cierre");
  assert.equal(availabilityText(null, at(48), format), "Desde que se publique hasta el 2026-11-12");
  assert.equal(availabilityText(at(24), at(48), format), "Del 2026-11-11 al 2026-11-12");
});
