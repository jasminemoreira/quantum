// tests/v21.test.mjs — Phase 6 (v21): Part III · Classic Algorithms.
// Two guarantees, both PURE Node (no browser):
//  (1) anti-AP7 — each algorithm card's STATE is recomputed by replaying its steps[] through the REAL
//      engine (loadQC, like manual.test.mjs) and asserted equal to the pinned exact result. The card
//      can never document an invented state.
//  (2) F2 (keys↔steps consistency) — the gate/preset operations encoded in steps[] must appear, in
//      order, in the human-readable keys string. The card can never "lie": what you type (keys) is what
//      the engine ran (steps).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { examples } from './examples-data.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
function loadQC(){
  const html = readFileSync(join(HERE,'..','quantum_calc.html'),'utf8');
  const script = html.slice(html.indexOf('<script>')+8, html.lastIndexOf('</script>'));
  const stub = () => ({ textContent:'', style:{}, classList:{add(){},remove(){},toggle(){},contains(){return false;}}, appendChild(){}, addEventListener(){}, dataset:{}, disabled:false, hidden:false });
  const document = { addEventListener(){}, getElementById:stub, querySelector:()=>null, querySelectorAll:()=>[], createElement:stub, createTextNode:(t)=>({textContent:String(t)}) };
  const window = {};
  return new Function('window','document',`${script}\n;return window.QC;`)(window, document);
}
const QC = loadQC();
const { State, SymState, Engine, SymEngine, Render, Presets } = QC;
// anti-AP7 pins use the EXPANDED Dirac (engine-correctness check; independent of the manual's factored
// display). v23: dispatch on type so symbolic E10 renders through diracSym.
const dirac = (s) => (s && s.sym)
  ? Render.diracSym(s, 'exp')
  : Render.dirac(Render.terms(s, 'exp').list);
const PARAM_GATES = new Set(['CP','CRz','Rx','Ry','Rz','P','U','CU']);

// Evaluate an inline angle expression built from calc: tokens (π → Math.PI). Cards use only π,/,-,digits.
function evalAngle(expr){
  const js = expr.replace(/π/g, '(' + Math.PI + ')');
  if (!/^[-+*/().0-9eE\s]*$/.test(js)) throw new Error('unexpected angle expr: ' + expr);
  return Function('return (' + js + ')')();
}

