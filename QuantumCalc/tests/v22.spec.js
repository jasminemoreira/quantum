// v22 (Phase 6) — teclas de INPUT (pág.2): |T⟩ EXATO + rand (Haar ≈) + amp (≈, overlay)
// + atalhos de ângulo (π/8 π/4 π/2 que SUBSTITUEM o buffer na gaveta de ângulo).
import { test, expect } from '@playwright/test';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const URL = pathToFileURL(join(HERE, '..', 'quantum_calc.html')).href;
const act = (p, a) => p.locator(`[data-action="${a}"]`).first().click();
const dirac = (p) => p.locator('#stateDisplay').evaluate(el => el.dataset.plain ?? el.textContent);

test.beforeEach(async ({ page }) => { await page.goto(URL); });

test('v22/v26 bloco kets (pág.1) expõe o input (|T⟩ / rand / amp)', async ({ page }) => {
  await expect(page.locator('[data-action="input:T"]')).toBeVisible();
  await expect(page.locator('[data-action="input:rand"]')).toBeVisible();
  await expect(page.locator('[data-action="input:amp"]')).toBeVisible();
});

test('v22 |T⟩ = (|0⟩ + e^{iπ/4}|1⟩)/√2 EXATO (badge ≈ OFF)', async ({ page }) => {
  await act(page, 'input:T');
  const d = await dirac(page);
  expect(d).toContain('|0⟩');
  expect(d).toContain('|1⟩');
  expect(d).toMatch(/π\/4|e\^/);                       // fase T presente
  await expect(page.locator('#approxBadge')).toBeHidden();   // EXATO → sem ≈
  // 1 qubit fresco
  await expect(page.locator('#selection')).toContainText('ALL');
});

test('v22 rand → estado fresco de 1 qubit, badge ≈ ON', async ({ page }) => {
  await act(page, 'input:rand');
  await expect(page.locator('#approxBadge')).toBeVisible();   // numérico → ≈
  const n = await page.evaluate(() => window.QC.History.current().n);
  expect(n).toBe(1);
  // normalizado (‖ψ‖²≈1)
  const n2 = await page.evaluate(() => {
    const s = window.QC.History.current(); let acc = 0;
    for (const a of s.amps.values()){ const c = window.QC.Algebra.toComplex(a); acc += c.re*c.re + c.im*c.im; }
    return acc;
  });
  expect(Math.abs(n2 - 1)).toBeLessThan(1e-9);
});

// entrada de amplitude: 2 EXPRESSÕES COMPLEXAS (α, β) digitadas pelo PAD CIENTÍFICO do app.
// exprs = ['1','i'] → digita a expr de α, '=', a expr de β, '='. Cada char vira data-action calc:<char>.
async function ampEnter(page, exprs){
  await act(page, 'input:amp');
  await expect(page.locator('#angleSheet')).toBeVisible();     // reusa a gaveta (slide), mas com pad CIENTÍFICO
  for (const e of exprs){
    for (const ch of String(e)) await act(page, 'calc:' + ch);
    await act(page, 'eval');
  }
}

test('v22 amp: pad CIENTÍFICO próprio (√ sin cos exp e i) — sem <input> nativo', async ({ page }) => {
  await act(page, 'input:amp');
  await expect(page.locator('#angleSheet')).toBeVisible();
  await expect(page.locator('input')).toHaveCount(0);          // NENHUM campo de texto nativo
  for (const k of ['calc:√','calc:sin','calc:cos','calc:exp','calc:1/√2','calc:i'])
    await expect(page.locator(`[data-action="${k}"]`)).toBeVisible();
  await expect(page.locator('[data-action="calc:e"]')).toHaveCount(0);   // v22-13: "e" removido (trocado por 1/√2)
  await expect(page.locator('#statusLine')).toContainText('amp');
  await expect(page.locator('#statusLine')).toContainText('α |0⟩');
});

