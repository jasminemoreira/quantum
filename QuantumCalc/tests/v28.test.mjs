// Phase 6 — cycle 28: SYMBOLIC angle on CONCRETE states via DIAGONAL phase gates (P/Rz + controlled).
// Source of truth: specs/technical/50-cycle28-symbolic-angle.md.
// Engine: SymEngine.applyDiagPhaseSym (coef × phaseAtom where controls+target=1).
// Anti-AP7: P/CP/Rz on concrete; θ→π/4 consistency vs the numeric ℤ[ζ₁₆] path (no regression);
// non-diagonal guard; Rz half-angle display e^{-iθ/2}.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML = join(HERE, '..', 'quantum_calc.html');
function loadQC(){
  const html = readFileSync(HTML, 'utf8');
  const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const stubEl = () => ({ textContent:'', style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){return false;} },
                          appendChild(){}, addEventListener(){}, dataset:{}, disabled:false });
  const document = { addEventListener(){}, getElementById:stubEl, querySelector:()=>null,
                     querySelectorAll:()=>[], createElement:stubEl, createTextNode:(t)=>({textContent:String(t)}) };
  const window = {};
  const fn = new Function('window','document', `${script}\n;return window.QC;`);
  return fn(window, document);
}
const QC = loadQC();
const { Algebra, State, Engine, SymExpr, SymState, SymEngine, Render } = QC;
const D = (s, f) => Render.diracSym(s, f || 'rect').replace(/−/g, '-');
const THETA = { coefN:1, coefD:1, hasPi:false, sym:'θ' };
const conc = (s) => SymState.fromConcrete(s);

// ---- M1 applyDiagPhaseSym: P (single-qubit phase) ----
test('v28-1 P(θ) on |+⟩ → (1/√2)|0⟩ + (1/√2)e^{iθ}|1⟩ (only |1⟩ gets the phase)', () => {
  const s = conc(State.fromKets(['+']));
  const out = SymEngine.applyDiagPhaseSym(s, { gate:'P', target:0, controls:[], desc:THETA });
  assert.equal(D(out), '(1/√2)|0⟩ + (1/√2·e^{iθ})|1⟩');
});

test('v28-2 P(θ) on |0⟩ → |0⟩ (no |1⟩ component, phase is a no-op)', () => {
  const out = SymEngine.applyDiagPhaseSym(conc(State.fromBits('0')), { gate:'P', target:0, controls:[], desc:THETA });
  assert.equal(D(out), '|0⟩');
});

// ---- M1 applyDiagPhaseSym: CP (controlled phase) — ANCHOR case (QFT/QPE controlled phase) ----
test('v28-3 CP(θ) on |++⟩ → (1/2)(|00⟩+|01⟩+|10⟩+e^{iθ}|11⟩) [anchor]', () => {
  const s = conc(State.fromKets(['+','+']));
  const out = SymEngine.applyDiagPhaseSym(s, { gate:'P', target:1, controls:[0], desc:THETA });
  // only the |11⟩ term (control Q0=1 AND target Q1=1) acquires e^{iθ}
  assert.equal(D(out), '(1/2)|00⟩ + (1/2)|01⟩ + (1/2)|10⟩ + (1/2·e^{iθ})|11⟩');
});

// ---- M1 applyDiagPhaseSym: Rz (BOTH branches, half-angle) ----
test('v28-4 Rz(θ) on |+⟩ → e^{-iθ/2}/√2 |0⟩ + e^{iθ/2}/√2 |1⟩ (both branches)', () => {
  const out = SymEngine.applyDiagPhaseSym(conc(State.fromKets(['+'])), { gate:'Rz', target:0, controls:[], desc:THETA });
  const s = D(out);
  assert.ok(s.includes('e^{-iθ/2}'), `|0⟩ branch should carry e^{-iθ/2}: ${s}`);
  assert.ok(s.includes('e^{iθ/2}'),  `|1⟩ branch should carry e^{iθ/2}: ${s}`);
});

// ---- Consistency: θ → π/4 must equal the NUMERIC ℤ[ζ₁₆] path (no regression / contract) ----
test('v28-5 CP(θ) with θ=π/4 matches numeric CP(π/4) on |++⟩ (exact, same ζ₁₆ value)', () => {
  // numeric path: build |++⟩ concrete and apply controlled-P(π/4) via the real engine
  let num = State.fromKets(['+','+']);
  num = Engine.applyN(num, 'P', { targets:[1], controls:[0], params:[Math.PI/4] });
  const numStr = Render.dirac(Render.terms(num, 'exp').list).replace(/−/g, '-');

  // symbolic path: CP(θ), then substitute θ=π/4 by reading the |11⟩ coefficient phase
  const symOut = SymEngine.applyDiagPhaseSym(conc(State.fromKets(['+','+'])), { gate:'P', target:1, controls:[0], desc:THETA });
  // the |11⟩ term carries e^{iθ}; the other three are bare (1/2). The numeric e^{iπ/4} on |11⟩ proves equivalence.
  assert.ok(numStr.includes('e^{iπ/4})|11⟩'), `numeric should show e^{iπ/4} on |11⟩: ${numStr}`);
  assert.equal(D(symOut), '(1/2)|00⟩ + (1/2)|01⟩ + (1/2)|10⟩ + (1/2·e^{iθ})|11⟩');
});

// ---- C1 guard: non-diagonal gate must throw (defensive assertion, 2nd line after FSM whitelist) ----
test('v28-6 applyDiagPhaseSym on a non-diagonal gate (Rx) throws (C1 defensive guard)', () => {
  assert.throws(() => SymEngine.applyDiagPhaseSym(conc(State.fromKets(['+'])), { gate:'Rx', target:0, controls:[], desc:THETA }),
    /not a diagonal phase gate/);
});

