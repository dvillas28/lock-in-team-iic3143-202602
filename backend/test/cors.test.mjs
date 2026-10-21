import assert from "node:assert/strict";
import { test } from "node:test";
import { corsOptions } from "../dist/http/cors.js";
import { OperationError } from "../dist/database/config.js";

test("CORS defaults are local in development; production requires both HTTPS institutions", () => {
  assert.deepEqual(corsOptions({}).origin, ["http://localhost:3000"]);
  const origins = ["https://uc.academix.dvillasc.me", "https://utfsm.academix.dvillasc.me"];
  for (const values of [undefined, [], [origins[0]], [origins[1]], [...origins, "http://localhost:3000"]]) {
    assert.throws(() => corsOptions({NODE_ENV:"production", CORS_ALLOWED_ORIGINS:JSON.stringify(values)}), OperationError);
  }
  assert.deepEqual(corsOptions({NODE_ENV:"production", CORS_ALLOWED_ORIGINS:JSON.stringify(origins)}).origin, origins);
  assert.equal(corsOptions({NODE_ENV:"production", CORS_ALLOWED_ORIGINS:JSON.stringify([...origins, "https://other.example"])}).origin.length, 3);
});
test("CORS allows only exact configured origins, no credentials, exposes retry metadata", () => {
  const options = corsOptions({CORS_ALLOWED_ORIGINS:'["https://uc.academix.dvillasc.me","https://utfsm.academix.dvillasc.me"]'});
  assert.equal(options.origin.length, 2);
  assert.equal(options.credentials, false);
  assert.deepEqual(options.exposedHeaders,["Location","Retry-After"]);
  assert.deepEqual(options.allowedHeaders,["Authorization","Content-Type","Idempotency-Key","Accept"]);
  assert.equal(options.optionsSuccessStatus,204);
});
test("invalid CORS config fails closed without exposing its contents", () => {
  for (const value of ['invalid', '{}', '[1]', '[null]', '["*"]', '["null"]', '["https://x/path"]', '["https://u:p@x"]', '["https://x/"]', '["https://x?secret=x"]', '["file://x"]']) {
    assert.throws(()=>corsOptions({CORS_ALLOWED_ORIGINS:value}), error => error instanceof OperationError && error.message === "config");
  }
});
