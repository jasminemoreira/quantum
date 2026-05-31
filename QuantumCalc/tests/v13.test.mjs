// tests/v13.test.mjs — Phase 6 (v13): symbolic memory + tensor (FRENTE A).
// SymState.tensor / fromConcrete / disjointness guard. Source: specs/technical/28-v13-seed.md.
// MATH-BEFORE-DIDACTICS gate (lesson v12-L5): the symbolic ⊗ must be algebraically correct.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
function loadQC(){
  const html = readFileSync(join(HERE,'..','quantum_calc.html'),'utf8');
  const script = html.slice(html.indexOf('<script>')+8, html.lastIndexOf('</script>'));
  const stub = () => ({ textContent:'', style:{}, classList:{add(){},remove(){},toggle(){},contains(){return false;}}, appendChild(){}, addEventListener(){}, dataset:{}, disabled:false });
  const document = { addEventListener(){}, getElementById:stub, querySelector:()=>null, querySelectorAll:()=>[], createElement:stub, createTextNode:(t)=>({textContent:String(t)}) };
  return new Function('window','document',`${script}\n;return window.QC;`)({}, document);
}
const QC = loadQC();
const { State, Ops, SymExpr, SymState, SymEngine, SymRules, Render } = QC;
const D = (s) => Render.diracSym(s, 'rect').replace(/−/g,'-');
const phase = (sym, c=1) => new SymState(['c'], [{ coef: SymExpr.phaseAtom({coefN:c,coefD:1,hasPi:false,sym}), slots:[c===1?'0':'1'] }]);

// ---- M16 SymState.fromConcrete (promote concrete → symbolic) ----
test('v13-1 fromConcrete(|01⟩) → |01⟩, layout all-concrete', () => {
  const s = SymState.fromConcrete(State.fromBits('01'));
  assert.equal(D(s), '|01⟩');
  assert.equal(s.layout.join(''), 'cc');
});
test('v13-2 fromConcrete(|+⟩) → (1/√2)|0⟩ + (1/√2)|1⟩ (exact, ℤ[ω])', () => {
  assert.equal(D(SymState.fromConcrete(State.fromKets(['+']))), '(1/√2)|0⟩ + (1/√2)|1⟩');
});
test('v13-3 fromConcrete drops zero amplitudes (|10⟩ = 1 term)', () => {
  const s = SymState.fromConcrete(State.fromBits('10'));
  assert.equal(s.terms.length, 1);
  assert.equal(D(s), '|10⟩');
});

// ---- M16 SymState.tensor (big-endian saved ⊗ current) ----
test('v13-4 |ψ⟩ ⊗ |φ⟩ → |ψ⟩⊗|φ⟩ (2 abstract qubits, big-endian)', () => {
  const t = SymState.fromKets(['ψ']).tensor(SymState.fromKets(['φ']));
  assert.equal(t.n, 2);
  assert.equal(t.layout.join(''), 'aa');
  assert.equal(D(t), '|ψ⟩⊗|φ⟩');
});
test('v13-5 mixed |ψ⟩ ⊗ concrete |1⟩ → |ψ⟩⊗|1⟩ (concrete promoted, ψ on the left)', () => {
  const t = SymState.fromKets(['ψ']).tensor(SymState.fromConcrete(State.fromBits('1')));
  assert.equal(t.layout.join(''), 'ac');
  assert.equal(D(t), '|ψ⟩⊗|1⟩');
});
test('v13-6 ANCHOR (T·H|ψ⟩) ⊗ |φ⟩ → TH|ψ⟩⊗|φ⟩', () => {
  let th = SymState.fromKets(['ψ']);
  th = SymEngine.apply(th, { gate:'H', targets:[0], controls:[] }, SymRules);
  th = SymEngine.apply(th, { gate:'T', targets:[0], controls:[] }, SymRules);
  assert.equal(D(th.tensor(SymState.fromKets(['φ']))), 'TH|ψ⟩⊗|φ⟩');
});

// ---- MATH correctness: symbolic tensor of two concretes == concrete Ops.tensor ----
test('v13-7 |+⟩ ⊗ |1⟩ via SymState.tensor == Ops.tensor (amplitudes agree)', () => {
  const a = State.fromKets(['+']), b = State.fromKets(['1']);
  const sym = SymState.fromConcrete(a).tensor(SymState.fromConcrete(b));
  const con = SymState.fromConcrete(Ops.tensor(a, b));
  assert.equal(D(sym), D(con));
  assert.equal(D(sym), '(1/√2)|01⟩ + (1/√2)|11⟩');
});
test('v13-8 |0⟩ ⊗ |+⟩ != |+⟩ ⊗ |0⟩ (ordering matters; big-endian saved⊗current)', () => {
  const z = SymState.fromConcrete(State.fromKets(['0'])), p = SymState.fromConcrete(State.fromKets(['+']));
  assert.equal(D(z.tensor(p)), '(1/√2)|00⟩ + (1/√2)|01⟩');   // |0⟩⊗|+⟩
  assert.equal(D(p.tensor(z)), '(1/√2)|00⟩ + (1/√2)|10⟩');   // |+⟩⊗|0⟩
});

// ---- disjointness guard (C1 symbol-collision + shared ket label) ----
test('v13-9 NEG |ψ⟩ ⊗ |ψ⟩ rejected (shared ket label)', () => {
  assert.throws(() => SymState.fromKets(['ψ']).tensor(SymState.fromKets(['ψ'])), /rename.*ψ/);
});
test('v13-10 NEG e^{iθ} ⊗ e^{2iθ} rejected (same coef param θ, different multiplier)', () => {
  assert.throws(() => phase('θ',1).tensor(phase('θ',2)), /rename.*θ/);
});
test('v13-11 disjoint symbols (θ vs ω) allowed', () => {
  assert.doesNotThrow(() => phase('θ',1).tensor(phase('ω',2)));
});
test('v13-12 symbolIds extracts ket label and phase param (ψ₀ reduces to ψ)', () => {
  assert.deepEqual([...SymState.fromKets(['ψ']).symbolIds()], ['ψ']);
  assert.deepEqual([...phase('θ',1).symbolIds()], ['θ']);
});

// ---- N≤12 cap ----
test('v13-13 NEG tensor exceeding 12 qubits → out of range', () => {
  const a = SymState.fromConcrete(State.computational(7));
  const b = SymState.fromConcrete(State.computational(6));
  assert.throws(() => a.tensor(b), /out of range/);
});

// ---- inner stays concrete-only (negative: symbolic operand is not silently accepted) ----
test('v13-14 SymState carries the .sym marker (dispatch type tag)', () => {
  assert.equal(SymState.fromKets(['ψ']).sym, true);
  assert.equal(SymState.fromConcrete(State.fromBits('0')).sym, true);   // a SymState is always tagged sym
});
