import assert from "node:assert/strict";
import { test } from "node:test";
import { testUrl } from "./helpers.mjs";

test("test guard refuses absent, malformed and non-test destinations before connecting", () => {
  for (const TEST_DATABASE_URL of [undefined, "bad", "postgres://localhost/academix", "postgres://localhost/foo_test?options=-csearch_path=other", "http://localhost/a_test", "postgres://localhost/a_test?host=other", "postgres://localhost/a_test?database=production"]) {
    assert.throws(() => testUrl({ TEST_DATABASE_URL, DATABASE_URL: "postgres://localhost/production" }));
  }
  assert.ok(testUrl({ TEST_DATABASE_URL: "postgres://localhost/isolated_test" }));
});
