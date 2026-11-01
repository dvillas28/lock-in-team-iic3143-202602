import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export const root = fileURLToPath(new URL('../../', import.meta.url));
export const work = resolve(root, 'e2e');
export const reportDirectory = (runId = process.env.E2E_RUN_ID) => {
  if (runId && !/^[a-f0-9]{16}$/.test(runId)) throw new Error('Invalid report ownership');
  return resolve(work,'reports',runId??'inspection');
};
function port(value: string | undefined, fallback: number) {
  const p = Number(value ?? fallback);
  if (!Number.isInteger(p) || p < 1024 || p > 65535) throw new Error('Invalid E2E port');
  return p;
}
export const webPort = port(process.env.E2E_WEB_PORT, 4320);
export const apiPort = port(process.env.E2E_API_PORT, 4321);
if (webPort === apiPort) throw new Error('E2E ports must be distinct');
export const apiBase = `http://127.0.0.1:${apiPort}`;
export const portal = `http://localhost:${webPort}`;
export const origin = (slug = 'uc') => `http://${slug}.localhost:${webPort}`;
export const buildEnv = {
  NEXT_PUBLIC_API_URL: apiBase,
  NEXT_PUBLIC_PORTAL_ORIGIN: portal,
  NEXT_PUBLIC_INSTITUTION_ORIGINS: JSON.stringify({[origin('uc')]: 'uc', [origin('utfsm')]: 'utfsm'}),
  NEXT_TELEMETRY_DISABLED: '1',
};
export function preflight(env: NodeJS.ProcessEnv = process.env) {
  // Never accept a user-supplied application or database URL. Runner constructs destinations.
  for (const key of ['E2E_BASE_URL', 'E2E_API_URL', 'E2E_DATABASE_URL', 'E2E_RUNTIME_DATABASE_URL']) {
    if (env[key]) throw new Error(`${key} is forbidden: use a fresh runner-owned local stack`);
  }
  if (env.E2E_RUN_ID && !/^[a-f0-9]{16}$/.test(env.E2E_RUN_ID)) throw new Error('Invalid E2E run ownership');
}
export function isolatedEnv(extra: NodeJS.ProcessEnv = {}) {
  const env = {...process.env};
  for (const key of Object.keys(env)) {
    if (/^(DATABASE_URL|MIGRATION_DATABASE_URL|TEST_.*DATABASE_URL|AUTH_JWT_SECRET|DEMO_|ONBOARD_|SUPERADMIN_|NEXT_PUBLIC_|API_URL|PGHOST|PGDATABASE|PGUSER|PGPASSWORD|PGPORT)/.test(key)) delete env[key];
  }
  return {...env, ...extra};
}
