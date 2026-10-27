import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { buildCatalog, checkCoverage, registeredRoutes } from './api-catalog.mjs';
import { escape, sample } from './api-catalog-render.mjs';

test('synthetic samples preserve bounded shapes and HTML is escaped', () => {
  assert.equal(escape('<script>"&'), '&lt;script&gt;&quot;&amp;');
  assert.deepEqual(sample({type:'object',maxProperties:1,properties:{role:{enum:['student']},active:{type:'boolean'}}}),{role:'student'});
  assert.equal(sample({type:'array',minItems:2,items:{type:'integer'}}).length,2);
  assert.equal(sample({type:'string'},'accessToken'),'TOKEN_SINTETICO_NO_VALIDO');
});

test('Swagger loads local documentation read-only and rejects failed descriptions without partial UI', async () => {
  const script = readFileSync(new URL('./api-catalog-init.js',import.meta.url),'utf8');
  const spec = {openapi:'3.1.0',paths:{},info:{'x-source-revision':'test'}};
  const errors = [null, 'http', 'json', 'schema'];
  for (const failure of errors) {
    const alert = {hidden:true}, root = {replaceChildren() {this.cleared=true;}}, window = {};
    await runInNewContext(script, {
      window,
      document: {getElementById: id => id === 'catalog-error' ? alert : root},
      fetch: async (url,options) => {
        assert.equal(url,'./openapi.json');
        assert.equal(options.credentials,'omit');
        return {ok:failure !== 'http', json:async () => {
          if (failure === 'json') throw new SyntaxError();
          return failure === 'schema' ? {} : spec;
        }};
      },
      SwaggerUIBundle: config => config,
    });
    if (failure) {
      assert.equal(window.ui,undefined);
      assert.equal(root.cleared,true);
      assert.equal(alert.hidden,false);
      assert.match(alert.textContent,/No se pudo cargar el catálogo completo/);
    } else {
      assert.equal(window.ui.spec,spec);
      assert.equal(window.ui.supportedSubmitMethods.length,0);
      assert.equal(window.ui.validatorUrl,null);
      assert.equal(window.ui.queryConfigEnabled,false);
      assert.equal(window.ui.persistAuthorization,false);
      assert.throws(() => window.ui.requestInterceptor(),/solo lectura/);
    }
  }
});

 test('registered routes are covered; public security agrees; missing routes fail', async () => {
  const routes = await registeredRoutes();
  assert(routes.length > 0);
  assert(routes.some(r=>r.path==='/api/v1/institution/{institutionSlug}/me'));
  assert(routes.every(r=>!r.path.startsWith('/api/v1/institutions/')));
  assert(routes.some(r => r.path === '/api/v1/auth/login' && r.public));
  assert.throws(() => checkCoverage({ paths: {} }, routes), /Missing/);
  const doc = { security: [{bearerAuth: []}], paths: {'/health': {get: {operationId: 'health'}}} };
  assert.throws(() => checkCoverage(doc, [{method:'get',path:'/health',public:true}]), /security/);
 });

 test('publication includes every operation, download and revision; failures retain previous entry', async () => {
  const output = mkdtempSync(join(tmpdir(), 'academix-catalog-'));
  try {
    const result = await buildCatalog({ output });
    const entry = readFileSync(join(output, 'index.html'), 'utf8');
    const html = readFileSync(join(result.directory, 'index.html'), 'utf8');
    const doc = JSON.parse(readFileSync(join(result.directory, 'openapi.json')));
    assert.equal(doc.openapi, '3.1.0');
    assert.equal(doc.info['x-source-revision'], result.revision);
    const verifyResolved = value => {
      if (!value || typeof value !== 'object') return;
      assert(!Object.hasOwn(value,'$ref'));
      Object.values(value).forEach(verifyResolved);
    };
    verifyResolved(doc);
    let implemented = 0;
    for (const item of Object.values(doc.paths)) for (const [method, op] of Object.entries(item)) {
      if (!['get','post','patch','put','delete','head','options','trace'].includes(method)) continue;
      assert(op.summary.includes(`[${op['x-availability']}]`));
      assert(op.description.includes('### Ejemplo de solicitud externa'));
      assert(op.description.includes('**Permisos:**'));
      if (op['x-availability'] === 'implementada') implemented++; else assert.equal(op['x-availability'], 'planificada');
    }
    assert.equal(implemented, (await registeredRoutes()).length);
    assert.equal(doc.paths['/api/v1/institution/{institutionSlug}/users'].get['x-availability'], 'implementada');
    assert(html.includes('download="openapi.json"'));
    assert(html.includes('swagger-ui-bundle.js'));
    assert(html.includes('swagger-ui.css'));
    for (const asset of ['swagger-ui.css','swagger-ui-bundle.js','catalog-init.js','LICENSE','NOTICE']) assert(readFileSync(join(result.directory,asset)).length > 0);
    const init = readFileSync(join(result.directory,'catalog-init.js'),'utf8');
    assert(init.includes('supportedSubmitMethods: []'));
    assert(init.includes('validatorUrl: null'));
    assert(init.includes('queryConfigEnabled: false'));
    assert(!html.includes('https://cdn'));
    const serialized = JSON.stringify(doc);
    assert(serialized.includes('persona@example.test'));
    assert(serialized.includes('TOKEN_SINTETICO_NO_VALIDO'));

    const invalid = join(output, 'invalid.json');
    writeFileSync(invalid, JSON.stringify({openapi:'3.1.0', info:{title:'Invalid',version:'1'},paths:{'/broken':{$ref:'./missing.yaml'}}}));
    await assert.rejects(buildCatalog({output, source:invalid}));
    assert.equal(readFileSync(join(output, 'index.html'), 'utf8'), entry);
    writeFileSync(invalid, '{ invalid JSON');
    await assert.rejects(buildCatalog({output, source:invalid}));
    assert.equal(readFileSync(join(output, 'index.html'), 'utf8'), entry);
  } finally { rmSync(output, {recursive:true,force:true}); }
 });
