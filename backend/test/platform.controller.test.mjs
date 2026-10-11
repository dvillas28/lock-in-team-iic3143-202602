import assert from "node:assert/strict";
import { test } from "node:test";
import healthControllerModule from "../dist/platform/health/health.controller.js";

const { HealthController } = healthControllerModule;

test("GET /health response reports a healthy API", () => {
  const controller = new HealthController();
  const response = controller.getHealth();

  assert.equal(response.status, "ok");
  assert.equal(response.version, "dev");
  assert.equal(response.commit, null);
  assert.equal(new Date(response.deployedAt).toISOString(), response.deployedAt);
  assert.equal(new Date(response.timestamp).toISOString(), response.timestamp);
  assert.deepEqual(Object.keys(response).sort(), [
    "commit",
    "deployedAt",
    "status",
    "timestamp",
    "version",
  ]);
});

test("GET /health reports the deployed commit and a stable deploy time", () => {
  process.env.RAILWAY_GIT_COMMIT_SHA = "a9bb898";

  try {
    const controller = new HealthController();
    const first = controller.getHealth();
    const second = controller.getHealth();

    assert.equal(first.commit, "a9bb898");
    assert.equal(first.deployedAt, second.deployedAt);
  } finally {
    delete process.env.RAILWAY_GIT_COMMIT_SHA;
  }
});
