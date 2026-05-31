// Fase 6 (v3) — preparação de estado-produto via ket-string.
// Fonte: specs/technical/07-v3-product-states.md + specs/design/v3-architecture.md.
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
  const window = {};
  return new Function('window','document',`${script}\n;return window.QC;`)(window, document);
}
const QC = loadQC();
const { State, Render, Algebra, Parser, Engine } = QC;
const dirac = (s,f)=>Render.dirac(Render.terms(s, f||'rect').list);
const diracQB = (s,qb)=>Render.dirac(Render.terms(s, 'rect', qb).list);   // render na base POR QUBIT
const R = Math.SQRT1_2;
const cx = (a)=>Algebra.toComplex(a);

// ---- State.fromKets: estados-produto cardeais exatos (ℤ[ω]) ----
test('fromKets |0⟩|+⟩|1⟩ = (1/√2)|001⟩+(1/√2)|011⟩', () =>
  assert.equal(dirac(State.fromKets(['0','+','1'])), '(1/√2)|001⟩ + (1/√2)|011⟩'));
test('fromKets |+⟩ = (1/√2)|0⟩+(1/√2)|1⟩', () =>
  assert.equal(dirac(State.fromKets(['+'])), '(1/√2)|0⟩ + (1/√2)|1⟩'));
test('fromKets |−⟩ = (1/√2)|0⟩−(1/√2)|1⟩', () =>
  assert.equal(dirac(State.fromKets(['-'])), '(1/√2)|0⟩ − (1/√2)|1⟩'));
test('fromKets |0⟩|1⟩ ≡ fromBits("01")', () =>
  assert.equal(dirac(State.fromKets(['0','1'])), dirac(State.fromBits('01'))));
test('fromKets big-endian: |1⟩|0⟩ = |10⟩ (1º ket = Q0 = MSB)', () =>
  assert.equal(dirac(State.fromKets(['1','0'])), '|10⟩'));
test('fromKets exato: ex===true em todas as amplitudes', () =>
  assert.ok(State.fromKets(['+','i','-']).amplitudes().every(x => x.amp.ex === true)));
test('fromKets |i⟩ = (1/√2)(|0⟩+i|1⟩) — valor complexo exato', () => {
  const a = State.fromKets(['i']).amplitudes();
  assert.equal(a.length, 2); assert.ok(a.every(x => x.amp.ex === true));
  const c0 = cx(a[0].amp), c1 = cx(a[1].amp);
  assert.ok(Math.abs(c0.re-R)<1e-12 && Math.abs(c0.im)<1e-12);     // |0⟩: 1/√2
  assert.ok(Math.abs(c1.re)<1e-12 && Math.abs(c1.im-R)<1e-12);     // |1⟩: +i/√2
});
test('fromKets |−i⟩ = (1/√2)(|0⟩−i|1⟩)', () => {
  const c1 = cx(State.fromKets(['-i']).amplitudes()[1].amp);
  assert.ok(Math.abs(c1.re)<1e-12 && Math.abs(c1.im+R)<1e-12);     // |1⟩: −i/√2
});
test('fromKets phase kickback algébrico: |+⟩|−⟩ = ½(|00⟩−|01⟩+|10⟩−|11⟩)', () => {
  assert.equal(dirac(State.fromKets(['+','-'])), '(1/2)|00⟩ − (1/2)|01⟩ + (1/2)|10⟩ − (1/2)|11⟩');
});
// NEG
test('fromKets NEG: ket-string vazia → erro', () => assert.throws(()=>State.fromKets([])));
test('fromKets NEG: símbolo desconhecido → erro', () => assert.throws(()=>State.fromKets(['0','x'])));
test('fromKets NEG: N>12 → erro (sem travar)', () => assert.throws(()=>State.fromKets(Array(13).fill('0'))));

// ---- Render por qubit: base de exibição mantida (o coração do v3) ----
test('render por-qubit MISTO usa ⊗: |0⟩|+⟩|1⟩ base [comp,had,comp] = |0⟩⊗|+⟩⊗|1⟩', () =>
  assert.equal(diracQB(State.fromKets(['0','+','1']), ['comp','had','comp']), '|0⟩⊗|+⟩⊗|1⟩'));
test('render por-qubit UNIFORME compacto: |+⟩|−⟩ na base [had,had] = |+−⟩', () =>
  assert.equal(diracQB(State.fromKets(['+','-']), ['had','had']), '|+−⟩'));
