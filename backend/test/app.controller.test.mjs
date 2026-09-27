import assert from 'node:assert/strict';
import { test } from 'node:test';
import appControllerModule from '../dist/app.controller.js';

const { AppController } = appControllerModule;

test('GET / response contains the AcademiX API greeting', () => {
  const controller = new AppController();

  assert.deepEqual(controller.getHello(), {
    message: 'Hello World from AcademiX API!',
  });
});