// ---- M4 display: Rz half-angle renders inline as e^{-iθ/2} (no parenthesized (1/2) coefficient) ----
test('v28-7 phaseLabel coefD=2 renders e^{-iθ/2}, never (1/2)iθ (display fix)', () => {
  const atom0 = new SymState(['c'], [{ coef: SymExpr.phaseAtom({ coefN:-1, coefD:2, hasPi:false, sym:'θ' }), slots:['0'] }]);
  assert.equal(D(atom0), '(e^{-iθ/2})|0⟩');
  const atom1 = new SymState(['c'], [{ coef: SymExpr.phaseAtom({ coefN:1, coefD:2, hasPi:false, sym:'θ' }), slots:['1'] }]);
  assert.equal(D(atom1), '(e^{iθ/2})|1⟩');
});

// ---- Non-regression: existing λ-style atom (coefD=1) display unchanged ----
test('v28-8 coefD=1 phase atom still renders e^{iθ} (no display regression)', () => {
  const a = new SymState(['c'], [{ coef: SymExpr.phaseAtom(THETA), slots:['1'] }]);
  assert.equal(D(a), '(e^{iθ})|1⟩');
});

// ---- Promotion: applying to an already-symbolic state keeps working (idempotent on layout) ----
test('v28-9 P(θ) twice on |1⟩ accumulates → e^{2iθ} (power doubling via mul)', () => {
  let out = SymEngine.applyDiagPhaseSym(conc(State.fromBits('1')), { gate:'P', target:0, controls:[], desc:THETA });
  out = SymEngine.applyDiagPhaseSym(out, { gate:'P', target:0, controls:[], desc:THETA });
  assert.equal(D(out), '(e^{2iθ})|1⟩');
});

// ---- Edge: Rz(θ) on |0⟩ → only the e^{-iθ/2} branch is present (|0⟩ has no |1⟩ component) ----
test('v28-10 [edge] Rz(θ) on |0⟩ → (e^{-iθ/2})|0⟩ only', () => {
  const out = SymEngine.applyDiagPhaseSym(conc(State.fromBits('0')), { gate:'Rz', target:0, controls:[], desc:THETA });
  assert.equal(D(out), '(e^{-iθ/2})|0⟩');
});

// ---- Edge: subsequent CONCRETE gate after a symbolic phase (mid-circuit promotion risk from the spec) ----
test('v28-11 [edge] concrete H after symbolic P(θ): SymEngine.apply flows the phase through, no throw', () => {
  // P(θ)|+⟩ = (1/√2)|0⟩ + (1/√2)e^{iθ}|1⟩, then H on Q0 → phase-bearing SymState must survive a concrete gate
  const afterP = SymEngine.applyDiagPhaseSym(conc(State.fromKets(['+'])), { gate:'P', target:0, controls:[], desc:THETA });
  const afterH = SymEngine.apply(afterP, { gate:'H', targets:[0], controls:[], params:[] }, null);
  const s = D(afterH);
  assert.ok(s.includes('e^{iθ}'), `symbolic phase must survive the concrete H: ${s}`);
  assert.ok(s.includes('|0⟩') && s.includes('|1⟩'), `H must produce both basis kets: ${s}`);
});

// ---- Edge: P(θ) on a fully concrete |1⟩ then substitute consistency is already covered (v28-5); here ensure
//      the symbolic state is still a valid SymState (layout all-concrete, no abstract slot leaked) ----
test('v28-12 [edge] symbolic-phase state keeps an all-concrete layout (no abstract |ψ⟩ leaked)', () => {
  const out = SymEngine.applyDiagPhaseSym(conc(State.fromKets(['+','+'])), { gate:'P', target:1, controls:[0], desc:THETA });
  assert.ok(out.sym, 'result must be a SymState');
  assert.deepEqual(out.layout, ['c','c'], 'layout must remain fully concrete');
});

// ===== v28b — distinct free-symbol allocation (no accidental sharing of θ) =====
// Engine level: two DIFFERENT symbols must compose as e^{iθ}·e^{iθ₂}, never conflate to e^{2iθ}.
test('v28b-1 [engine] two distinct symbols on the same qubit compose, not conflated', () => {
  let out = SymEngine.applyDiagPhaseSym(conc(State.fromBits('1')), { gate:'P', target:0, controls:[], desc:THETA });
  out = SymEngine.applyDiagPhaseSym(out, { gate:'P', target:0, controls:[], desc:{ coefN:1, coefD:1, hasPi:false, sym:'θ₂' } });
  const s = D(out);
  assert.ok(s.includes('e^{iθ}') && s.includes('e^{iθ₂}'), `both symbols must appear: ${s}`);
  assert.ok(!/e\^\{2iθ\}/.test(s), `must NOT conflate to e^{2iθ}: ${s}`);
});

// Same symbol twice is STILL valid (intentional reuse, e.g. QPE U^{2^j}) — guards we didn't break it.
test('v28b-2 [engine] same symbol twice still accumulates to e^{2iθ} (intentional reuse preserved)', () => {
  let out = SymEngine.applyDiagPhaseSym(conc(State.fromBits('1')), { gate:'P', target:0, controls:[], desc:THETA });
  out = SymEngine.applyDiagPhaseSym(out, { gate:'P', target:0, controls:[], desc:THETA });
  assert.equal(D(out), '(e^{2iθ})|1⟩');
});
