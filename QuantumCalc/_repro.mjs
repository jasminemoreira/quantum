import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const URL = pathToFileURL(join(process.cwd(), '..', 'quantum_calc.html')).href;
const b = await chromium.launch(); const p = await b.newPage();
await p.goto(URL);
const act = (a) => p.locator(`[data-action="${a}"]`).first().click();
const plain = () => p.locator('#stateDisplay').evaluate(el => el.dataset.plain);
const status = () => p.locator('#statusLine').textContent();
// |1⟩
await act('key:1'); await act('key:SET');
console.log('inicial:', await plain());
// P(π) em Q0
await act('key:0'); await act('key:Q'); await act('gate:P');
console.log('prompt P#1:', (await status()).slice(0,60));
await act('calc:π'); await act('eval');
console.log('após P(π):', await plain());
// P(π/2) em Q0 — DEVE pedir novo ângulo
await act('key:0'); await act('key:Q'); await act('gate:P');
console.log('prompt P#2 (calcBuf?):', (await status()).slice(0,60));
const dispDuranteEntrada = await plain();
console.log('display durante entrada #2 (mostra buffer?):', dispDuranteEntrada);
await act('calc:π'); await act('calc:/'); await act('calc:2'); await act('eval');
console.log('após P(π/2):', await plain(), '  (esperado: −i|1⟩; bug→|1⟩)');
await b.close();
