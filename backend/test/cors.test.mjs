import assert from "node:assert/strict";
import { test } from "node:test";
import { corsOptions } from "../dist/http/cors.js";

test("CORS defaults are local in development and closed in production", () => {
  assert.deepEqual(corsOptions({}).origin, ["http://localhost:3000"]);
  assert.deepEqual(corsOptions({NODE_ENV:"production"}).origin, []);
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
    assert.throws(()=>corsOptions({CORS_ALLOWED_ORIGINS:value}), /^Error: Invalid CORS configuration$/);
  }
});
