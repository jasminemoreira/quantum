// tests/v29.test.mjs — cycle 29 (PLAY no manual), M-01 play-data.
// stepsToGroups: partição passo→chip usada pelo play; stepsToKeys deve ficar BYTE-IDÊNTICO ao de antes
// (golden capturado ANTES da refatoração: fixtures/v29-keys-golden.json).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { examples } from './examples-data.mjs';
import { stepsToGroups, stepsToKeys, renderManual } from './examples-render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(readFileSync(join(HERE, 'fixtures', 'v29-keys-golden.json'), 'utf8'));

test('v29-1 stepsToKeys byte-identical to the pre-refactor golden for every result (92)', () => {
  let n = 0;
  for (const ex of examples) ex.results.forEach((r, k) => {
    assert.equal(stepsToKeys(r.steps), golden[ex.id + '#' + k], `${ex.id}#${k}`); n++;
  });
  assert.equal(n, Object.keys(golden).length);
});

test('v29-2 stepGroup covers every step with a valid, non-decreasing chip index', () => {
  for (const ex of examples) for (const r of ex.results){
    const { groups, stepGroup } = stepsToGroups(r.steps);
    assert.equal(stepGroup.length, r.steps.length, ex.id);
    stepGroup.forEach((g, i) => {
      assert.ok(Number.isInteger(g) && g >= 0 && g < groups.length, `${ex.id} step ${i} → ${g}`);
      if (i) assert.ok(g >= stepGroup[i - 1], `${ex.id} non-decreasing at ${i}`);
    });
    assert.equal(stepGroup[stepGroup.length - 1], groups.length - 1, `${ex.id} last step in last chip`);
  }
});

test('v29-3 angle tokens merge into the gate chip; page:0 belongs to the NEXT group', () => {
  const a = stepsToGroups(['key:0','key:Q','gate:P','calc:π','calc:/','calc:4','eval','key:0','key:Q','gate:H']);
  assert.deepEqual(a.groups, ['0 Q P π/4 =', '0 Q H']);
  assert.deepEqual(a.stepGroup, [0,0,0,0,0,0,0,1,1,1]);
  const b = stepsToGroups(['key:0','key:Q','gate:H','page:0','key:1','key:Q','gate:X']);
  assert.deepEqual(b.groups, ['0 Q H', '1 Q X']);
  assert.equal(b.stepGroup[3], 1);
  const c = stepsToGroups(['key:0','key:Q','gate:H','page:0']);   // trailing page:0 → clamped to last chip
  assert.deepEqual(c.stepGroup, [0,0,0,0]);
});

test('v29-4 rendered manual: every res-block carries parseable data-steps/data-step-group + a ▶ button', () => {
  const fake = examples.map(ex => ({ ...ex, results: ex.results.map(r => ({ ...r, _plain: '|0⟩', _tex: '|0\\rangle', _out: 'x' })) }));
  const html = renderManual(fake);
  const blocks = [...html.matchAll(/<div class="res-block" data-steps="([^"]*)" data-step-group="([^"]*)">/g)];
  const total = examples.reduce((s, ex) => s + ex.results.length, 0);
  assert.equal(blocks.length, total);
  const unesc = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  for (const m of blocks){
    const steps = JSON.parse(unesc(m[1])), sg = JSON.parse(unesc(m[2]));
    assert.ok(Array.isArray(steps) && steps.length > 0); assert.equal(sg.length, steps.length);
  }
  assert.equal((html.match(/<button type="button" class="play"/g) || []).length, total);
  assert.ok(html.includes('aria-label="Play this example"'));
});

test('v29-5 injected play script: no template literals / script-close, and it parses', () => {
  const html = renderManual(examples.map(ex => ({ ...ex, results: ex.results.map(r => ({ ...r, _plain: '|0⟩', _tex: '', _out: '' })) })));
  const m = /<script>\((function manualPlay\(\)[\s\S]*?)\)\(\);<\/script>/.exec(html);
  assert.ok(m, 'manualPlay script injected');
  assert.ok(!m[1].includes('`'), 'no backticks in the injected function');
  assert.doesNotThrow(() => new Function('return (' + m[1] + ')'));
});
