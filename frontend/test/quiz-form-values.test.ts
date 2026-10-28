import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { configuration, formNumber, formValue, localDate } from "../src/lib/quizzes/form-values.ts";
import { draft } from "./fixtures/quizzes.ts";
import { FieldError } from "../src/lib/courses/validation.ts";

test("numeric form values reject scientific notation, coercions, fractions and bounds", () => {
  for (const value of ["", " ", "0", "-1", "+1", "1e2", "0x10", "Infinity", "NaN", "1,5", ".5", "1.", "0.001", "1000000"])
    assert.throws(() => formNumber(value, "points"), FieldError, value);
  for (const value of ["1.0", "1.5", "1e2", "2147483648", "999999999999999999999"])
    assert.throws(() => formNumber(value, "maxAttempts", true), FieldError, value);
  assert.equal(formNumber("0.01", "points"), 0.01);
  assert.equal(formNumber("999999.99", "points"), 999999.99);
  assert.equal(formNumber("2147483647", "maxAttempts", true), 2147483647);
});

test("configuration rejects impossible dates, timezone suffixes and incomplete local times", () => {
  const form = new FormData();
  for (const value of ["2026-02-30T12:00", "2026-02-29T12:00", "2026-13-01T12:00", "2026-10-22T24:00", "2026-10-22", "2026-10-22T12:00Z", "2026-10-22T12:00-03:00", "0000-01-01T00:00", "2026-10-22T12:00:61"]) {
    form.set("opensAt", value);
    assert.throws(() => configuration(form), (error: unknown) => error instanceof FieldError && error.field === "opensAt", value);
  }
  form.set("opensAt", "2028-02-29T12:00:30");
  assert.ok(configuration(form).opensAt?.endsWith("Z"));
  form.set("opensAt", "");
  assert.equal(configuration(form).opensAt, null);
  assert.equal(configuration(form).maxAttempts, null);
});

test("nonexistent DST local time cannot silently normalize to another hour", () => {
  const source = `import { configuration } from './src/lib/quizzes/form-values.ts';
    const form=new FormData();form.set('opensAt','2026-03-08T02:30');
    try { configuration(form); process.exit(1); } catch(error) { if(error.field!=='opensAt') throw error; }`;
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", source], { env: { ...process.env, TZ: "America/New_York" }, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("duplicate values and file uploads cannot be coerced into quiz fields", () => {
  const form = new FormData();
  form.append("title", "Primero");form.append("title", "Segundo");
  assert.throws(() => configuration(form), FieldError);
  form.delete("title");form.set("title", new Blob(["archivo"]), "quiz.txt");
  assert.throws(() => formValue(form, "title"), FieldError);
});

test("native minute normalization preserves unchanged timezone and microseconds", () => {
  const original = { ...draft, opensAt: "2026-10-28T12:00:00.123456Z", closesAt: "2026-10-29T09:00:00.654321-03:00" };
  const form = new FormData();
  for (const field of ["opensAt", "closesAt"] as const) form.set(field, localDate(original[field]).slice(0, 16));
  const parsed = configuration(form, original);
  assert.equal(parsed.opensAt, original.opensAt);
  assert.equal(parsed.closesAt, original.closesAt);
  form.set("opensAt", localDate(original.opensAt).slice(0, 16) + ":01");
  assert.notEqual(configuration(form, original).opensAt, original.opensAt);
});
