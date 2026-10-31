import {test as base, expect, type Page, type BrowserContext} from '@playwright/test';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {caseDefinitions} from '../data/case-variants.ts';
import {Environment} from './environment.ts';
import {login, stopTrace} from '../helpers/browser.ts';
import {command} from '../runner/process.ts';
import {work, webPort, apiPort} from '../runner/settings.ts';

type Fixtures = {e: Environment; actorPage: (actor?: string, slug?: string, next?: string) => Promise<Page>};
export const test = base.extend<Fixtures>({
  e: [async ({}, use, info) => {
    const namespace = createHash('sha256').update(`${info.project.name}/${info.titlePath.join('/')}/${info.repeatEachIndex}/${info.retry}`).digest('hex').slice(0,16);
    const e = new Environment(namespace);
    try {await e.start(); await use(e);} finally {await e.close();}
  }, {timeout: 60_000}],
  actorPage: async ({browser, e}, use, info) => {
    const contexts: BrowserContext[] = [];
    await use(async (actor='ST1', slug='uc', next='/courses') => {
      const context = await browser.newContext({...info.project.use, serviceWorkers:'block'});
      contexts.push(context);
      // Requests must stay on the owned application/API or data URLs. Foreign content is a test failure.
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.protocol === 'data:' || url.protocol === 'about:' || ['localhost','127.0.0.1','uc.localhost','utfsm.localhost','desconocida.localhost'].includes(url.hostname) && [String(webPort),String(apiPort)].includes(url.port)) await route.continue();
        else await route.abort('blockedbyclient');
      });
      const page = await context.newPage(); await login(page,e,actor,slug,next); return page;
    });
    for (const [index, context] of contexts.entries()) {
      if (info.status !== info.expectedStatus) {
        for (const [n,page] of context.pages().entries()) {
          if (!page.isClosed()) await info.attach(`failure-${index}-${n}`, {body: await page.screenshot({mask:[page.locator('input[type="password"], input[name="password"], input[name="email"]')]}), contentType:'image/png'}).catch(()=>{});
        }
        const file = info.outputPath(`trace-${index}.zip`);
        if (await stopTrace(context,file)) {
          await command('python3',[resolve(work,'runner/sanitize-trace.py'),file]);
          await info.attach(`trace-${index}`,{path:file,contentType:'application/zip'});
        }
      } else await stopTrace(context);
      await context.close();
    }
  },
});
test.beforeEach(async ({}, info) => {
  const id = info.title.match(/E2E-[A-Z0-9]+-\d{3}/)?.[0];
  const name = info.title.match(/ \/ (.+?) @/)?.[1];
  const variant = id && caseDefinitions[id]?.find(v=>v.name===name);
  if (!variant) throw new Error('Each test requires a declared catalogue variant');
  info.annotations.push({type:'case',description:id},{type:'actor',description:variant.actor},
    {type:'tenant',description:variant.tenant},{type:'level',description:variant.level});
});
export {expect};
