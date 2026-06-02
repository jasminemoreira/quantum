// Phase 6 — v9 presets/macros (specs/technical/19-v9-presets.md).
// Cobre o CORE puro: Presets.expand (sequências), Engine.applyN (núcleo multi-controle = C1),
// Parser.preset (gramática), e o CROSS-CHECK preset == sequência MANUAL (pedido da usuária:
// manter as formas manuais + acrescentar as automáticas, mesmas saídas). O caminho tecla→tela
// (range/aridade/atômico) é coberto por Playwright (ui.spec.js, validação DOM-driven do v8).
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
  const window = {};
  return new Function('window','document', `${script}\n;return window.QC;`)(window, document);
}
const QC = loadQC();
const { Algebra, State, Engine, Presets, Render, Parser } = QC;

const dirac = (s) => Render.dirac(Render.terms(s, 'exp').list);
const allExact = (s) => [...s.amps.values()].every(a => a.ex);
const bits = (b) => State.fromBits(b);
function runPreset(name, qubits, init){              // dobra a sequência do preset via applyN
  let s = init; for (const o of Presets.expand(name, qubits).ops) s = Engine.applyN(s, o.gate, o); return s;
}
function ampAt(s, idx){ const a = s.amps.get(idx); return a ? Algebra.toComplex(a) : { re:0, im:0 }; }
const close = (a, b, t=1e-9) => Math.abs(a - b) < t;
const norm2 = (s) => { let n=0; for (const a of s.amps.values()){ const c=Algebra.toComplex(a); n+=c.re*c.re+c.im*c.im; } return n; };

// ---------- QFT ----------
test('v9-1 QFT|000⟩ → superposição uniforme de 8 termos, EXATA', () => {
  const s = runPreset('QFT', [0,1,2], bits('000'));
  assert.equal(s.amps.size, 8);
  assert.ok(allExact(s));
  for (const a of s.amps.values()) assert.ok(close(Algebra.toComplex(a).re, 1/Math.sqrt(8)));
});

test('v9-2 QFT EXATA ≤4 qubits (π/8) — QFT|0001⟩ 4q todas exatas', () => {
  const s = runPreset('QFT', [0,1,2,3], bits('0001'));
  assert.equal(s.amps.size, 16);
  assert.ok(allExact(s), 'todas as amplitudes da QFT-4 devem ser exatas (ζ₁₆)');
});

test('v9-3 QFT ≥5 qubits → ≈approx (R₅=CP(π/16)∈ζ₃₂ fora do núcleo)', () => {
  const { approx } = Presets.expand('QFT', [0,1,2,3,4]);
  assert.equal(approx, true, 'flag approx do preset QFT-5');
  const s = runPreset('QFT', [0,1,2,3,4], bits('00001'));
  assert.ok(!allExact(s), 'QFT-5 sobre |00001⟩ deve conter amplitude numérica (π/16)');
});

test('v9-4 QFT†∘QFT = identidade (vários inputs, exato ≤4q)', () => {
  for (const b of ['000','011','101','1010']){
    let s = bits(b);
    const qs = Array.from({length:b.length}, (_,i)=>i);
    for (const o of Presets.expand('QFT', qs).ops) s = Engine.applyN(s, o.gate, o);
    for (const o of Presets.expand('QFTinv', qs).ops) s = Engine.applyN(s, o.gate, o);
    assert.equal(dirac(s), `|${b}⟩`, `QFT†∘QFT|${b}⟩ deve voltar a |${b}⟩`);
  }
});

