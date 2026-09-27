import assert from "node:assert/strict";
import { test } from "node:test";
import healthControllerModule from "../dist/platform/health/health.controller.js";
import helloControllerModule from "../dist/platform/hello/hello.controller.js";

const { HealthController } = healthControllerModule;
const { HelloController } = helloControllerModule;

test("GET / response contains the AcademiX API greeting", () => {
  const controller = new HelloController();

  assert.deepEqual(controller.getHello(), {
    message: "Hello World from AcademiX API!",
  });
});

test("GET /health response reports a healthy API", () => {
  const controller = new HealthController();

  assert.deepEqual(controller.getHealth(), {
    status: "ok",
    message: "Hello World from AcademiX API!",
  });
});
