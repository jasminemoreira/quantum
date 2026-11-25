// tests/v29.spec.js — cycle 29 (PLAY no manual). Contrato: specs/technical/architecture.md V(3).
// O manual (file://, como o leitor offline) abre a sobreposição, carrega o APP REAL num iframe e o
// app toca os steps via postMessage. Ritmo real só nos testes de ■; os demais usam window.qcPlayMs=0.
import { test, expect } from '@playwright/test';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { examples } from './examples-data.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOC = pathToFileURL(join(HERE, '..', 'manual.html')).href;
const APP = pathToFileURL(join(HERE, '..', 'quantum_calc.html')).href;
const TOTAL = examples.reduce((s, ex) => s + ex.results.length, 0);

test.describe.configure({ mode: 'serial', timeout: 300000 });

const overlay = (page) => page.locator('.play-ov');
const appFrame = (page) => page.frameLocator('.play-frame');
async function openBlock(page, exId, k, { fast = true } = {}){
  if (fast) await page.evaluate(() => { window.qcPlayMs = 0; });
  else await page.evaluate(() => { delete window.qcPlayMs; });
  await page.locator(`#ex-${exId} .res-block`).nth(k).locator('button.play').click();
}
const waitState = (page, s, timeout = 20000) =>
  expect(overlay(page)).toHaveAttribute('data-state', s, { timeout });
const readState = (page) => appFrame(page).locator('#stateDisplay').evaluate(el => el.dataset.plain ?? el.textContent);

test('v29-PW1 every result block with steps has a ▶ button', async ({ page }) => {
  await page.goto(DOC);
  await expect(page.locator('.res-block[data-steps] button.play')).toHaveCount(TOTAL);
});

test('v29-PW2 FIDELITY: playing each example ends on the screen the manual documents (all results)', async ({ page }) => {
  await page.goto(DOC);
  let checked = 0, sampled = 0;
  for (const ex of examples){
    for (let k = 0; k < ex.results.length; k++){
      const r = ex.results[k];
      const blk = page.locator(`#ex-${ex.id} .res-block`).nth(k);
      await openBlock(page, ex.id, k);
      await waitState(page, 'done');
      const random = r.steps.some(s => /measure|rand/.test(s));
      let got, want;
      if (r.read === 'state'){
        want = await blk.locator('.ket').getAttribute('data-dirac');
        got = (await readState(page)).trim();
      } else {
        const sel = r.read === 'status' ? '#statusLine' : r.read === 'bloch' ? '#blochValue' : '#auxOutput';
        want = await blk.locator('pre.out').getAttribute('data-out');
        got = (await appFrame(page).locator(sel).evaluate(el => el.textContent)).trim();
      }
      if (random) sampled++; else { expect(got, `${ex.id}#${k} ${r.label}`).toBe(want); checked++; }
      await page.keyboard.press('Escape');
      await expect(overlay(page)).toBeHidden();
    }
  }
  expect(checked + sampled).toBe(TOTAL);
});

test('v29-PW3 chips are cloned into the bar and the running group lights up', async ({ page }) => {
  await page.goto(DOC);
  await openBlock(page, 'I1', 0, { fast: false });
  await waitState(page, 'playing');
  const n = await page.locator('#ex-I1 .res-block').first().locator('.steps code').count();
  await expect(page.locator('.play-chips code')).toHaveCount(n);
  await expect(page.locator('.play-chips code.lit')).toHaveCount(1, { timeout: 5000 });
  await expect(appFrame(page).locator('[data-action].demo-hit')).toHaveCount(1, { timeout: 5000 });   // A-5: the key lights up during the demo
  await waitState(page, 'done', 30000);
  await expect(page.locator('.play-chips code.lit')).toHaveCount(0);
});