test('render por-qubit: phase kickback — CNOT em |+⟩|−⟩, base [had,had] → |−−⟩', () => {
  let s = State.fromKets(['+','-']);
  s = Engine.apply(s, 'CNOT', { controls:[0], targets:[1] });   // |+⟩|−⟩ → |−⟩|−⟩
  assert.equal(diracQB(s, ['had','had']), '|−−⟩');              // base X mantida: kickback visível
});
test('render por-qubit MISTO (⊗): |00⟩ com Q1 em had = (1/√2)|0⟩⊗|+⟩+(1/√2)|0⟩⊗|−⟩', () => {
  // |0⟩_Q1 = (|+⟩+|−⟩)/√2; bases diferentes → ⊗ por posição
  assert.equal(diracQB(State.fromBits('00'), ['comp','had']), '(1/√2)|0⟩⊗|+⟩ + (1/√2)|0⟩⊗|−⟩');
});
test('render por-qubit: base uniforme [had,had] ≡ CHBASE global had (sem regressão)', () => {
  const bell = Engine.apply(Engine.apply(State.computational(2),'H',{targets:[0]}),'CNOT',{controls:[0],targets:[1]});
  assert.equal(diracQB(bell, ['had','had']), dirac(bell.withBasis('had')));
});

// ---- Forma FATORADA (não distribui): fatora qubits fixos, restante entre parênteses ----
const fac = (s, qb) => Render.factored(s, 'rect', qb);
test('factored: produto puro |+⟩⊗|0⟩ (não distribui)', () =>
  assert.equal(fac(State.fromKets(['+','0']), ['had','comp']), '|+⟩⊗|0⟩'));
test('factored: |+⟩|−⟩ base uniforme had → |+−⟩ (compacto)', () =>
  assert.equal(fac(State.fromKets(['+','-']), ['had','had']), '|+−⟩'));
test('factored: |0⟩ com Q1 em had → fatora |0⟩, restante distribuído', () =>
  assert.equal(fac(State.fromBits('00'), ['comp','had']), '|0⟩⊗((1/√2)|+⟩ + (1/√2)|−⟩)'));
test('factored PRESERVA a ordem dos qubits: |0⟩|+⟩ após H(Q0) → (soma Q0)⊗|+⟩ (não reordena)', () => {
  let s = State.fromKets(['0','+']);                      // Q0=|0⟩ (comp), Q1=|+⟩ (had)
  s = Engine.apply(s, 'H', { targets:[0], controls:[] }); // Q0 varia; Q1=|+⟩ fixo
  assert.equal(fac(s, ['comp','had']), '((1/√2)|0⟩ + (1/√2)|1⟩)⊗|+⟩');               // Q0 à esquerda, Q1 à direita — sem swap
});
test('factored: Bell (sem qubit fixo) → soma (= expand)', () => {
  const bell = Engine.apply(Engine.apply(State.computational(2),'H',{targets:[0]}),'CNOT',{controls:[0],targets:[1]});
  assert.equal(fac(bell, ['comp','comp']), '(1/√2)|00⟩ + (1/√2)|11⟩');
});
test('factored: termo único preserva coeficiente global (−|11⟩)', () => {
  const s = Engine.apply(State.fromBits('11'), 'CP', { controls:[0], targets:[1], params:[Math.PI] });   // e^{iπ}|11⟩ = −|11⟩
  assert.equal(fac(s, ['comp','comp']), '−|11⟩');
});

// ---- Evidenciar(qubit): agrupa por um qubit e fatora seu ket + escalar comum ----
const evid = (s, q, qb) => Render.evidence(s, q, 'rect', qb);
const bell2 = () => Engine.apply(Engine.apply(State.computational(2),'H',{targets:[0]}),'CNOT',{controls:[0],targets:[1]});
test('evidence: Bell, Q0 (comp) → (1/√2)[|0⟩⊗|0⟩ + |1⟩⊗|1⟩]', () =>
  assert.equal(evid(bell2(), 0, ['comp','comp']), '(1/√2)[|0⟩⊗|0⟩ + |1⟩⊗|1⟩]'));
test('evidence: Bell, Q0 na base X → (1/√2)[|+⟩⊗|+⟩ + |−⟩⊗|−⟩]', () =>
  assert.equal(evid(bell2(), 0, ['had','had']), '(1/√2)[|+⟩⊗|+⟩ + |−⟩⊗|−⟩]'));
test('evidence: |+⟩ (1 qubit) → (1/√2)[|0⟩ + |1⟩]', () =>
  assert.equal(evid(State.fromKets(['+']), 0, ['comp']), '(1/√2)[|0⟩ + |1⟩]'));
