import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, mkdirSync, mkdtempSync, writeFileSync, renameSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prepareCatalog, renderCatalog } from './api-catalog-render.mjs';
import swaggerUi from 'swagger-ui-dist';

const root = fileURLToPath(new URL('../', import.meta.url));
export const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];
const requireBackend = createRequire(join(root, 'backend/package.json'));

export async function registeredRoutes() {
  requireBackend('reflect-metadata');
  const { RequestMethod } = requireBackend('@nestjs/common');
  const { AppModule } = requireBackend('./dist/app.module.js');
  const routes = [], visited = new Set();
  function visit(entry) {
    const module = entry.module ?? entry;
    if (visited.has(module)) return;
    visited.add(module);
    for (const controller of [...(Reflect.getMetadata('controllers', module) ?? []), ...(entry.controllers ?? [])]) {
      const prefix = Reflect.getMetadata('path', controller) ?? '';
      if (typeof prefix !== 'string') throw new Error('Unsupported controller path');
      for (const name of Object.getOwnPropertyNames(controller.prototype)) {
        const handler = controller.prototype[name];
        if (typeof handler !== 'function') continue;
        const verb = Reflect.getMetadata('method', handler);
        if (verb === undefined) continue;
        const suffix = Reflect.getMetadata('path', handler) ?? '';
        if (typeof suffix !== 'string') throw new Error('Unsupported method path');
        const method = RequestMethod[verb]?.toLowerCase();
        if (!methods.includes(method)) throw new Error('Unsupported HTTP method');
        const path = ('/' + [prefix, suffix].filter(Boolean).join('/')).replace(/\/+/g, '/').replace(/\/$/, '').replace(/:(\w+)/g, '{$1}') || '/';
        routes.push({method, path, public: Reflect.getMetadata('identity:public', handler) === true});
      }
    }
    for (const imported of [...(Reflect.getMetadata('imports', module) ?? []), ...(entry.imports ?? [])]) visit(imported);
  }
  visit(AppModule);
  if (!routes.length) throw new Error('No registered routes');
  return routes;
}

export function checkCoverage(doc, routes) {
  for (const route of routes) {
    const op = doc.paths[route.path]?.[route.method];
    if (!op) throw new Error(`Missing OpenAPI operation: ${route.method.toUpperCase()} ${route.path}`);
    const publicOperation = (op.security ?? doc.security ?? []).length === 0;
    if (publicOperation !== route.public) throw new Error(`OpenAPI security mismatch: ${op.operationId}`);
    if (!(op['x-permissions'] || op.description)) throw new Error(`Missing access documentation: ${op.operationId}`);
  }
  const ids = new Set();
  for (const [path, item] of Object.entries(doc.paths)) for (const method of methods) {
    const op = item[method];
    if (!op) continue;
    if (!op.operationId || ids.has(op.operationId)) throw new Error(`Missing or duplicate operationId: ${path}`);
    ids.add(op.operationId);
    op['x-availability'] = routes.some(r => r.path === path && r.method === method) ? 'implementada' : 'planificada';
  }
}

function files(path) {
  return readdirSync(path, {withFileTypes:true}).sort((a,b) => a.name.localeCompare(b.name)).flatMap(e =>
    e.isDirectory() ? files(join(path,e.name)) : [join(path,e.name)]);
}

export async function buildCatalog({ output = join(root, 'dist/api-catalog'), source = join(root, 'docs/reference/openapi/openapi.yaml') } = {}) {
  output = resolve(output);
  mkdirSync(output, {recursive:true});
  const stage = mkdtempSync(join(output, '.staging-'));
  try {
    const run = args => execFileSync('pnpm', ['exec', 'redocly', ...args], {cwd:root, stdio:'pipe'});
    run(['lint', source]);
    run(['bundle', source, '--dereferenced', '-o', join(stage,'openapi.json')]);
    const doc = JSON.parse(readFileSync(join(stage,'openapi.json')));
    const routes = await registeredRoutes();
    checkCoverage(doc, routes);
    prepareCatalog(doc);
    const swaggerAssets = swaggerUi.getAbsoluteFSPath();
    const hash = createHash('sha256');
    const inputs = [...files(join(root,'docs/reference/openapi')), ...files(join(root,'backend/src')),
      ...files(join(root,'backend/dist')).filter(p => p.endsWith('.js')),
      ...['swagger-ui.css','swagger-ui-bundle.js','swagger-ui-bundle.js.LICENSE.txt','LICENSE','NOTICE'].map(p => join(swaggerAssets,p)),
      ...['scripts/api-catalog.mjs','scripts/api-catalog-render.mjs','scripts/api-catalog-init.js','docs/reference/catalog.css',
        'mockups/assets/tokens.css','redocly.yaml','package.json','pnpm-lock.yaml',
        'backend/package.json','backend/pnpm-lock.yaml'].map(p => join(root,p))];
    for (const file of inputs.sort()) hash.update(relative(root,file)).update('\0').update(readFileSync(file)).update('\0');
    hash.update(JSON.stringify(doc));
    const revision = `${execFileSync('git',['rev-parse','--short=12','HEAD'],{cwd:root,encoding:'utf8'}).trim()}-${hash.digest('hex').slice(0,16)}`;
    doc.info['x-source-revision'] = revision;
    writeFileSync(join(stage,'openapi.json'), JSON.stringify(doc,null,2)+'\n');
    writeFileSync(join(stage,'index.html'), renderCatalog(doc));
    for (const [from,to] of [['mockups/assets/tokens.css','tokens.css'],['docs/reference/catalog.css','catalog.css'],['scripts/api-catalog-init.js','catalog-init.js']]) copyFileSync(join(root,from),join(stage,to));
    for (const asset of ['swagger-ui.css','swagger-ui-bundle.js','swagger-ui-bundle.js.LICENSE.txt','LICENSE','NOTICE']) copyFileSync(join(swaggerAssets,asset),join(stage,asset));
    mkdirSync(join(output,'releases'),{recursive:true});
    const directory = join(output,'releases',revision);
    if (existsSync(directory)) rmSync(stage,{recursive:true}); else renameSync(stage,directory);
    // Only this single atomic rename changes the public entry; old releases stay intact.
    const entry = join(output, `.index-${process.pid}.html`);
    writeFileSync(entry, `<!doctype html><html lang="es"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=releases/${revision}/index.html"><title>AcademiX — Catálogo</title><a href="releases/${revision}/index.html">Abrir catálogo ${revision}</a></html>`);
    renameSync(entry,join(output,'index.html'));
    return { revision, directory, implemented:routes.length };
  } catch (error) {
    const diagnostic = error.stderr?.toString() || error.message;
    throw new Error(`Catálogo rechazado; versión anterior conservada. ${diagnostic}`, {cause:error});
  } finally { rmSync(stage,{recursive:true,force:true}); }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  buildCatalog().then(result => console.log(JSON.stringify(result,null,2))).catch(error => {console.error(error.message);process.exitCode=1;});
}