test('v9-5 CROSS-CHECK: preset QFT == sequência MANUAL do cookbook (QFT₃|001⟩)', () => {
  // forma MANUAL (como no examples-data.mjs / manual.html) — preservada e equivalente
  const cp = (s,c,t,lam) => Engine.apply(s,'CU',{controls:[c],targets:[t],params:[0,0,lam]});
  let m = bits('001');
  m = Engine.apply(m,'H',{targets:[0]}); m = cp(m,1,0,Math.PI/2); m = cp(m,2,0,Math.PI/4);
  m = Engine.apply(m,'H',{targets:[1]}); m = cp(m,2,1,Math.PI/2);
  m = Engine.apply(m,'H',{targets:[2]}); m = Engine.apply(m,'SWAP',{targets:[0,2]});
  const p = runPreset('QFT', [0,1,2], bits('001'));
  assert.equal(dirac(p), dirac(m), 'a forma automatizada (preset) deve produzir o MESMO estado que a manual');
});

// ---------- Bell (variante pela preparação) ----------
test('v9-6 Bell: as 4 variantes saem da preparação do input (H+CNOT)', () => {
  assert.equal(dirac(runPreset('Bell',[0,1],bits('00'))), '(1/√2)|00⟩ + (1/√2)|11⟩');   // Φ+
  assert.equal(dirac(runPreset('Bell',[0,1],bits('01'))), '(1/√2)|01⟩ + (1/√2)|10⟩');   // Ψ+
  assert.equal(dirac(runPreset('Bell',[0,1],bits('10'))), '(1/√2)|00⟩ − (1/√2)|11⟩');   // Φ−
  assert.equal(dirac(runPreset('Bell',[0,1],bits('11'))), '(1/√2)|01⟩ − (1/√2)|10⟩');   // Ψ−
});

// ---------- GHZ ----------
test('v9-7 GHZ|0…0⟩ → (1/√2)|0…0⟩+(1/√2)|1…1⟩, EXATO (3 e 4 qubits)', () => {
  const g3 = runPreset('GHZ',[0,1,2],bits('000'));
  assert.equal(dirac(g3), '(1/√2)|000⟩ + (1/√2)|111⟩'); assert.ok(allExact(g3));
  const g4 = runPreset('GHZ',[0,1,2,3],bits('0000'));
  assert.equal(dirac(g4), '(1/√2)|0000⟩ + (1/√2)|1111⟩'); assert.ok(allExact(g4));
});

// ---------- Grover difusor + MCZ multi-controle (C1) ----------
test('v9-8 Grover difusor sobre |000⟩ → (3/4)|000⟩ − (1/4)Σ outros, EXATO', () => {
  const s = runPreset('Grover',[0,1,2],bits('000'));
  assert.ok(allExact(s));
  assert.ok(close(ampAt(s,0).re, 0.75), '|000⟩ = 3/4');
  for (let i=1;i<8;i++) assert.ok(close(ampAt(s,i).re, -0.25), `|${i}⟩ = −1/4`);
});

test('v9-9 Grover difusor sobre |s⟩ (uniforme) → ±|s⟩ (autovetor)', () => {
  let u = State.computational(3); for (let q=0;q<3;q++) u = Engine.apply(u,'H',{targets:[q]});
  let s = u; for (const o of Presets.expand('Grover',[0,1,2]).ops) s = Engine.applyN(s,o.gate,o);
  assert.equal(s.amps.size, 8);
  const re0 = ampAt(s,0).re; for (let i=1;i<8;i++) assert.ok(close(ampAt(s,i).re, re0), 'todas as amplitudes iguais (=±|s⟩)');
});

test('v9-10 C1: MCZ multi-controle (m=4, 3 controles) NÃO trava e é EXATO', () => {
  // difusor de 4 qubits exige Z com 3 controles — bloqueado por validate(), liberado por applyN
  let u = State.computational(4); for (let q=0;q<4;q++) u = Engine.apply(u,'H',{targets:[q]});
  let s = u; assert.doesNotThrow(() => { for (const o of Presets.expand('Grover',[0,1,2,3]).ops) s = Engine.applyN(s,o.gate,o); });
  assert.equal(s.amps.size, 16); assert.ok(allExact(s));
});