test('v29-PW4 ■ stops mid-demo, unlocks the app, ↻ replays from a clean state', async ({ page }) => {
  await page.goto(DOC);
  const longest = examples.flatMap(ex => ex.results.map((r, k) => ({ id: ex.id, k, n: r.steps.length, r })))
    .filter(x => x.r.read === 'state' && !x.r.steps.some(s => /measure|rand/.test(s)))
    .sort((a, b) => b.n - a.n)[0];
  await openBlock(page, longest.id, longest.k, { fast: false });
  await waitState(page, 'playing');
  await expect(page.locator('.play-chips code.lit')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.play-tg')).toHaveText('■');
  await page.locator('.play-tg').click();
  await waitState(page, 'stopped', 5000);
  await expect(page.locator('.play-tg')).toHaveText('↻');
  await expect(appFrame(page).locator('body')).not.toHaveClass(/demo-active/);
  const partial = await readState(page);
  const want = await page.locator(`#ex-${longest.id} .res-block`).nth(longest.k).locator('.ket').getAttribute('data-dirac');
  expect(partial).not.toBe(want);                                      // parou ANTES do fim
  await page.evaluate(() => { window.qcPlayMs = 0; });
  await page.locator('.play-tg').click();                              // ↻ = recarrega e toca do zero
  await waitState(page, 'done');
  expect((await readState(page)).trim()).toBe(want);
});

test('v29-PW5 after the demo the keypad is interactive (continue from the final state)', async ({ page }) => {
  await page.goto(DOC);
  await openBlock(page, 'I1', 0);
  await waitState(page, 'done');
  const before = await readState(page);
  await appFrame(page).locator('[data-action="key:0"]').first().click();
  await appFrame(page).locator('[data-action="gate:X"]').first().click();
  await expect.poll(() => readState(page)).not.toBe(before);
});

test('v29-PW6 physical keyboard is blocked during the demo', async ({ page }) => {
  await page.goto(DOC);
  await openBlock(page, 'I1', 0, { fast: false });
  await waitState(page, 'playing');
  const prevented = await page.frame({ url: /quantum_calc\.html/ }).evaluate(() => {
    const ev = new KeyboardEvent('keydown', { key: 'h', bubbles: true, cancelable: true });
    document.body.dispatchEvent(ev); return ev.defaultPrevented;
  });
  expect(prevented).toBe(true);
});

test('v29-PW7 × closes from any state: overlay hidden, iframe gone, scroll unlocked, focus back on ▶', async ({ page }) => {
  await page.goto(DOC);
  await openBlock(page, 'B2', 0, { fast: false });
  await waitState(page, 'playing');
  await expect(page.locator('html')).toHaveClass(/play-open/);
  await page.locator('.play-x').click();
  await expect(overlay(page)).toBeHidden();
  await expect(page.locator('.play-frame')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveClass(/play-open/);
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('play'));
  expect(focused).toBe(true);
});

test('v29-PW8 embedded app hides "?"; the stand-alone app is unchanged (no demo mode)', async ({ page }) => {
  await page.goto(DOC);
  await openBlock(page, 'B1', 0);
  await waitState(page, 'done');
  await expect(appFrame(page).locator('a[href="manual.html"]')).toBeHidden();
  await page.goto(APP);
  await expect(page.locator('body')).not.toHaveClass(/qc-embedded/);
  await expect(page.locator('a[href="manual.html"]')).toBeVisible();
});

test('v29-PW9 stale messages are ignored: only the current iframe + runId drive the overlay', async ({ page }) => {
  await page.goto(DOC);
  await openBlock(page, 'I1', 0, { fast: false });
  await waitState(page, 'playing');
  // a message posted by the MANUAL window itself (not the iframe) must not light chips or finish
  await page.evaluate(() => { window.postMessage({ type: 'qc-done', runId: 999, stopped: false }, '*');
                              window.postMessage({ type: 'qc-step', runId: 1, i: 0, g: 5 }, '*'); });
  await page.waitForTimeout(200);
  await expect(overlay(page)).toHaveAttribute('data-state', 'playing');
});

test('v29-PW10 slow load: after 5 s the fallback link shows, and playback still starts when the app arrives', async ({ page }) => {
  const BASE = 'http://localhost:8123';
  let release; const gate = new Promise(r => { release = r; });
  await page.route('**/quantum_calc.html*', async (route) => { await gate; await route.continue(); });
  await page.goto(`${BASE}/manual.html`);
  await page.evaluate(() => { window.qcPlayMs = 0; });
  await page.locator('#ex-I1 .res-block').first().locator('button.play').click();
  await waitState(page, 'loading');
  await expect(page.locator('.play-note')).toBeVisible({ timeout: 8000 });
  release();
  await waitState(page, 'done', 20000);
  await expect(page.locator('.play-note')).toBeHidden();
});

test('v29-PW12 manual never overflows a phone width (fixed index/calc buttons stay on screen, no sideways drag)', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(DOC);
  await page.waitForTimeout(300);
  const { vw, sw } = await page.evaluate(() => ({ vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
  const nav = await page.locator('.floatnav').boundingBox();
  expect(nav.x + nav.width).toBeLessThanOrEqual(vw);
  await ctx.close();
});

test('v29-PW11 mobile viewport: sheet fills the screen and the app fits the iframe', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(DOC);
  await openBlock(page, 'I1', 0);
  await waitState(page, 'done');
  const sheet = await page.locator('.play-sheet').boundingBox();
  expect(Math.round(sheet.width)).toBe(390);
  const fr = await page.locator('.play-frame').boundingBox();
  const appBox = await appFrame(page).locator('#app').boundingBox();
  expect(appBox.width).toBeLessThanOrEqual(fr.width + 1);
  await page.screenshot({ path: join(HERE, 'shot-v29-mobile.png') });
  await ctx.close();
});
