const verbs = ['get','post','put','patch','delete','head','options','trace'];
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => JSON.stringify(value,null,2);
const quote = text => "'" + text.replaceAll("'", "'\\''") + "'";

// Samples illustrate shape only; exact required fields, alternatives and bounds remain in schemas.
export function sample(schema = {}, name = '', seen = new Set()) {
  if (schema.example !== undefined) return schema.example;
  if (schema.examples?.length) return schema.examples[0];
  if (schema.const !== undefined) return schema.const;
  if (schema.enum) return schema.enum[0];
  if (schema.default !== undefined) return schema.default;
  if (seen.has(schema)) return null;
  seen = new Set(seen).add(schema);
  if (schema.oneOf || schema.anyOf) return sample((schema.oneOf ?? schema.anyOf)[0],name,seen);
  if (schema.allOf) return Object.assign({}, ...schema.allOf.map(s => sample(s,name,seen)));
  const type = Array.isArray(schema.type) ? schema.type.find(t => t !== 'null') : schema.type;
  if (type === 'object' || schema.properties) return Object.fromEntries(Object.entries(schema.properties ?? {}).slice(0,schema.maxProperties).map(([key,s]) => [key,sample(s,key,seen)]));
  if (type === 'array') return Array.from({length:schema.minItems ?? 0}, () => sample(schema.items,name,seen));
  if (type === 'boolean') return false;
  if (type === 'integer' || type === 'number') return schema.minimum ?? 1;
  if (type === 'null') return null;
  if (schema.format === 'uuid') return '00000000-0000-4000-8000-000000000001';
  if (schema.format === 'date-time') return '2026-10-19T12:00:00Z';
  if (schema.format === 'date') return '2026-10-19';
  if (schema.format === 'email' || /email/i.test(name)) return 'persona@example.test';
  if (/token/i.test(name)) return 'TOKEN_SINTETICO_NO_VALIDO';
  if (/password/i.test(name)) return 'REEMPLAZAR_PASSWORD_DE_PRUEBA';
  if (/slug/i.test(name)) return 'institucion-demo';
  if (schema.format === 'uri') return 'https://example.test/';
  return 'ejemplo';
}


export function prepareCatalog(doc) {
  for (const [path,item] of Object.entries(doc.paths)) for (const method of verbs) {
    const op = item[method];
    if (!op) continue;
    const parameters = [...(item.parameters ?? []),...(op.parameters ?? [])];
    const protectedOp = (op.security ?? doc.security ?? []).length > 0;
    const body = op.requestBody?.content?.['application/json'];
    const bodySample = body?.example ?? sample(body?.schema);
    let url = path.replace(/\{([^}]+)\}/g, (_,name) => String(sample(parameters.find(p => p.name === name)?.schema,name)));
    const query = parameters.filter(p => p.in === 'query' && p.required).map(p => `${p.name}=${encodeURIComponent(sample(p.schema,p.name))}`);
    if (query.length) url += '?' + query.join('&');
    let curl = `curl -i -X ${method.toUpperCase()} "$API_URL${url}"`;
    if (protectedOp) curl += ' \\\n  -H "Authorization: Bearer $TOKEN"';
    if (body) curl += ` \\\n  -H 'Content-Type: application/json' \\\n  --data ${quote(json(bodySample))}`;
    for (const p of parameters.filter(p => p.in === 'header' && p.required)) {
      curl += ' \\\n  -H ' + quote(`${p.name}: ${sample(p.schema,p.name)}`);
    }
    const multipart = op.requestBody?.content?.['multipart/form-data'];
    if (multipart) for (const [name,schema] of Object.entries(multipart.schema?.properties ?? {})) {
      curl += ' \\\n  -F ' + quote(`${name}=${schema.format === 'binary' ? '@/ruta/archivo-de-prueba.txt' : sample(schema,name)}`);
    }
    const permissions = op['x-permissions'] ?? op.description ?? 'Operación futura; sin permisos ejecutables en esta revisión.';
    op.summary = `[${op['x-availability']}] ${op.summary}`;
    op.description = `${op.description ?? ''}

**Disponibilidad:** ${op['x-availability']}.

**Acceso:** ${protectedOp ? 'JWT Bearer y User activo.' : 'Público, sin JWT.'}

**Permisos:** ${permissions}

**Contexto institucional:** ${path.includes('{institutionSlug}') ? 'institutionSlug en el path; Institution y membership activas. El slug no autoriza; recursos ajenos permanecen ocultos.' : 'Sin contexto institucional en el path.'}

### Ejemplo de solicitud externa

Ejemplo sintético copiable; sustituir entorno, credenciales e identificadores.

\`\`\`bash
${curl}
\`\`\``;
    for (const [status,response] of Object.entries(op.responses ?? {})) for (const [media,value] of Object.entries(response.content ?? {})) {
      if (value.example !== undefined || value.examples) continue;
      let data = sample(value.schema);
      if (media === 'application/problem+json' && data && typeof data === 'object') data = {...data,status:Number(status)};
      value.example = data;
    }
    if (body && body.example === undefined && !body.examples) body.example = bodySample;
  }
}

export function renderCatalog(doc) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AcademiX — Swagger UI</title><link rel="icon" href="data:,"><link rel="stylesheet" href="swagger-ui.css"><link rel="stylesheet" href="tokens.css"><link rel="stylesheet" href="catalog.css"></head>
<body><header class="catalog-header"><a href="#swagger-ui">Saltar al catálogo</a>
<p>AcademiX · Swagger UI · Revisión de origen: <code>${escape(doc.info['x-source-revision'])}</code></p>
<a href="openapi.json" download="openapi.json">Descargar descripción OpenAPI 3.1</a></header>
<p id="catalog-error" class="catalog-header" role="alert" hidden></p>
<noscript>Activa JavaScript para consultar Swagger UI o descarga la descripción OpenAPI.</noscript>
<main id="swagger-ui" aria-label="Catálogo de endpoints" tabindex="-1"></main>
<script src="swagger-ui-bundle.js" onerror="document.getElementById('catalog-error').hidden=false;document.getElementById('catalog-error').textContent='No se pudo cargar Swagger UI. Recarga o descarga OpenAPI.'"></script>
<script src="catalog-init.js"></script></body></html>`;
}