test('v9-11 Engine.applyN aplica MCZ direto (Z com 2 controles); apply() ainda rejeita aridade', () => {
  let s = State.fromBits('111');                       // |111⟩
  const mcz = Engine.applyN(s, 'Z', { targets:[2], controls:[0,1] });   // CCZ: flip de sinal de |111⟩
  assert.ok(close(ampAt(mcz,7).re, -1), 'CCZ|111⟩ = −|111⟩');
  assert.throws(() => Engine.apply(s, 'Z', { targets:[2], controls:[0,1] }), /control/);  // apply mantém aridade estrita (mensagem EN v10)
});

// ---------- W-state (≈approx) ----------
test('v9-12 W|0…0⟩ → (1/√m)Σ excitação única, normalizado, ≈approx (3 e 4 qubits)', () => {
  for (const m of [2,3,4]){
    const qs = Array.from({length:m},(_,i)=>i);
    const { approx } = Presets.expand('W', qs);
    assert.equal(approx, true, `W-${m} é ≈approx`);
    const s = runPreset('W', qs, State.computational(m));
    assert.equal(s.amps.size, m, `W-${m} tem m termos de excitação única`);
    assert.ok(close(norm2(s), 1, 1e-9), `‖W-${m}‖² = 1`);
    // cada termo tem exatamente 1 qubit em |1⟩ e amplitude 1/√m
    for (const [idx, a] of s.amps){
      assert.equal(idx.toString(2).split('').filter(c=>c==='1').length, 1, 'excitação única');
      assert.ok(close(Algebra.toComplex(a).re, 1/Math.sqrt(m)));
    }
  }
});

// ---------- edges ----------
test('v9-13 edges: QFT 1 qubit = só H; difusor 1 qubit (Z sem controle)', () => {
  const q = runPreset('QFT',[0],bits('0'));
  assert.equal(dirac(q), '(1/√2)|0⟩ + (1/√2)|1⟩');      // QFT₁ = H
  const g = Presets.expand('Grover',[0]).ops;
  assert.ok(g.some(o => o.gate==='Z' && o.controls.length===0), 'difusor m=1 usa Z sem controle');
});

// ---------- Parser.preset (gramática) ----------
test('v9-14 Parser.preset: ALL → {all:true} (v24: +controls/power)', () => {
  Parser.clear(); Parser.all();
  const r = Parser.preset('QFT');
  assert.deepEqual(r.command, { kind:'preset', name:'QFT', all:true, controls:[], power:null });
});

test('v9-15 Parser.preset: dois Q → {qsel:[i,j]} (M11 resolve range [min..max])', () => {
  Parser.clear(); Parser.digit('0'); Parser.q(); Parser.digit('3'); Parser.q();
  const r = Parser.preset('QFT');
  assert.deepEqual(r.command, { kind:'preset', name:'QFT', qsel:[0,3], controls:[], power:null });
});

test('v9-16 Parser.preset: default ALL → {all:true} (v21-25); CTRL sem alvos → erro (v24)', () => {
  Parser.clear();   // estado default: selection='ALL', allFlag=false
  // v21-25: o indicador ALL default JÁ vale como "todos" (como as portas) — não exige re-apertar ALL
  assert.deepEqual(Parser.preset('GHZ').command, { kind:'preset', name:'GHZ', all:true, controls:[], power:null });
  // v24: CTRL agora É aceito em preset (controle generalizado), mas exige alvos explícitos — sem Q → erro "select the qubits"
  Parser.clear(); Parser.digit('0'); Parser.ctrl();
  assert.ok(Parser.preset('Bell').error, 'CTRL sem alvos → preset exige Q explícito');
  Parser.clear();
});

test('v9-17 Presets.MIN_QUBITS define a aridade mínima por preset', () => {
  assert.deepEqual(Presets.MIN_QUBITS, { QFT:1, QFTinv:1, Bell:2, GHZ:2, Grover:1, W:2 });
});