test('v22 amp: α=2,β=1 (expr) → 2/√5,1/√5 (≈, fora de ℤ[ζ₁₆])', async ({ page }) => {
  await ampEnter(page, ['2', '1']);
  await expect(page.locator('#angleSheet')).toHaveCount(0);    // gaveta fechou (auto-return)
  await expect(page.locator('#approxBadge')).toBeVisible();    // 2/√5 não é representável → ≈
  const amps = await page.evaluate(() => {
    const s = window.QC.History.current();
    return [0,1].map(i => { const c = window.QC.Algebra.toComplex(s.amps.get(i)); return [c.re, c.im]; });
  });
  expect(Math.abs(amps[0][0] - 2/Math.sqrt(5))).toBeLessThan(1e-9);
  expect(Math.abs(amps[1][0] - 1/Math.sqrt(5))).toBeLessThan(1e-9);
});

test('v22 amp: α=1,β=1 → 1/√2 EXATO (sem ≈ — contrato honesto)', async ({ page }) => {
  await ampEnter(page, ['1', '1']);
  await expect(page.locator('#approxBadge')).toBeHidden();     // 1/√2 ∈ ℤ[ζ₁₆] → display exato → badge off
  expect(await dirac(page)).toContain('1/√2');
});

test('v22 amp: α=1, β=i → (|0⟩+i|1⟩)/√2 (entrada complexa direta)', async ({ page }) => {
  await ampEnter(page, ['1', 'i']);
  const amps = await page.evaluate(() => {
    const s = window.QC.History.current();
    return [0,1].map(i => { const c = window.QC.Algebra.toComplex(s.amps.get(i)); return [c.re, c.im]; });
  });
  expect(Math.abs(amps[0][0] - Math.SQRT1_2)).toBeLessThan(1e-9);   // α = 1/√2 real
  expect(Math.abs(amps[1][1] - Math.SQRT1_2)).toBeLessThan(1e-9);   // β = i/√2
  expect(Math.abs(amps[1][0])).toBeLessThan(1e-9);
});

test('v22 amp: fase via exp(i·θ) — α=1, β=exp(i·π/2) → i/√2', async ({ page }) => {
  // β = exp( i × π / 2 ) = i. exp insere "exp(" ; π via calc:π.
  await act(page, 'input:amp');
  await act(page, 'calc:1'); await act(page, 'eval');                 // α = 1
  for (const k of ['calc:exp','calc:i','calc:*','calc:π','calc:/','calc:2','calc:)']) await act(page, k);
  await act(page, 'eval');                                            // β = exp(i*π/2) = i
  const amps = await page.evaluate(() => {
    const s = window.QC.History.current();
    return [0,1].map(i => { const c = window.QC.Algebra.toComplex(s.amps.get(i)); return [c.re, c.im]; });
  });
  expect(Math.abs(amps[1][1] - Math.SQRT1_2)).toBeLessThan(1e-9);     // β imaginário puro = i/√2
  expect(Math.abs(amps[1][0])).toBeLessThan(1e-9);
});

test('v22-13 amp: tecla 1/√2 — α=1/√2, β=1/√2 → |+⟩ EXATO (sem ≈)', async ({ page }) => {
  await act(page, 'input:amp');
  await act(page, 'calc:1/√2'); await act(page, 'eval');              // α = 1/√2
  await act(page, 'calc:1/√2'); await act(page, 'eval');              // β = 1/√2
  await expect(page.locator('#approxBadge')).toBeHidden();            // 1/√2 ∈ ℤ[ζ₁₆] → exato
  expect(await dirac(page)).toContain('1/√2');
});

test('v22 amp: α=β=0 (vetor nulo) → erro, sequência reinicia, gaveta permanece', async ({ page }) => {
  await ampEnter(page, ['0', '0']);
  await expect(page.locator('#statusLine')).toContainText('zero');
  await expect(page.locator('#angleSheet')).toBeVisible();     // não fecha
  expect(await dirac(page)).toBe('⌶');                         // buffer reiniciado (idx 0)
});

