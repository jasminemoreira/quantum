// tests/pwa.spec.js — Phase 6 (v10): PWA App Shell over http (Playwright webServer).
// Validates: (1) manifest.webmanifest parses and has the required fields; (2) the service worker
// registers (guarded → only http, not file://), reaches 'activated', and serves the shell offline on
// a second load (network cut). specs/technical/22 §Frente 4 / §Resolução Fase 3.
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8123';

test.describe.configure({ mode: 'serial' });

test('manifest.webmanifest is valid and has the required fields', async ({ request }) => {
  const res = await request.get(`${BASE}/manifest.webmanifest`);
  expect(res.ok()).toBeTruthy();
  const m = await res.json();
  expect(m.name).toBe('Quantum Calculator');
  expect(m.short_name).toBe('QCalc');
  expect(m.start_url).toBe('./quantum_calc.html');
  expect(m.scope).toBe('./');
  expect(m.display).toBe('standalone');
  expect(Array.isArray(m.icons)).toBeTruthy();
  expect(m.icons.length).toBeGreaterThan(0);
  expect(m.icons[0].src).toContain('icon');
  expect(m.icons[0].purpose).toContain('maskable');
});

test('service worker registers, activates, and serves offline on a second load', async ({ page, context }) => {
  await page.goto(`${BASE}/quantum_calc.html`);
  // SW registers (location.protocol !== 'file:'). `ready` can resolve while the worker is still
  // 'activating', so wait for the active worker to reach 'activated' via statechange.
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    const w = reg.active || reg.waiting || reg.installing;
    if (w && w.state !== 'activated') {
      await new Promise((res) => {
        w.addEventListener('statechange', () => w.state === 'activated' && res());
        if (w.state === 'activated') res();
      });
    }
  });
  // skipWaiting + clients.claim → the worker controls this page (throws if it never activates/claims).
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  // Cut the network and reload — the precached App Shell must still render.
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Quantum Calculator');
  await expect(page.locator('#stateDisplay')).toContainText('0');   // initial |0⟩ (KaTeX or plain)
  await context.setOffline(false);
});
