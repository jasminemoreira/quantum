// v22 — √X (SX) e √Y (SY): portas EXATAS em ℤ[ζ₁₆]. (1±i)/2 = e^{±iπ/4}/√2.
// Convenção SX do Qiskit: SX²=X e SY²=Y EXATAS (não só a menos de fase).
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
const { Algebra, State, Engine } = QC;
const bits = (b) => State.fromBits(b);
const ampOf = (s, idx) => { const a = s.amps.get(idx); return a ? { c: Algebra.toComplex(a), ex: a.ex } : { c:{re:0,im:0}, ex:true }; };
const close = (a, b, t=1e-9) => Math.abs(a - b) < t;
const allExact = (s) => [...s.amps.values()].every(a => a.ex);

test('v22 √X|0⟩ = (1+i)/2|0⟩ + (1−i)/2|1⟩, EXATO', () => {
  const s = Engine.apply(bits('0'), 'SX', { targets:[0] });
  const a0 = ampOf(s,0), a1 = ampOf(s,1);
  assert.ok(close(a0.c.re, 0.5) && close(a0.c.im, 0.5), '|0⟩ → (1+i)/2');
  assert.ok(close(a1.c.re, 0.5) && close(a1.c.im, -0.5), '|1⟩ → (1−i)/2');
  assert.ok(allExact(s), 'amplitudes EXATAS (ζ₁₆)');
});

test('v22 √X·√X = X  (|0⟩→|1⟩, exato)', () => {
  let s = Engine.apply(bits('0'), 'SX', { targets:[0] });
  s = Engine.apply(s, 'SX', { targets:[0] });
  assert.ok(close(ampOf(s,1).c.re, 1) && close(ampOf(s,1).c.im, 0), '√X² |0⟩ = |1⟩');
  assert.ok(close(ampOf(s,0).c.re, 0) && close(ampOf(s,0).c.im, 0));
  assert.ok(allExact(s));
});

test('v22 √Y·√Y = Y  (|0⟩→ i|1⟩, exato)', () => {
  let s = Engine.apply(bits('0'), 'SY', { targets:[0] });
  s = Engine.apply(s, 'SY', { targets:[0] });
  const a1 = ampOf(s,1);
  assert.ok(close(a1.c.re, 0) && close(a1.c.im, 1), '√Y² |0⟩ = i|1⟩ (Y|0⟩)');
  assert.ok(allExact(s));
});

test('v22 √X|1⟩ = (1−i)/2|0⟩ + (1+i)/2|1⟩, EXATO', () => {
  const s = Engine.apply(bits('1'), 'SX', { targets:[0] });
  const a0 = ampOf(s,0), a1 = ampOf(s,1);
  assert.ok(close(a0.c.re, 0.5) && close(a0.c.im, -0.5));
  assert.ok(close(a1.c.re, 0.5) && close(a1.c.im, 0.5));
  assert.ok(allExact(s));
});

test('v22 √X é unitária (norma preservada) em |+⟩', () => {
  let s = Engine.apply(bits('0'), 'H', { targets:[0] });   // |+⟩
  s = Engine.apply(s, 'SX', { targets:[0] });
  let n = 0; for (const a of s.amps.values()){ const c = Algebra.toComplex(a); n += c.re*c.re + c.im*c.im; }
  assert.ok(close(n, 1), '‖√X|+⟩‖² = 1');
});
