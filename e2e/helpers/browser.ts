import {expect, type Page, type BrowserContext} from '@playwright/test';
import {origin} from '../runner/settings.ts';
import type {Environment} from '../fixtures/environment.ts';

const recording = new WeakSet<BrowserContext>();
export async function trace(context: BrowserContext) {
  if (!recording.has(context)) {await context.tracing.start({screenshots:true,snapshots:true,sources:false}); recording.add(context);}
}
export async function stopTrace(context: BrowserContext, path?: string) {
  if (recording.has(context)) {recording.delete(context); await context.tracing.stop(path ? {path} : {}); return true;}
  return false;
}
export async function login(page: Page, e: Environment, actor = 'ST1', slug = 'uc', next = '/courses') {
  await stopTrace(page.context()); // No trace captures login bodies, passwords or token responses.
  await page.goto(`${origin(slug)}/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel('Correo electrónico', {exact:true}).fill(e.data.actors[actor].email);
  await page.getByLabel('Contraseña', {exact:true}).fill(e.password);
  const [r, directory, me] = await Promise.all([
    page.waitForResponse(r=>r.url().endsWith('/api/v1/auth/login') && r.request().method()==='POST'),
    page.waitForResponse(r=>r.url().endsWith('/api/v1/institutions')),
    page.waitForResponse(r=>r.url().endsWith(`/api/v1/institution/${slug}/me`)),
    page.getByRole('button',{name:'Continuar',exact:true}).click(),
  ]);
  expect(r.status(), 'Real UI authentication').toBe(200);
  const body = await r.json();
  expect(body.tokenType).toBe('Bearer');
  expect(body.expiresIn).toBe(900);
  expect(typeof body.accessToken).toBe('string');
  expect(await r.request().headerValue('authorization')).toBeNull();
  for (const response of [directory, me]) {
    expect(response.status(), 'Live institution authorization').toBe(200);
    expect(Boolean((await response.request().headerValue('authorization'))?.startsWith('Bearer '))).toBe(true);
  }
  const token = body.accessToken; e.tokens.set(actor,token);
  await expect(page.getByRole('button',{name:'Cerrar sesión',exact:true})).toBeVisible();
  await expect(page.getByRole('status').filter({hasText:'Preparando acceso'})).toHaveCount(0);
  await trace(page.context());
  return token as string;
}
export async function showMenu(page: Page) {
  const button = page.getByRole('button',{name:'Abrir navegación',exact:true});
  if (await button.isVisible()) await button.click();
}
export async function course(page: Page, id: string) {
  if (!new URL(page.url()).pathname.startsWith(`/courses/${id}`)) {
    if (new URL(page.url()).pathname !== '/courses') {
      await showMenu(page); await page.getByRole('link',{name:'Mis cursos',exact:true}).click();
    }
    await page.locator(`a[href="/courses/${id}"]`).filter({has:page.getByRole('heading')}).click();
  }
  await expect(page).toHaveURL(new RegExp(`/courses/${id}(?:/|$)`));
}
export async function go(page: Page, id: string, suffix = '') {
  const path = `/courses/${id}${suffix}`;
  if (new URL(page.url()).pathname === path) return;
  await course(page,id);
  if (!suffix) return;
  const target = page.locator('main').locator(`a[href="${path}"]`);
  if (await target.count()) {
    await target.first().click(); // Duplicate same-destination links have identical navigation semantics.
  } else {
    await showMenu(page);
    await page.locator('nav[aria-label="Navegación institucional"]').locator(`a[href="${path}"]`).click();
  }
  await expect(page).toHaveURL(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$'));
}
