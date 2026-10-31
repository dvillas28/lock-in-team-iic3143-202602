import {randomBytes} from 'node:crypto';
import {access, cp, mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {command, launch, stop, ready, safe} from './process.ts';
import {root, work, preflight, apiPort, webPort, buildEnv, reportDirectory} from './settings.ts';
import {startPostgres} from './postgres.ts';

preflight();
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && await access(resolve(work,'.cache/browsers')).then(()=>true,()=>false)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = resolve(work,'.cache/browsers');
}
const startedAt = Date.now();
const runId = randomBytes(8).toString('hex');
const commit = (await command('git',['rev-parse','HEAD'])).trim();
const dirtyAtStart = Boolean((await command('git',['status','--porcelain'])).trim());
const seedVersion = 'academix-e2e-v1';
const env = {
  E2E_RUN_ID: runId, E2E_COMMIT: commit, E2E_SEED_VERSION: seedVersion, E2E_PASSWORD: randomBytes(12).toString('hex'),
  E2E_RUNTIME_PASSWORD: randomBytes(12).toString('hex'), E2E_JWT_SECRET: randomBytes(32).toString('base64'),
};
Object.assign(process.env, env);
await mkdir(reportDirectory(runId), {recursive: true});
await writeFile(resolve(work,'reports/latest.json'),JSON.stringify({runId}));
console.log(`E2E run ${runId}: only runner-owned local PostgreSQL and apps`);
let pg: Awaited<ReturnType<typeof startPostgres>> | undefined;
let frontend: ReturnType<typeof launch> | undefined;
let failure: string | undefined;
let phase = 'postgres';
try {
  pg = await startPostgres(runId);
  phase = 'build';
  await command('pnpm', ['--dir', 'backend', 'build']);
  await command('pnpm', ['--dir', 'frontend', 'build'], buildEnv);
  const {relativeAppDir} = JSON.parse(await readFile(resolve(root, 'frontend/.next/required-server-files.json'), 'utf8')) as {relativeAppDir: string};
  const standalone = resolve(root, 'frontend/.next/standalone', relativeAppDir);
  await cp(resolve(root, 'frontend/.next/static'), resolve(standalone, '.next/static'), {recursive: true});
  frontend = launch(process.execPath, ['server.js'], {...buildEnv, PORT: String(webPort), HOSTNAME: '127.0.0.1'}, standalone);
  try {await ready(`http://127.0.0.1:${webPort}`, frontend.child);}
  catch (error) {throw new Error(`Frontend not ready: ${safe(frontend.output())}`, {cause: error});}
  phase = 'playwright';
  const args = process.argv.slice(2);
  if (!args.some(a => a.startsWith('--project')) && !args.includes('--ui')) args.push('--project=chromium');
  const tests = launch(resolve(work, 'node_modules/.bin/playwright'), ['test', ...args], {
    ...env, E2E_PG_PORT: String(pg.port), E2E_PG_FOLDER: pg.folder,
    E2E_WEB_PORT: String(webPort), E2E_API_PORT: String(apiPort),
  }, work);
  tests.child.stdout?.on('data', chunk => process.stdout.write(safe(String(chunk))));
  tests.child.stderr?.on('data', chunk => process.stderr.write(safe(String(chunk))));
  const terminate = () => {void stop(tests.child);};
  process.once('SIGINT', terminate); process.once('SIGTERM', terminate);
  process.exitCode = (await tests.finished) ?? 1;
  process.removeListener('SIGINT', terminate); process.removeListener('SIGTERM', terminate);
} catch (error) {
  failure = safe(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
  console.error(failure);
} finally {
  try {
    if (frontend) await stop(frontend.child);
    if (pg) await pg.close();
  } catch (error) {
    failure = safe(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    console.error(`E2E cleanup failed: ${failure}`);
  }
  await writeFile(resolve(reportDirectory(runId), 'run.json'), JSON.stringify({runId, commit, seedVersion, dirtyAtStart, startedAt: new Date(startedAt).toISOString(), finishedAt: new Date().toISOString(), durationMs: Date.now()-startedAt, dirty: Boolean((await command('git', ['status', '--porcelain'])).trim()), exitCode: process.exitCode??0, phase, failure}, null, 2));
}
