import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { AcademicMarkdown } from '../src/components/content/academic-markdown.tsx';
import { markdownUrl } from '../src/lib/content/markdown-policy.ts';
import { CourseNavigation } from '../src/components/courses/course-navigation.tsx';
import { course, user } from './fixtures/courses.ts';
import { mount } from './fixtures/course-ui.ts';
import { ModulesPanel } from '../src/components/content/modules-panel.tsx';
import { material, unit } from './fixtures/content.ts';

const documentFor = (source: string) => new JSDOM(renderToStaticMarkup(h(AcademicMarkdown, { source }))).window.document;
test('Markdown renders semantic nested lists, shifted headings, GFM, quotes and literal code', () => {
  const doc = documentFor('# Principal\n\n## Sección\n\n### Subsección\n\n#### Cuarta\n\n##### Quinta\n\n###### Sexta\n\nUn **concepto** con *énfasis* y ~~tachado~~.\n\n- Primero\n  - Hijo\n\n1. Uno\n2. Dos\n\n> Cita\n\n---\n\n| A | B |\n| --- | --- |\n| uno | dos |\n\n`<img onerror=alert(1)>`\n\n```html\n  <script>alert(1)</script>\n```');
  assert.equal(doc.querySelector('h1'), null);
  assert.equal(doc.querySelector('h2')?.textContent, 'Principal');
  for (const tag of ['h3', 'h4', 'h5', 'h6', 'strong', 'em', 'del', 'ul ul li', 'ol li', 'blockquote', 'hr', 'table th', 'table td']) assert.ok(doc.querySelector(tag), tag);
  assert.equal(doc.querySelector('pre code')?.textContent, '  <script>alert(1)</script>\n');
  assert.equal(doc.querySelector('img, script'), null);
  assert.equal(doc.querySelector('pre')?.tabIndex, 0);
  assert.ok(doc.querySelector('.academic-table-scroll[tabindex="0"]'));
});

test('central URL policy allows only absolute HTTP(S) and unambiguous fragments', () => {
  for (const url of ['https://example.test/a?q=1#x', 'http://example.test/', 'HTTPS://EXAMPLE.TEST/a', '#main-content', 'https://example.test/a%20b']) {
    // Even encoded spaces are intentionally excluded from content links.
    assert.equal(!!markdownUrl(url), !url.includes('%20'), url);
  }
  for (const url of ['', '#', '/courses/x', '../x', '//evil.test/x', 'javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\nscript:alert(1)', 'data:text/html,x', 'vbscript:x', 'file:///x', 'mailto:a@b.test', 'https:evil.test', 'https:///evil.test', 'https://user:pass@example.test', 'https://@example.test', 'https://example.test/a b', 'https://example.test/\u0000x', 'https://example.test/%0a', 'https://example.test/%2509', 'https://example.test/%25200a', 'https://example.test/\\evil', 'https://example.test/%5Cevil', 'https://example.test/\u202Ex', 'https://[invalid', 'https://example.test/%zz']) {
    assert.equal(markdownUrl(url), undefined, url);
  }
});

test('links apply policy after Markdown entity decoding and never prefetch or send a referrer', () => {
  const doc = documentFor('[https](https://example.test/path) [http](http://example.test) [fragment](#main-content) [relative](/courses/x) [js](javascript:alert%281%29) [entity](jav&#x61;script:alert%281%29) [control](java&#x09;script:alert%281%29) [userinfo](https://user:pass@example.test) [space](<https://example.test/a b>) [slash](//evil.test/x)');
  const links = [...doc.querySelectorAll('a')];
  assert.equal(links.length, 3);
  for (const a of links.slice(0, 2)) {
    assert.equal(a.target, '_blank'); assert.equal(a.rel, 'noopener noreferrer'); assert.equal(a.getAttribute('referrerPolicy'), 'no-referrer');
    assert.equal(a.getAttribute('data-prefetch'), null);
  }
  assert.equal(links[2].target, '');
  assert.equal(links[2].getAttribute('href'), '#main-content');
  for (const label of ['relative','js','entity','control','userinfo','space','slash']) assert.match(doc.body.textContent!, new RegExp(label));
});

