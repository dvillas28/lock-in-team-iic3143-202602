import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { watchContextAccess } from '../src/lib/auth/context-events.ts';
import { mount } from './fixtures/course-ui.ts';
import { course } from './fixtures/courses.ts';

test('focus/visibility/pageshow coalesce, preserve edited form and ignore hidden windows', async () => {
  const ui = await mount(h('form', null, h('input', {name:'draft', defaultValue:'original'})), () => Response.json(course));
  const stop = watchContextAccess(ui.session, 'uc', ui.dom.window as unknown as Window, ui.doc);
  try {
    const context = ui.session.getSnapshot().context;
    const input = ui.doc.querySelector('input')!; input.value = 'trabajo sin guardar';
    Object.defineProperty(ui.doc, 'visibilityState', {value:'visible', configurable:true});
    const count = ui.requests.length;
    await ui.settle(() => {
      ui.dom.window.dispatchEvent(new ui.dom.window.Event('focus'));
      ui.doc.dispatchEvent(new ui.dom.window.Event('visibilitychange'));
      ui.dom.window.dispatchEvent(new ui.dom.window.Event('pageshow'));
    });
    await new Promise(r => setTimeout(r, 10)); await ui.settle(() => {});
    assert.equal(ui.requests.length, count + 1);
    assert.equal(ui.session.getSnapshot().context, context);
    assert.equal(ui.doc.querySelector('input'), input); assert.equal(input.value, 'trabajo sin guardar');
    Object.defineProperty(ui.doc, 'visibilityState', {value:'hidden', configurable:true});
    await ui.settle(() => ui.dom.window.dispatchEvent(new ui.dom.window.Event('focus')));
    await new Promise(r => setTimeout(r, 5)); assert.equal(ui.requests.length, count + 1);
  } finally { stop(); await ui.close(); }
});
