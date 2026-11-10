import assert from "node:assert/strict";
import { test } from "node:test";
import { attemptProgress, optionLabel, quizClosed } from "../src/lib/attempts/progress.ts";
import { quiz } from "./fixtures/attempts.ts";

test("option labels stay unique beyond 26 alternatives", () => {
  assert.deepEqual([0, 1, 25, 26, 27, 51, 52, 701, 702].map(optionLabel), ["A", "B", "Z", "AA", "AB", "AZ", "BA", "ZZ", "AAA"]);
  assert.equal(new Set(Array.from({ length: 800 }, (_, i) => optionLabel(i))).size, 800);
});

test("progress lists pending questions in order", () => {
  const question = quiz.questions[0];
  assert.deepEqual(attemptProgress(quiz, []), { total: 1, answered: 0, pending: [{ id: question.id, number: 1 }] });
  assert.deepEqual(attemptProgress(quiz, [{ questionId: question.id, alternativeId: question.alternatives[0].id }]).pending, []);
});

test("closing time is reached exactly at closesAt", () => {
  assert.equal(quizClosed(null, Date.now()), false);
  assert.equal(quizClosed("2026-11-10T12:00:00Z", Date.parse("2026-11-10T11:59:59Z")), false);
  assert.equal(quizClosed("2026-11-10T12:00:00Z", Date.parse("2026-11-10T12:00:00Z")), true);
});