test('v22 amp: ESC cancela sem mudar o estado', async ({ page }) => {
  await act(page, 'input:amp');
  await page.keyboard.press('Escape');
  await expect(page.locator('#angleSheet')).toHaveCount(0);
  expect(await dirac(page)).toBe('|0⟩');                       // estado intocado
});

test('v22 atalho de ângulo SUBSTITUI o buffer (π/4) na gaveta de ângulo', async ({ page }) => {
  await act(page, 'gate:Rz');                                  // abre a gaveta de ângulo (Rz tem parâmetro)
  await expect(page.locator('#angleSheet')).toBeVisible();
  await act(page, 'quick:π/4');
  expect(await dirac(page)).toBe('π/4');                       // buffer = π/4 (substituiu, não inseriu)
  // digita algo e troca por π/2 → SUBSTITUI (não vira "π/4π/2")
  await act(page, 'quick:π/2');
  expect(await dirac(page)).toBe('π/2');
  await expect(page.locator('[data-action="quick:π/8"]')).toBeVisible();
});

// v22-8: ρ_A e S(ρ) leem os qubits da gramática de operandos (n Q), sem prompt nativo.
async function bell(p){   // |Φ+⟩ = (1/√2)(|00⟩+|11⟩)
  await act(p,'key:2'); await act(p,'key:Q'); await act(p,'key:SET');
  await act(p,'key:0'); await act(p,'key:Q'); await act(p,'gate:H');
  await act(p,'key:0'); await act(p,'key:CTRL'); await act(p,'key:1'); await act(p,'key:Q'); await act(p,'gate:X');   // v25: CTRL X = CNOT
}

test('v22-8 ρ_A via n Q (0 Q ρ_A) — sem prompt nativo', async ({ page }) => {
  await bell(page);
  await act(page,'key:0'); await act(page,'key:Q');     // KEEP Q0
  await act(page,'key:2nd'); await act(page,'op:partial');
  await expect(page.locator('#auxOutput')).toContainText('ρ_A (keeping Q0)');
});

test('v22-8 S(ρ) via n Q: Bell, A=Q0 → S = 1 bit', async ({ page }) => {
  await bell(page);
  await act(page,'key:0'); await act(page,'key:Q');
  await act(page,'key:2nd'); await act(page,'op:vonneumann');
  await expect(page.locator('#auxOutput')).toContainText('S = 1');
});

test('v22-8 ρ_A sem seleção → erro guiado (n Q), gaveta nativa nunca abre', async ({ page }) => {
  await bell(page);
  await act(page,'key:2nd'); await act(page,'op:partial');
  await expect(page.locator('#statusLine')).toContainText('KEEP');
});

// v22-15: preset roda nos qubits CONCRETOS de um estado simbólico (|ψ⟩⊗|0⟩|0⟩ → Bell em Q1,Q2).
async function psi00(p){   // |ψ⟩|0⟩|0⟩ (Q0 abstrato, Q1/Q2 concretos)
  await act(p,'ket:ψ'); await act(p,'ket:0'); await act(p,'ket:0'); await act(p,'key:SET');
}
test('v22-15 preset Bell nos qubits concretos de |ψ⟩|0⟩|0⟩ → |ψ⟩⊗(|00⟩+|11⟩)/√2', async ({ page }) => {
  await psi00(page);
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'key:2'); await act(page,'key:Q');   // 1 Q 2 Q
  await act(page,'preset:Bell');
  const d = await dirac(page);
  expect(d).toContain('ψ');
  expect(d.replace(/\s/g,'')).toContain('(1/√2)|00⟩+(1/√2)|11⟩');
});

test('v22-15 preset recusa quando o alvo é o slot abstrato |ψ⟩ (0 Q 1 Q Bell)', async ({ page }) => {
  await psi00(page);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'key:1'); await act(page,'key:Q');   // Q0 = |ψ⟩
  await act(page,'preset:Bell');
  await expect(page.locator('#statusLine')).toContainText('abstract');
});
