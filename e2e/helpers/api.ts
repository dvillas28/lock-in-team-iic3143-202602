import assert from 'node:assert/strict';
import {apiBase} from '../runner/settings.ts';

export class Api {
  constructor(public token?: string, public slug = 'uc') {}
  async request(path: string, method = 'GET', body?: unknown, extra: Record<string,string> = {}) {
    assert.ok(path.startsWith('/') && !path.startsWith('//') && !path.includes('://'), 'API accepts local relative paths only');
    const headers: Record<string,string> = {Accept: 'application/json, application/problem+json', ...extra};
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (body !== undefined && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const response = await fetch(apiBase+path, {method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(20_000)});
    const text = await response.text();
    let value: any;
    try {value = text ? JSON.parse(text) : undefined;} catch {value = undefined;}
    return {status: response.status, body: value, headers: response.headers};
  }
  path(suffix: string) {return `/api/v1/institution/${this.slug}/${suffix}`;}
  get(suffix: string) {return this.request(this.path(suffix));}
  post(suffix: string, body?: unknown, key?: string) {return this.request(this.path(suffix), 'POST', body, key ? {'Idempotency-Key': key} : {});}
  patch(suffix: string, body: unknown) {return this.request(this.path(suffix), 'PATCH', body);}
  put(suffix: string, body: unknown) {return this.request(this.path(suffix), 'PUT', body);}
}
export function status<T extends {status: number}>(response: T, expected: number): T {
  // Do not print response bodies or token-bearing login payloads in assertion failures.
  assert.equal(response.status, expected, `HTTP status ${response.status}; expected ${expected}`);
  return response;
}
