// tests/examples.spec.js — Phase 6 (v10): DRIVER + GENERATOR + VALIDATOR of the consolidated manual.html.
// Replays the REAL key sequence of each cookbook example in the interface, CAPTURES what appears on
// screen (#stateDisplay / #auxOutput / #statusLine), GENERATES manual.html (Part I reference embedded
// statically + Part II cookbook from the captures) and VALIDATES it (vendored KaTeX, structure, offline
// render). The screen is the source of truth → key→screen fidelity.
// v10 NOTE (C1 sequence): the reference (Part I) lives inside examples-render.mjs; this generator never
// reads a possibly-overwritten manual.html, so no reference content can be lost.
import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { examples } from './examples-data.mjs';
import { renderManual } from './examples-render.mjs';
import { assertValidKatex } from './assert-valid-katex.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = pathToFileURL(join(HERE, '..', 'quantum_calc.html')).href;
const DOC = pathToFileURL(join(HERE, '..', 'manual.html')).href;
const DOC_PATH = join(HERE, '..', 'manual.html');
const SHOT = (n) => join(HERE, `shot-ex-${n}.png`);

test.describe.configure({ mode: 'serial', timeout: 240000 });

test('captures each example screen, generates manual.html and validates KaTeX', async ({ page }) => {
  page.on('dialog', d => d.type() === 'prompt' ? d.accept('0') : d.dismiss());
  for (const ex of examples){
    for (const r of ex.results){
      await page.goto(APP);
      for (const step of r.steps){
        await page.locator(`[data-action="${step}"]`).first().click();
      }
      if (r.read === 'state'){
        r._plain = await page.locator('#stateDisplay').evaluate(el => el.dataset.plain ?? el.textContent);
        r._tex = await page.evaluate(p => window.QC.Render.toKatex(p), r._plain);
        expect(r._plain, `${ex.id}/${r.label}: empty state`).toBeTruthy();
        assertValidKatex(r._tex, `${ex.id}/${r.label}`);
      } else {
        const sel = r.read === 'status' ? '#statusLine' : r.read === 'bloch' ? '#blochValue' : '#auxOutput';
        r._out = (await page.locator(sel).evaluate(el => el.textContent)).trim();
        expect(r._out, `${ex.id}/${r.label}: empty output`).toBeTruthy();
      }
    }
  }
  writeFileSync(DOC_PATH, renderManual(examples));
});

test('manual.html: vendored KaTeX renders offline (no degradation)', async ({ page }) => {
  await page.goto(DOC);
  expect(await page.evaluate(() => typeof window.katex)).toBe('object');
  const kets = await page.locator('.ket').count();
  const katex = await page.locator('.ket .katex').count();
  expect(kets).toBeGreaterThan(40);
  expect(katex).toBe(kets);
});

test('manual.html: structure (Part I reference + Part II cookbook 21 + Part III algorithms 9, links)', async ({ page }) => {
  await page.goto(DOC);
  // Part I — reference (static EN sections)
  await expect(page.locator('#part-reference')).toBeVisible();
  await expect(page.locator('#gates')).toBeVisible();       // §6 Gates
  await expect(page.locator('#exactness')).toBeVisible();   // §12 Exactness & conventions (v13: calc mode §10 removed)
  // Part II — cookbook (v21: 4 algorithm cards moved to Part III as E1–E5 + advanced renumbered A1–A9; 25 − 4 = 21)
  await expect(page.locator('#part-cookbook')).toBeVisible();
  expect(await page.locator('.ex').count()).toBe(30);          // 21 cookbook + 9 algorithm cards (v23: +E6,E7,E8,E10; E9 deferred)
  expect(await page.locator('article.algo').count()).toBe(9);  // Part III (v23: E1–E8 + E10)
  expect(await page.locator('.ex:not(.algo)').count()).toBe(21);
  await expect(page.locator('#tier-basic')).toBeVisible();
  await expect(page.locator('#tier-intermediate')).toBeVisible();
  await expect(page.locator('#tier-advanced')).toBeVisible();
  // Part III — classic algorithms (v21: E1–E5; v23: + E6,E7,E8,E10 — E9 Quantum counting deferred to next cycle)
  await expect(page.locator('#part-algorithms')).toBeVisible();
  for (const id of ['E1','E2','E3','E4','E5','E6','E7','E8','E10']) await expect(page.locator(`#ex-${id}`)).toBeVisible();
  // back link goes to the calculator (the consolidated doc no longer links to a separate examples page)
  await expect(page.locator('a.back', { hasText: 'back to the calculator' })).toBeVisible();
  // v21: floating quick-nav (index + calc) is present and stays fixed while scrolling
  await expect(page.locator('.floatnav a[href="#toc"]')).toBeVisible();
  await expect(page.locator('.floatnav a[href="quantum_calc.html"]')).toBeVisible();
  await expect(page.locator('#toc')).toBeVisible();
});

test('screenshots: full cookbook + key cards', async ({ page }) => {
  await page.goto(DOC);
  await page.screenshot({ path: SHOT('cookbook'), fullPage: true });
  for (const id of ['B1','I1','A1','A3','A4','A7','A9','E1','E2','E4']){
    await page.locator(`#ex-${id}`).screenshot({ path: SHOT(id) });
  }
});
