import {spawn, type ChildProcess} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {isolatedEnv, root} from './settings.ts';

export function launch(command: string, args: string[], env: NodeJS.ProcessEnv = {}, cwd = root) {
  const child = spawn(command, args, {cwd, env: isolatedEnv(env), stdio: ['ignore', 'pipe', 'pipe']});
  let output = '';
  child.stdout?.on('data', chunk => {output = (output + chunk).slice(-32_000);});
  child.stderr?.on('data', chunk => {output = (output + chunk).slice(-32_000);});
  const finished = new Promise<number | null>((resolve, reject) => {
    child.once('error', reject); child.once('exit', code => resolve(code));
  });
  return {child, finished, output: () => output};
}
export async function command(bin: string, args: string[], env: NodeJS.ProcessEnv = {}, cwd = root) {
  const p = launch(bin, args, env, cwd);
  const code = await p.finished;
  if (code !== 0) throw new Error(`E2E command failed: ${bin} ${args[0] ?? ''} (exit ${code}); ${safe(p.output()).slice(-6000)}`);
  return safe(p.output());
}
export function safe(value: string) {
  let text = value.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g, '[JWT REDACTED]')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[DATABASE REDACTED]');
  for (const key of ['E2E_PASSWORD', 'E2E_JWT_SECRET', 'E2E_RUNTIME_PASSWORD']) {
    const secret = process.env[key]; if (secret) text = text.replaceAll(secret, '[REDACTED]');
  }
  return text;
}
export async function stop(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const done = new Promise<void>(resolve => child.once('exit', () => resolve()));
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  try {await done;} finally {clearTimeout(timer);}
}
export async function ready(url: string, child?: ChildProcess, ms = 30_000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (child && (child.exitCode !== null || child.signalCode !== null)) throw new Error('E2E service exited before readiness');
    try {if ((await fetch(url, {signal: AbortSignal.timeout(1000)})).ok) return;} catch { /* bounded readiness polling */ }
    await delay(100);
  }
  throw new Error('E2E service readiness deadline exceeded');
}
