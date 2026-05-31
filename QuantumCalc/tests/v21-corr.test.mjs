// v21-32 — correlação quântica ⟨⊗Z⟩ (Ops.corr): valor esperado EXATO da paridade em ℤ[ζ₁₆].
// Casos base (±1), Bell (=1, exato) e o bloco CHSH H·T·H (⟨Z⟩=1/√2, nested surd no subcorpo ζ₁₆).
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
const { Algebra, State, Engine, Ops } = QC;
const bits = (b) => State.fromBits(b);
const re = (a) => Algebra.toComplex(a).re;
const close = (a, b, t=1e-9) => Math.abs(a - b) < t;

test('v21-32a ⟨Z₀⟩ de |0⟩ = +1, de |1⟩ = −1 (exato)', () => {
  const c0 = Ops.corr(bits('0'), [0]);
  assert.ok(close(re(c0.value), 1) && c0.value.ex, '⟨Z⟩|0⟩ = +1 exato');
  const c1 = Ops.corr(bits('1'), [0]);
  assert.ok(close(re(c1.value), -1) && c1.value.ex, '⟨Z⟩|1⟩ = −1 exato');
});

test('v21-32b ⟨Z₀Z₁⟩ base computacional: |00⟩,|11⟩→+1 ; |01⟩,|10⟩→−1', () => {
  assert.ok(close(re(Ops.corr(bits('00'), [0,1]).value),  1));
  assert.ok(close(re(Ops.corr(bits('11'), [0,1]).value),  1));
  assert.ok(close(re(Ops.corr(bits('01'), [0,1]).value), -1));
  assert.ok(close(re(Ops.corr(bits('10'), [0,1]).value), -1));
});

test('v21-32c qubits vazio ⇒ TODOS (paridade global): ⟨Z₀Z₁Z₂⟩|111⟩ = −1', () => {
  const r = Ops.corr(bits('111'), []);
  assert.deepEqual(r.qubits, [0,1,2], 'default = todos os qubits');
  assert.ok(close(re(r.value), -1) && r.value.ex);
});

test('v21-32d Bell Φ+ = (|00⟩+|11⟩)/√2 ⇒ ⟨Z₀Z₁⟩ = +1 EXATO', () => {
  let s = bits('00'); s = Engine.apply(s,'H',{targets:[0]}); s = Engine.apply(s,'CNOT',{controls:[0],targets:[1]});
  const r = Ops.corr(s, [0,1]);
  assert.ok(close(re(r.value), 1) && r.value.ex, 'qubits correlacionados → +1');
});

test('v21-32e bloco CHSH H·T·H em Q0 ⇒ ⟨Z₀⟩ = 1/√2 EXATO (nested surd ζ₁₆)', () => {
  // H|0⟩→(|0⟩+|1⟩)/√2 ; T→(|0⟩+e^{iπ/4}|1⟩)/√2 ; H→½[(1+e^{iπ/4})|0⟩+(1−e^{iπ/4})|1⟩]
  // |a|²−|b|² = (2+√2)/4 − (2−√2)/4 = √2/2 = 1/√2
  let s = bits('00');
  s = Engine.apply(s,'H',{targets:[0]}); s = Engine.apply(s,'T',{targets:[0]}); s = Engine.apply(s,'H',{targets:[0]});
  const z0 = Ops.corr(s, [0]);
  assert.ok(close(re(z0.value), Math.SQRT1_2), '⟨Z₀⟩ = 1/√2');
  assert.ok(z0.value.ex, '1/√2 é EXATO no subcorpo real de ℤ[ζ₁₆]');
  // produto com Q1=|0⟩ (⟨Z₁⟩=+1) ⇒ ⟨Z₀Z₁⟩ = 1/√2 (correlação tipo CHSH)
  const z01 = Ops.corr(s, [0,1]);
  assert.ok(close(re(z01.value), Math.SQRT1_2) && z01.value.ex, '⟨Z₀Z₁⟩ = 1/√2 exato');
});

test('v21-32f rejeita qubit fora do estado e estado simbólico', () => {
  assert.throws(() => Ops.corr(bits('00'), [2]), /invalid qubit/);
  // SymState: corr exige estado concreto
  const sym = State.symbolic ? State.symbolic(1) : null;
  if (sym) assert.throws(() => Ops.corr(sym, [0]), /concrete state required/);
});
