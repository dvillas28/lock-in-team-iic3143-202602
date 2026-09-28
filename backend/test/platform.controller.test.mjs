import assert from "node:assert/strict";
import { test } from "node:test";
import healthControllerModule from "../dist/platform/health/health.controller.js";

const { HealthController } = healthControllerModule;

test("GET /health response reports a healthy API", () => {
  const controller = new HealthController();
  const response = controller.getHealth();

  assert.equal(response.status, "ok");
  assert.equal(response.version, "0.1.0");
  assert.equal(new Date(response.timestamp).toISOString(), response.timestamp);
  assert.deepEqual(Object.keys(response).sort(), ["status", "timestamp", "version"]);
});
