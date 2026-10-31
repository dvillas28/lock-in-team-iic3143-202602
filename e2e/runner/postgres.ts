import {mkdtemp, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {execFileSync} from 'node:child_process';
import {command} from './process.ts';
import pg from 'pg';

export async function freePort() {
  const s = createServer();
  await new Promise<void>((ok, fail) => {s.once('error', fail); s.listen(0, '127.0.0.1', ok);});
  const port = (s.address() as {port: number}).port;
  await new Promise<void>(ok => s.close(() => ok())); return port;
}
export async function startPostgres(runId: string) {
  const folder = await mkdtemp(join(tmpdir(), 'academix-e2e-'));
  await writeFile(join(folder, 'owner'), runId, {mode: 0o600});
  const port = await freePort(); const url = `postgresql://postgres@127.0.0.1:${port}/postgres`;
  let docker = false, started = false, bin = process.env.E2E_PG_BIN;
  if (!bin) {
    for (const candidate of ['/opt/homebrew/opt/postgresql@17/bin', '/usr/lib/postgresql/17/bin']) {
      try {if (/ 17\./.test(execFileSync(join(candidate, 'postgres'), ['--version'], {encoding: 'utf8'}))) {bin = candidate; break;}} catch { /* next candidate */ }
    }
  }
  const container = `academix-e2e-${runId}`;
  const close = async () => {
    if (await readFile(join(folder, 'owner'), 'utf8') !== runId) throw new Error('E2E ownership mismatch: refusing cleanup');
    if (started && docker) {
      const label = execFileSync('docker', ['inspect', '--format', '{{index .Config.Labels "academix.e2e.owner"}}', container], {encoding: 'utf8'}).trim();
      if (label !== runId) throw new Error('E2E container ownership mismatch');
      await command('docker', ['rm', '-f', container]);
    } else if (started && bin) {
      await command(join(bin, 'pg_ctl'), ['-D', join(folder, 'data'), '-m', 'fast', '-w', 'stop']);
    }
    await rm(folder, {recursive: true});
  };
  try {
    if (bin) {
      if (!/ 17\./.test(execFileSync(join(bin, 'postgres'), ['--version'], {encoding: 'utf8'}))) throw new Error('E2E requires PostgreSQL 17');
      await command(join(bin, 'initdb'), ['-D', join(folder, 'data'), '-U', 'postgres', '--auth=trust', '--no-locale', '--encoding=UTF8']);
      await command(join(bin, 'pg_ctl'), ['-D', join(folder, 'data'), '-l', join(folder, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port} -k ${folder}`, '-w', 'start']);
      started = true;
    } else {
      docker = true;
      await command('docker', ['run', '-d', '--name', container, '--label', `academix.e2e.owner=${runId}`, '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', '-p', `127.0.0.1:${port}:5432`, 'postgres:17-alpine']);
      started = true;
    }
    const db = new pg.Pool({connectionString: url, connectionTimeoutMillis: 1000});
    const deadline = Date.now() + 30_000;
    try {
      while (true) {
        try {await db.query('SELECT 1'); break;} catch (error) {
          if (Date.now() >= deadline) throw error;
          await new Promise(ok => setTimeout(ok, 100));
        }
      }
    } finally {await db.end();}
    return {url, port, folder, close};
  } catch (error) {
    try {await close();} catch { /* retain owned directory for diagnosis if start did not finish */ }
    throw error;
  }
}
