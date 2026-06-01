// v22 — teclas de INPUT (composição de estado de 1 qubit): |T⟩ EXATO + rand (Haar ≈) + amp (≈).
// Prep é o núcleo PURO (sem DOM); a UI só roteia input:T/rand/amp e abre o overlay de amp.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
function loadQC(){
  const html = readFileSync(join(HERE, '..', 'quantum_calc.html'), 'utf8');
  const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const stubEl = () => ({ textContent:'', style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){return false;} },
                          appendChild(){}, addEventListener(){}, dataset:{}, disabled:false });
  const document = { addEventListener(){}, getElementById:stubEl, querySelector:()=>null,
                     querySelectorAll:()=>[], createElement:stubEl, createTextNode:(t)=>({textContent:String(t)}) };
  return new Function('window','document', `${script}\n;return window.QC;`)({}, document);
}
const QC = loadQC();
const { Algebra, Prep } = QC;
const cOf = (a) => Algebra.toComplex(a);
const close = (a, b, t=1e-9) => Math.abs(a - b) < t;

// ---- |T⟩ EXATO (macro H·T) ----
test('v22 |T⟩ = (|0⟩ + e^{iπ/4}|1⟩)/√2, EXATO (badge OFF)', () => {
  const s = Prep.tState();
  assert.equal(s.n, 1, 'estado de 1 qubit');
  const a0 = cOf(s.amps.get(0)), a1 = cOf(s.amps.get(1));
  assert.ok(close(a0.re, Math.SQRT1_2) && close(a0.im, 0), '⟨0|T⟩ = 1/√2');
  // e^{iπ/4}/√2 = (cos45 + i sin45)/√2 = 1/2 + i/2
  assert.ok(close(a1.re, 0.5) && close(a1.im, 0.5), '⟨1|T⟩ = 1/2 + i/2');
  assert.ok([...s.amps.values()].every(a => a.ex), 'amplitudes EXATAS ℤ[ζ₁₆] → sem ≈');
});

test('v22 |T⟩ normalizado (‖ψ‖²=1)', () => {
  const s = Prep.tState();
  let n2 = 0; for (const a of s.amps.values()){ const c = cOf(a); n2 += c.re*c.re + c.im*c.im; }
  assert.ok(close(n2, 1), '‖|T⟩‖² = 1');
});

// ---- rand: Haar-uniforme na esfera de Bloch (numérico ≈) ----
test('v22 rand gera estado normalizado (‖ψ‖²=1) p/ vários (u,v)', () => {
  for (const [u, v] of [[0,0],[0.5,0.5],[0.25,0.9],[0.999,0.01],[1e-9,0.5]]){
    const amps = Prep.randAmps(u, v);
    const n2 = amps.reduce((acc,[,re,im]) => acc + re*re + im*im, 0);
    assert.ok(close(n2, 1), `‖rand(${u},${v})‖² = 1`);
  }
});

test('v22 rand: amostragem Haar (θ=acos(1−2u)) — u=0 → polo |0⟩, u=1 → polo |1⟩', () => {
  const top = Prep.randAmps(0, 0);     // θ=acos(1)=0 → cos0=1 → |0⟩
  assert.ok(close(top[0][1], 1) && close(top[1][1], 0) && close(top[1][2], 0), 'u=0 → |0⟩');
  const bot = Prep.randAmps(1, 0);     // θ=acos(−1)=π → cos(π/2)=0, sin(π/2)=1 → |1⟩ (fase e^{i·0})
  assert.ok(close(bot[0][1], 0) && close(bot[1][1], 1), 'u=1 → |1⟩');
});

test('v22 rand: φ aplica fase e^{iφ} em |1⟩ (u=0.5 → equador)', () => {
  const eq = Prep.randAmps(0.5, 0.25);   // θ=acos(0)=π/2 → cos45=sin45=1/√2 ; φ=2π·0.25=π/2 → e^{iπ/2}=i
  assert.ok(close(eq[0][1], Math.SQRT1_2), 'α=1/√2');
  assert.ok(close(eq[1][1], 0, 1e-9) && close(eq[1][2], Math.SQRT1_2), 'β=i/√2 (fase π/2)');
});

// ---- amp: amplitudes diretas normalizadas (numérico ≈) ----
test('v22 amp: normaliza α=1,β=1 (a+bi) → (|0⟩+|1⟩)/√2', () => {
  const amps = Prep.normAmps(1, 0, 1, 0);
  assert.ok(close(amps[0][1], Math.SQRT1_2) && close(amps[1][1], Math.SQRT1_2), 'ambos 1/√2');
  assert.ok(close(amps[0][2], 0) && close(amps[1][2], 0), 'partes imag = 0');
});

test('v22 amp: já normalizado preserva (α=1/√2, β=i/√2)', () => {
  const r2 = Math.SQRT1_2;
  const amps = Prep.normAmps(r2, 0, 0, r2);
  assert.ok(close(amps[0][1], r2) && close(amps[1][2], r2));
  const n2 = amps.reduce((acc,[,re,im]) => acc + re*re + im*im, 0);
  assert.ok(close(n2, 1));
});

test('v22 amp: vetor nulo (α=β=0) → null (estado inválido)', () => {
  assert.equal(Prep.normAmps(0, 0, 0, 0), null);
});

// v22-14: teste de polarToRect removido junto com o helper (morto). A entrada polar/exp do amp é
// validada em v22.spec.js (β=exp(i·π/2)→i/√2), pelo caminho real (Calc.evaluate complexo).

test('v22 amp: normalização independe da escala (3,4 → 3/5,4/5)', () => {
  const amps = Prep.normAmps(3, 0, 4, 0);
  assert.ok(close(amps[0][1], 0.6) && close(amps[1][1], 0.8), '(3,4)/5');
});
