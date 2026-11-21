import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const reviewer = read('./pr-reviewer.mjs');
const contract = read('../../docs/reference/openapi/openapi.yaml');

test('la guía institucional coincide con OpenAPI en los tres casos de calibración', () => {
  const prefix = reviewer.match(/el contrato usa (\/api\/v1\/[^ ]+)\/\.\.\./)?.[1];
  assert.ok(prefix, 'falta el prefijo institucional en la guía');
  for (const path of ['invitations', 'courses/{courseId}/gradebook', 'calendar']) {
    assert.ok(contract.includes('\n  ' + prefix + '/' + path + ':'), path);
  }
  assert.ok(reviewer.includes("Alerta si un endpoint o DTO recibe 'institution_id' en el body"));
});