// Minimal step interpreter mirroring the keypad FSM for the vocabulary the algorithm cards use:
// key:<digit>, key:Q, key:CTRL, key:ALL, key:SET, gate:<NAME>, preset:<NAME>, page:0/page:1 (no-op), calc:*, eval.
function runSteps(steps){
  let s = null, num = '', targets = [], controls = [], allFlag = false, kets = [];
  let pending = null, expr = '';   // pending parametric gate awaiting eval
  const reset = () => { num=''; targets=[]; controls=[]; allFlag=false; };
  // v23: faithful to the UI's cmd.kind==='apply' path — Engine.apply (concrete, strict arity) /
  // SymEngine.apply (symbolic). The new cards use named multi-control gates (CSWAP, CCX, CZ) so the
  // strict-arity Engine.apply accepts them; E10 carries a symbolic |ψ⟩ through SymEngine.
  const applyGate = (name, params) => {
    if (s && s.sym){
      if (allFlag){ for (let q=0;q<s.n;q++) s = SymEngine.apply(s,{gate:name,targets:[q],controls:[],params}); }
      else s = SymEngine.apply(s,{gate:name,targets:targets.slice(),controls:controls.slice(),params});
    } else if (allFlag){ for (let q=0;q<s.n;q++) s = Engine.apply(s,name,{targets:[q],controls:[],params}); }
    else s = Engine.apply(s, name, { targets:targets.slice(), controls:controls.slice(), params });
    reset();
  };
  for (const step of steps){
    const [k, v] = step.includes(':') ? [step.slice(0,step.indexOf(':')), step.slice(step.indexOf(':')+1)] : [step,''];
    if (pending){                                   // angle-entry mode
      if (k === 'calc'){ expr += (v === '-' ? '-' : v); continue; }
      if (step === 'eval'){ const p = pending; pending=null; applyGate(p.name,[evalAngle(expr)]); expr=''; continue; }
      throw new Error('unexpected step during angle entry: ' + step);
    }
    if (k === 'ket'){ kets.push(v); continue; }      // v23: symbolic / cardinal ket (raw label for SymState.fromKets)
    if (k === 'key'){
      if (/^[0-9]+$/.test(v)) { num += v; continue; }
      if (v === 'Q')   { targets.push(parseInt(num,10)); num=''; continue; }
      if (v === 'CTRL'){ controls.push(parseInt(num,10)); num=''; continue; }
      if (v === 'ALL') { reset(); allFlag = true; continue; }
      if (v === 'SET') {                              // v23: ket-string → SymState; else N-qubit computational
        s = kets.length ? SymState.fromKets(kets) : State.computational(targets[0]);
        kets = []; reset(); continue;
      }
      throw new Error('unknown key step: ' + step);
    }
    if (k === 'gate'){
      if (PARAM_GATES.has(v)){ pending = { name:v, targets:targets.slice(), controls:controls.slice() }; expr=''; continue; }
      applyGate(v, undefined); continue;
    }
    if (k === 'preset'){
      const qs = allFlag ? Array.from({length:s.n},(_,i)=>i)
        : (targets.length===1 ? targets.slice() : Array.from({length:Math.max(...targets)-Math.min(...targets)+1},(_,i)=>Math.min(...targets)+i));
      const { ops } = Presets.expand(v, qs);
      // v23: a preset may run on a symbolic state (E10 Bell preset on |ψ⟩|0⟩|0⟩) → SymEngine.
      for (const o of ops) s = (s && s.sym)
        ? SymEngine.apply(s, { gate:o.gate, targets:o.targets||[], controls:o.controls||[], params:o.params||[] })
        : Engine.applyN(s, o.gate, o);
      reset(); continue;
    }
    if (k === 'page') continue;                      // carousel navigation (page:0/page:1) — no engine effect
    throw new Error('unsupported step: ' + step);
  }
  return s;
}

// Pinned exact results (validated against the engine — anti-AP7 source of truth).
const EXPECT = {
  'E1/f constant (no oracle) → q0 = |0⟩':  '(1/√2)|00⟩ − (1/√2)|01⟩',
  'E1/f balanced (f=x) → q0 = |1⟩':        '(1/√2)|10⟩ − (1/√2)|11⟩',
  'E2/constant f=0 (no oracle) → input |000⟩': '(1/√2)|0000⟩ − (1/√2)|0001⟩',
  'E2/balanced f=x₀⊕x₁⊕x₂ → input |111⟩': '(1/√2)|1110⟩ − (1/√2)|1111⟩',
  'E3/final state = |s⟩|1⟩, s=101':       '|1011⟩',
  'E4/after 1 iteration → P(|111⟩)=25/32':  '−(1/4√2)|000⟩ − (1/4√2)|001⟩ − (1/4√2)|010⟩ − (1/4√2)|011⟩ − (1/4√2)|100⟩ − (1/4√2)|101⟩ − (1/4√2)|110⟩ − (5/4√2)|111⟩',
  'E4/after 2 iterations → P(|111⟩)=121/128': '−(1/8√2)|000⟩ − (1/8√2)|001⟩ − (1/8√2)|010⟩ − (1/8√2)|011⟩ − (1/8√2)|100⟩ − (1/8√2)|101⟩ − (1/8√2)|110⟩ + (11/8√2)|111⟩',
  'E5/count |001⟩ ⊗ |1⟩':                   '|0011⟩',
  // v23 — E6–E10 (states captured from the real engine; see specs/references/44 + the cycle-24 P5 decision).
  'E6/final state — input register ∈ {|00⟩,|11⟩}': '(1/2)|0000⟩ + (1/2)|0011⟩ + (1/2)|1100⟩ − (1/2)|1111⟩',
  'E7/message 00 (I) → |00⟩':  '|00⟩',
  'E7/message 01 (X) → |01⟩':  '|01⟩',
  'E7/message 10 (Z) → |10⟩':  '|10⟩',
  'E7/message 11 (ZX) → −|11⟩':'−|11⟩',
  'E8/after the controlled ×11 mod 15 (work register holds |1⟩ or |11⟩)':
    '(1/2)|000001⟩ + (1/2)|011011⟩ + (1/2)|100001⟩ + (1/2)|111011⟩',
  'E8/after QFT† — counting register peaks at {0, 2}':
    '(1/2)|000001⟩ + (1/2)|001011⟩ + (1/2)|100001⟩ − (1/2)|101011⟩',
  // E9 (Quantum counting) deferred to the next cycle — see the P5 scope decision.
  'E10/|ψ⟩|0⟩|0⟩ SET': '|ψ⟩⊗|00⟩',
  'E10/pre-measurement: |ψ⟩ spread over the 4 (q0,q1) branches':
    '(1/2·ψ₀)|000⟩ + (1/2·ψ₀)|100⟩ + (1/2·ψ₁)|010⟩ − (1/2·ψ₁)|110⟩ + (1/2·ψ₀)|011⟩ + (1/2·ψ₀)|111⟩ + (1/2·ψ₁)|001⟩ − (1/2·ψ₁)|101⟩',
  'E10/deferred correction (CNOT · CZ) → q2 recovers |ψ⟩':
    '(1/2)|00⟩⊗|ψ⟩ + (1/2)|10⟩⊗|ψ⟩ + (1/2)|01⟩⊗|ψ⟩ + (1/2)|11⟩⊗|ψ⟩',
};