test('evidence: GHZ₃ por Q0 → (1/√2)[|0⟩⊗|00⟩ + |1⟩⊗|11⟩]', () => {
  let g = Engine.apply(State.computational(3),'H',{targets:[0]});
  g = Engine.apply(g,'CNOT',{controls:[0],targets:[1]}); g = Engine.apply(g,'CNOT',{controls:[0],targets:[2]});
  assert.equal(evid(g, 0, ['comp','comp','comp']), '(1/√2)[|0⟩⊗|00⟩ + |1⟩⊗|11⟩]');
});
test('evidenceKet: só o ket escolhido |+⟩ em Q1; resto fica expandido', () => {
  // (1/2)(|00⟩+|01⟩+|10⟩−|11⟩) com Q1 em X → evidenciar |+⟩ (bit0) em Q1
  let s = Engine.applyAll(State.computational(2),'H');
  s = Engine.apply(s,'CZ',{controls:[0],targets:[1]});
  // em [comp,had]: terms → Q1=+ : |0+⟩,|1+⟩ ; Q1=− : ... ; evidenciar |+⟩ (bit 0)
  const out = Render.evidenceKet(s, 1, 0, 'rect', ['comp','had']);
  assert.ok(out.includes('⊗|+⟩'));            // o ramo |+⟩ foi fatorado à direita
  assert.ok(/\|[01]⟩⊗\|−⟩/.test(out) || out.includes('|−⟩'));   // o ramo |−⟩ permanece expandido
});
test('evidenceKet: GHZ por |0⟩ em Q0 → |0⟩⊗(...) + termo |1⟩ expandido', () => {
  let g = Engine.apply(State.computational(2),'H',{targets:[0]});
  g = Engine.apply(g,'CNOT',{controls:[0],targets:[1]});   // Bell
  const out = Render.evidenceKet(g, 0, 0, 'rect', ['comp','comp']);   // evidenciar |0⟩ em Q0
  assert.equal(out, '(1/√2)|0⟩⊗|0⟩ + (1/√2)|1⟩⊗|1⟩');   // ramo |0⟩ fatorado (1 termo) + ramo |1⟩ expandido
});
test('evidence POSICIONAL Q1 (último): bracket à esquerda, ket à direita', () => {
  // H⊗H|00⟩ depois CZ = (1/2)(|00⟩+|01⟩+|10⟩−|11⟩); evidenciar Q1 (último) → colchete em Q0 ⊗ |k⟩_Q1
  let s = Engine.applyAll(State.computational(2),'H');
  s = Engine.apply(s,'CZ',{controls:[0],targets:[1]});
  assert.equal(evid(s, 1, ['comp','comp']),
    '[(1/2)|0⟩ + (1/2)|1⟩]⊗|0⟩ + [(1/2)|0⟩ − (1/2)|1⟩]⊗|1⟩');
});

// ---- Parser: buffer tipado / ket-string (FSM) ----
test('Parser ket-string → comando set {kets}', () => {
  Parser.clear(); assert.deepEqual(Parser.ket('0'), {});
  Parser.ket('+'); Parser.ket('1');
  assert.deepEqual(Parser.set().command, { kind:'set', spec:{ kets:['0','+','1'] } });
});
test('Parser NEG: dígito depois de ket → erro (não mistura)', () => {
  Parser.clear(); Parser.ket('+'); const r = Parser.digit('1'); assert.ok(r.error); Parser.clear();
});
test('Parser NEG: ket depois de dígito → erro', () => {
  Parser.clear(); Parser.digit('1'); const r = Parser.ket('+'); assert.ok(r.error); Parser.clear();
});
test('Parser NEG: porta com ket-string pendente → erro (confirme com SET)', () => {
  Parser.clear(); Parser.ket('+'); const r = Parser.applyGate('H', null); assert.ok(r.error); Parser.clear();
});
test('Parser ⌫ na ket-string remove o último ket', () => {
  Parser.clear(); Parser.ket('0'); Parser.ket('+'); Parser.bksp();
  assert.deepEqual(Parser.set().command.spec.kets, ['0']);
});
test('Parser SEM regressão: bitstring 0/1 segue válido', () => {
  Parser.clear(); Parser.digit('0'); Parser.digit('1');
  assert.deepEqual(Parser.set().command, { kind:'set', spec:{ bits:'01' } });
});
test('Parser bufferText mostra a ket-string (glifo −)', () => {
  Parser.clear(); Parser.ket('0'); Parser.ket('-i');
  const t = Parser.bufferText(); assert.ok(t.includes('|0⟩') && t.includes('|−i⟩')); Parser.clear();
});
