// Phase 6 — v24 generalized control (CTRL) + power (2ʲ / POW). Spec: specs/technical/46-v24-generalized-control.md.
// Tests the CORE + Parser FSM against the spec (not the implementation): command shapes, arity relaxation,
// POW capture/cap, ALL+CTRL exclusion, multi-control math via applyN, control injection into presets, and
// the overlap guard. The full key→screen path (execute loop, error banners) is covered by ui.spec.js +
// examples.spec.js; the E9/E5-POW card states are replayed in v21.test.mjs (anti-AP7).
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
const { Algebra, State, Engine, Presets, Render, Parser } = QC;
const dirac = (s) => Render.dirac(Render.terms(s, 'exp').list);
const allExact = (s) => [...s.amps.values()].every(a => a.ex);
// type a sequence of FSM ops on the Parser: 'n' digit(s), 'Q', 'C' ctrl, 'P' pow  (e.g. seq('0C1Q') = 0 CTRL 1 Q)
function feed(spec){ Parser.clear(); for (const t of spec){ if (/[0-9]/.test(t)) Parser.digit(t); else if (t==='Q') Parser.q(); else if (t==='C') Parser.ctrl(); else if (t==='P') Parser.setPow(); } }

// ───────── M1 Parser: command SHAPE (generalized control) ─────────
test('v24-1 (+) c CTRL t Q H → controlled-H command (extra control on a 0-control gate)', () => {
  feed('0C1Q'); const r = Parser.applyGate('H');
  assert.deepEqual(r.command, { kind:'apply', gate:'H', targets:[1], controls:[0], params:undefined, power:null });
});
test('v24-2 (+) CTRL accumulates: 0 CTRL 1 CTRL 2 Q X → MCX (controls=[0,1])', () => {
  feed('0C1C2Q'); const r = Parser.applyGate('X');
  assert.deepEqual(r.command.controls, [0,1]);
  assert.deepEqual(r.command.targets, [2]);
});
test('v24-3 (+) extra control on a 1-control gate: 0 CTRL 1 CTRL 2 Q CNOT (=CCX)', () => {
  feed('0C1C2Q'); const r = Parser.applyGate('CNOT');
  assert.equal(r.error, undefined);
  assert.deepEqual(r.command.controls, [0,1]);
});
test('v24-4 (−) target arity stays STRICT: 0 Q 1 Q H → error (H is 1-target)', () => {
  feed('0Q1Q'); const r = Parser.applyGate('H');
  assert.ok(r.error, 'two targets on a 1-target gate must error');
});
test('v24-5 (−) too FEW controls still errors: 0 Q CNOT → error (CNOT needs ≥1 control)', () => {
  feed('0Q'); const r = Parser.applyGate('CNOT');
  assert.ok(r.error, 'CNOT with no control must error');
});

// ───────── M1 Parser: POW token ─────────
test('v24-6 (+) j POW attaches power=j: 0 CTRL 1 Q 3 POW H', () => {
  feed('0C1Q3P'); const r = Parser.applyGate('H');
  assert.equal(r.command.power, 3);
});
test('v24-7 (+) POW order-insensitive: 3 POW 0 CTRL 1 Q H ≡ power 3', () => {
  Parser.clear(); Parser.digit('3'); Parser.setPow(); Parser.digit('0'); Parser.ctrl(); Parser.digit('1'); Parser.q();
  const r = Parser.applyGate('H'); assert.equal(r.command.power, 3); assert.deepEqual(r.command.controls,[0]);
});
test('v24-8 (+) POW repeated → last wins: 3 POW 5 POW → power 5', () => {
  Parser.clear(); Parser.digit('3'); Parser.setPow(); Parser.digit('5'); Parser.setPow(); Parser.digit('0'); Parser.q();
  const r = Parser.applyGate('X'); assert.equal(r.command.power, 5);
});
test('v24-9 (−) POW cap: 11 POW → error (max j=10)', () => {
  Parser.clear(); Parser.digit('1'); Parser.digit('1'); const r = Parser.setPow();
  assert.ok(r.error && /exponent too large/.test(r.error));
});
test('v24-10 (−) POW without a digit → error', () => {
  Parser.clear(); const r = Parser.setPow(); assert.ok(r.error && /exponent/.test(r.error));
});
test('v24-11 (+) j=10 is accepted (boundary)', () => {
  Parser.clear(); Parser.digit('1'); Parser.digit('0'); const r = Parser.setPow(); assert.equal(r.error, undefined);
});