const algos = examples.filter(e => e.part === 'III');

test('v23: Part III has 9 algorithm cards E1–E8 + E10 (E9 deferred)', () => {
  assert.deepEqual(algos.map(e=>e.id).sort(), ['E1','E10','E2','E3','E4','E5','E6','E7','E8']);
  for (const e of algos){ assert.ok(e.motivation, `${e.id}.motivation`); assert.ok(e.result, `${e.id}.result`); }
});

for (const ex of algos){
  for (const r of ex.results){
    const key = `${ex.id}/${r.label}`;
    test(`v21 state (anti-AP7): ${key}`, () => {
      const s = runSteps(r.steps);
      const got = dirac(s);
      assert.ok(EXPECT[key] !== undefined, `missing pinned expectation for ${key}`);
      assert.equal(got, EXPECT[key]);
    });
  }
}

// F2 — keys↔steps consistency: every gate/preset op in steps appears, in order, in the keys string.
const SYM = { CNOT:'CNOT', CZ:'CZ', CCX:'CCX', H:'H', X:'X', Y:'Y', Z:'Z', S:'S', T:'T', CP:'CP', SWAP:'SWAP' };
function opsFromSteps(steps){
  return steps.filter(s => s.startsWith('gate:') || s.startsWith('preset:'))
    .map(s => s.startsWith('preset:') ? s.slice(7) : (SYM[s.slice(5)] ?? s.slice(5)));
}
function keyTokens(keys){
  // flatten the human-readable keys into word tokens ('0 CTRL 1 CTRL 2 Q CCX' → [...,'CCX'])
  return keys.split('·').flatMap(seg => seg.trim().split(/\s+/)).filter(Boolean);
}
for (const ex of algos){
  for (const r of ex.results){
    if (!r.keys) continue;   // v23: E6–E10 omit the hand `keys` string — the doc DERIVES keys from steps
                             // (examples-render.stepsToKeys), so there is no parallel hand string to lie.
    test(`v21 keys↔steps consistency: ${ex.id}/${r.label}`, () => {
      const need = opsFromSteps(r.steps);      // ordered gate/preset symbols actually executed
      const toks = keyTokens(r.keys);
      let i = 0;                               // subsequence match
      for (const t of toks){ if (i < need.length && t === need[i]) i++; }
      assert.equal(i, need.length,
        `keys do not cover steps in order for ${ex.id}/${r.label}: need [${need}] within [${toks}]`);
    });
  }
}
