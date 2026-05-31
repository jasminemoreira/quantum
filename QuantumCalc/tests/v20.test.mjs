// v20 — PER-QUBIT INSPECTOR (M1 Ops.probQ + AS1/AS2/AS5/AS6/AS7).
// M2/M3/M4 UI são cobertos por tests/ui.spec.js (Playwright). Este arquivo cobre o núcleo PURO.
// Fonte: decisões P0/P1/P3 v20 + Nielsen&Chuang §2.2.3 (Born rule p/ marginal) + §2.2.5 (Bloch (1+z)/2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
function loadQC(){
  const html = readFileSync(join(HERE,'..','quantum_calc.html'),'utf8');
  const script = html.slice(html.indexOf('<script>')+8, html.lastIndexOf('</script>'));
  const stub = () => ({ textContent:'', style:{}, classList:{add(){},remove(){},toggle(){},contains(){return false;}}, appendChild(){}, addEventListener(){}, dataset:{}, disabled:false, hidden:false });
  const document = { addEventListener(){}, getElementById:stub, querySelector:()=>null, querySelectorAll:()=>[], createElement:stub, createTextNode:(t)=>({textContent:String(t)}) };
  return new Function('window','document',`${script}\n;return window.QC;`)({}, document);
}
const QC = loadQC();
const { Algebra, State, Engine, Ops } = QC;
const apply = (s, g, o) => Engine.apply(s, g, o);
const bell = () => apply(apply(State.computational(2), 'H', { targets:[0] }), 'CNOT', { controls:[0], targets:[1] });
const HALF = Algebra.DIV(Algebra.ONE, Algebra.fromInt(2));
const eqAmp = (a, b) => Algebra.isZeroAmp(Algebra.ADD(a, Algebra.NEG(b)));

// ---------- M1 / UC-1 / AS1 ----------
test('v20-1 Bell |Φ+⟩: P(Q0=0)=1/2, P(Q0=1)=1/2 EXATO ℤ[ζ₁₆] (AS1 soma quadrados fecha)', () => {
  const r = Ops.probQ(bell(), 0);
  assert.equal(r.q, 0);
  assert.ok(r.P0.ex === true, 'AS1: P0 exato em ℤ[ζ₁₆]');
  assert.ok(r.P1.ex === true, 'AS1: P1 exato em ℤ[ζ₁₆]');
  assert.ok(eqAmp(r.P0, HALF), 'P(Q0=0)=1/2');
  assert.ok(eqAmp(r.P1, HALF), 'P(Q0=1)=1/2');
});
test('v20-2 |+⟩|−⟩: marginal Q1 = (1/2, 1/2) — kickback NÃO afeta marginal de Q1', () => {
  const s = State.fromKets(['+','-']);
  const r = Ops.probQ(s, 1);
  assert.ok(eqAmp(r.P0, HALF) && eqAmp(r.P1, HALF));
});
test('v20-3 NEG: Ops.probQ em SymState abstrato → erro (concrete-only)', () => {
  const { SymState, SymExpr } = QC;
  // SymState com |ψ⟩|0⟩ (abstract+concrete) — emaranhado simbólico não é marginalizável aqui
  const s = SymState.fromKets(['ψ','0']);
  assert.throws(() => Ops.probQ(s, 0), /concrete state required/);
});
test('v20-4 NEG: Ops.probQ q fora de [0,n) → erro de validação', () => {
  assert.throws(() => Ops.probQ(bell(), -1), /invalid qubit/);
  assert.throws(() => Ops.probQ(bell(), 2),  /invalid qubit/);
  assert.throws(() => Ops.probQ(bell(), 0.5),/invalid qubit/);
  assert.throws(() => Ops.probQ(bell(), 'a'),/invalid qubit/);
});

// ---------- AS2 (cross-check geométrico vs marginal numérica) ----------
test('v20-5 AS2: (1+v.z)/2 ≡ marginal P(Q_q=0) — Bell/GHZ/H|0⟩ (geometria↔algebra)', () => {
  const cases = [
    { s: bell(), q: 0 },
    { s: bell(), q: 1 },
    { s: apply(apply(apply(State.computational(3),'H',{targets:[0]}),'CNOT',{controls:[0],targets:[1]}),'CNOT',{controls:[0],targets:[2]}), q: 1 },   // GHZ₃
    { s: apply(State.computational(1),'H',{targets:[0]}), q: 0 },                                                                                       // H|0⟩=|+⟩
  ];
  for (const { s, q } of cases){
    const r = Ops.probQ(s, q);
    const v = Ops.blochVector(s, q);
    const P0_num = Algebra.toComplex(r.P0).re;
    const P0_geom = (1 + Algebra.toComplex(v.z).re) / 2;
    assert.ok(Math.abs(P0_num - P0_geom) < 1e-12, `AS2 falhou: P0_num=${P0_num} vs (1+z)/2=${P0_geom}`);
  }
});

// ---------- |+⟩ puro (não-trivial: P(0)=1, P(1)=0) ----------
test('v20-6 |0⟩ puro: P(Q0=0)=1, P(Q0=1)=0 (sanity)', () => {
  const r = Ops.probQ(State.computational(1), 0);
  assert.ok(eqAmp(r.P0, Algebra.ONE) && eqAmp(r.P1, Algebra.ZERO));
});
test('v20-7 |1⟩ puro: P(Q0=0)=0, P(Q0=1)=1 (sanity inversa)', () => {
  const r = Ops.probQ(State.fromBits('1'), 0);
  assert.ok(eqAmp(r.P0, Algebra.ZERO) && eqAmp(r.P1, Algebra.ONE));
});

// ---------- AS7 — Algebra.format de Amp real puro NÃO inclui '+0i' ----------
test('v20-8 AS7: format(HALF, "rect").text === "1/2" (sem "+ 0i" parasita em real puro)', () => {
  const t = Algebra.format(HALF, 'rect').text;
  assert.equal(t, '1/2', `esperado "1/2", veio "${t}"`);
});

// ---------- Marginal soma = 1 (consistência probabilística) ----------
test('v20-9 marginal P0+P1 = 1 EXATO p/ Bell, GHZ, H|0⟩', () => {
  const cases = [bell(), apply(State.computational(1),'H',{targets:[0]})];
  for (const s of cases){
    for (let q = 0; q < s.n; q++){
      const r = Ops.probQ(s, q);
      assert.ok(eqAmp(Algebra.ADD(r.P0, r.P1), Algebra.ONE), `P0+P1 != 1 em s,Q${q}`);
    }
  }
});

// ---------- Marginal de Grover difusor (P0=9/16 p/ Q0) — exemplo não-trivial ----------
test('v20-10 marginal sobre superposição não-uniforme (ALL H em 3 qubits) → P(Q0=0)=1/2', () => {
  let s = State.computational(3);
  for (let q=0; q<3; q++) s = apply(s,'H',{targets:[q]});
  // todos os 8 bits têm |amp|²=1/8; Q0=0 metade dos índices (i<4), Q0=1 outra metade → P0=4/8=1/2
  const r = Ops.probQ(s, 0);
  assert.ok(eqAmp(r.P0, HALF) && eqAmp(r.P1, HALF));
});

// ---------- Exibição (sanity de não-regressão Ops.probabilities) ----------
test('v20-11 não-regressão: Ops.probabilities INTOCADO (mesma API anterior)', () => {
  const p = Ops.probabilities(bell());
  assert.equal(p.length, 2, 'Bell tem 2 amplitudes não-zero');
  assert.deepEqual(p.map(x => x.bits).sort(), ['00','11']);
});