// ───────── M1 Parser: ALL + CTRL mutually exclusive (A4) ─────────
test('v24-12 (−) ALL + CTRL on a gate → error', () => {
  Parser.clear(); Parser.digit('0'); Parser.ctrl(); Parser.all();   // all() resets ops → so build ALL then CTRL
  // ALL first then CTRL: allFlag set, then ctrl adds a control
  Parser.clear(); Parser.all(); Parser.digit('0'); Parser.ctrl(); const r = Parser.applyGate('H');
  assert.ok(r.error && /mutually exclusive/.test(r.error));
});
test('v24-13 (−) ALL + CTRL on a preset → error', () => {
  Parser.clear(); Parser.all(); Parser.digit('0'); Parser.ctrl(); const r = Parser.preset('Grover');
  assert.ok(r.error && /mutually exclusive/.test(r.error));
});

// ───────── M1 Parser: preset with controls + power ─────────
test('v24-14 (+) controlled preset shape: 0 CTRL 1 Q 2 Q 1 POW Grover', () => {
  Parser.clear(); Parser.digit('0'); Parser.ctrl(); Parser.digit('1'); Parser.q(); Parser.digit('2'); Parser.q(); Parser.digit('1'); Parser.setPow();
  const r = Parser.preset('Grover');
  assert.deepEqual(r.command, { kind:'preset', name:'Grover', qsel:[1,2], controls:[0], power:1 });
});

// ───────── M2/M3 math: multi-control via applyN (engine, unchanged core) ─────────
test('v24-15 (+) controlled-H by q0=1 → H on q1 (engine applyN)', () => {
  let s = State.fromBits('10');                       // q0=1, q1=0
  s = Engine.applyN(s, 'H', { targets:[1], controls:[0] });
  assert.equal(dirac(s), '(1/√2)|10⟩ + (1/√2)|11⟩');  // q0 stays 1, q1 → |+⟩
  assert.ok(allExact(s));
});
test('v24-16 (+) controlled-H by q0=0 → identity (control off)', () => {
  let s = State.fromBits('00');
  s = Engine.applyN(s, 'H', { targets:[1], controls:[0] });
  assert.equal(dirac(s), '|00⟩');
});
test('v24-17 (+) MCX (X, controls=[0,1]) == CCX on |110⟩ → |111⟩', () => {
  const mcx = Engine.applyN(State.fromBits('110'), 'X', { targets:[2], controls:[0,1] });
  const ccx = Engine.applyN(State.fromBits('110'), 'CCX', { targets:[2], controls:[0,1] });
  assert.equal(dirac(mcx), '|111⟩');
  assert.equal(dirac(mcx), dirac(ccx));               // generalized X+2CTRL ≡ named CCX
});
test('v24-18 (−) overlap guard: control == target → applyN throws (range/dup check)', () => {
  assert.throws(() => Engine.applyN(State.fromBits('00'), 'X', { targets:[0], controls:[0] }), /repeated qubits/);
});

// ───────── M2 math: power 2ʲ repetition ─────────
test('v24-19 (+) X^(2¹) = I (even power → identity)', () => {
  let s = State.fromBits('0'); for (let i=0;i<2;i++) s = Engine.applyN(s, 'X', { targets:[0] });
  assert.equal(dirac(s), '|0⟩');
});
test('v24-20 (+) T^(2²) = Z on |+⟩ → |−⟩ (visible power)', () => {
  let s = Engine.applyN(State.fromBits('0'), 'H', { targets:[0] });   // |+⟩
  for (let i=0;i<4;i++) s = Engine.applyN(s, 'T', { targets:[0] });   // T⁴ = Z
  assert.equal(dirac(s), '(1/√2)|0⟩ − (1/√2)|1⟩');
  assert.ok(allExact(s));
});

// ───────── M3 math: controlled preset = inject control into every op ─────────
function runPresetCtrl(name, qubits, controls, init){    // mirrors execute()'s preset-control injection
  let s = init;
  for (const o of Presets.expand(name, qubits).ops){
    const inj = { gate:o.gate, targets:o.targets||[], controls:[...(o.controls||[]), ...controls], params:o.params||[] };
    s = Engine.applyN(s, o.gate, inj);
  }
  return s;
}
test('v24-21 (+) controlled-Bell by q0=1 → Bell on q1,q2', () => {
  const s = runPresetCtrl('Bell', [1,2], [0], State.fromBits('100'));
  assert.equal(dirac(s), '(1/√2)|100⟩ + (1/√2)|111⟩');
  assert.ok(allExact(s));
});
test('v24-22 (+) controlled-Bell by q0=0 → identity (control off)', () => {
  const s = runPresetCtrl('Bell', [1,2], [0], State.fromBits('000'));
  assert.equal(dirac(s), '|000⟩');
});