test('adversarial HTML and resource content stays inert; image alt is text and source is never DOM', () => {
  const doc = documentFor('<script>alert(1)</script>\n\n<img src="https://evil.test/a" onerror="alert(1)">\n<iframe src="https://evil.test"></iframe>\n<video src="https://evil.test"></video>\n<style>body{display:none}</style>\n\n![<img onerror=alert(1)>](https://evil.test/pixel "remote")\n\n![](data:image/svg+xml,evil)\n\n![reference][image]\n\n[image]: https://evil.test/ref\n\n- [x] Done');
  assert.equal(doc.querySelector('script,img,iframe,video,audio,embed,object,style,link,source'), null);
  assert.equal(doc.querySelector('[src],[srcset],[onerror],[onclick]'), null);
  assert.match(doc.body.textContent!, /<script>alert\(1\)<\/script>/);
  assert.match(doc.querySelector('.academic-image-alt')!.textContent!, /<img onerror=alert\(1\)>/);
  assert.equal(doc.querySelectorAll('.academic-image-alt').length, 2);
  assert.equal(doc.querySelector<HTMLInputElement>('input')?.disabled, true);
  assert.equal(documentFor('![](https://evil.test)').querySelector('img'), null);
});

test('course tabs reflect effective capabilities and keep all links in the current course', () => {
  for (const profile of ['student','assistant','teacher','owner','ownerTeacher','super']) {
    const doc = new JSDOM(renderToStaticMarkup(h(CourseNavigation, { course, user: user(profile), active: '/modules' }))).window.document;
    assert.equal(doc.querySelector('a[aria-current="page"]')?.textContent, 'Módulos y material');
    assert.equal([...doc.querySelectorAll('a')].every(a => a.getAttribute('href')!.startsWith(`/courses/${course.id}`)), true);
    const labels = doc.body.textContent!;
    assert.equal(labels.includes('Secciones'), ['teacher','owner','ownerTeacher'].includes(profile));
    assert.equal(labels.includes('Mis notas'), profile === 'student');
    assert.equal(labels.includes('Libro de notas'), ['teacher','assistant','ownerTeacher'].includes(profile));
    assert.equal(labels.includes('Auditoría'), ['teacher','owner','ownerTeacher'].includes(profile));
  }
});

test('module index lazily opens resources and closing editor preserves its draft', async () => {
  const ui = await mount(h(ModulesPanel, {courseId: course.id}), r => Response.json(r.url.endsWith('/materials') ? {items:[material]} : r.url.endsWith('/modules') ? {items:[unit]} : course), 'teacher');
  try {
    assert.equal(ui.requests.some(r => r.url.endsWith('/materials')), false);
    const link = ui.doc.querySelector<HTMLAnchorElement>('.module-index a')!;
    await ui.settle(() => link.click());
    assert.equal(ui.doc.querySelector('.module-collapse')?.getAttribute('aria-expanded'), 'true');
    assert.equal(ui.doc.activeElement, ui.doc.querySelector('.module-collapse'));
    const details = ui.doc.querySelector<HTMLDetailsElement>('.resource-editor')!;
    const textarea = details.querySelector('textarea')!;
    await ui.settle(() => { details.open = true; textarea.value = 'Borrador con espacios  '; details.open = false; details.open = true; });
    assert.equal(textarea.value, 'Borrador con espacios  ');
    await ui.click('Actualizar materiales');
    assert.equal(details.querySelector('textarea')?.value, 'Borrador con espacios  ');
  } finally { await ui.close(); }
});

test('module fragment return opens the selected module and preserves editorial boundaries', async () => {
  const ui = await mount(h(ModulesPanel,{courseId:course.id}),r=>Response.json(r.url.endsWith('/materials')?{items:[material]}:r.url.endsWith('/modules')?{items:[unit]}:course),'assistant');
  try {
    await ui.settle(() => { ui.dom.window.location.hash = `module-${unit.id}`; ui.dom.window.dispatchEvent(new ui.dom.window.HashChangeEvent('hashchange')); });
    assert.equal(ui.doc.querySelector('.module-collapse')?.getAttribute('aria-expanded'), 'true');
    assert.equal(ui.doc.activeElement, ui.doc.querySelector('.module-collapse'));
    assert.equal(ui.doc.querySelector('form, .publication-control'), null);
    await ui.click('Unidad 1');
    assert.equal(ui.doc.querySelector('.module-collapse')?.getAttribute('aria-expanded'), 'false');
  } finally { await ui.close(); }
});
