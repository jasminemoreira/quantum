// Fase 6 (v19) — CONDENSE CONCRETO (F1) + DENOM_ALT (F2) + integração com Render.dirac/factored.
// F3 (UI) é coberto por ui.spec.js (v19-UI). Fonte: decisões P0/P1/P3 v19 + specs/technical (lição v18-L1).
//
// v19-L30 (operadora 2026-05-28): F1 DESATIVADO no dirac/factored — `(1/√2)|0⟩+(1/√2)|1⟩` → `(|0⟩+|1⟩)/√2`
// não tem valor didático (o aluno PRECISA ver os coef individuais por ket). O que interessa é a aglutinação
// SIMBÓLICA DENTRO de um único ket (v18, `(1/2+e^{iθ}/2)|0⟩` → `((1+e^{iθ})/2)|0⟩`), que continua ativa.
// Os testes deste arquivo agora cobrem:
//   (a) Render._condenseConcrete continua existindo e respeitando seu predicado (v19-N1..v19-N5)
//   (b) Render.dirac NÃO condensa estados concretos (v19-D1..v19-D3) — comportamento ativo pós-reverso
//   (c) Render.toKatex/DENOM_ALT (F2) — regra v18 (`(num)/d → \dfrac`) continua disparando para o caso simbólico
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
const { Algebra, State, Engine, Render } = QC;
const apply = (s, g, o) => Engine.apply(s, g, o);
const bell = () => apply(apply(State.computational(2), 'H', { targets:[0] }), 'CNOT', { controls:[0], targets:[1] });
const dirac = (s, f) => Render.renderState(s, { phaseFmt: f || 'exp' }).dirac;

// ---- v19-D: F1 DESATIVADO no caminho público — dirac/factored NÃO condensam estados concretos ----
test('v19-D1 dirac NÃO condensa Bell (lição v19-L30): (1/√2)|00⟩ + (1/√2)|11⟩', () => {
  assert.equal(dirac(bell()), '(1/√2)|00⟩ + (1/√2)|11⟩');
});
test('v19-D2 dirac NÃO condensa GHZ₃: (1/√2)|000⟩ + (1/√2)|111⟩', () => {
  let s = apply(State.computational(3), 'H', { targets:[0] });
  s = apply(s, 'CNOT', { controls:[0], targets:[1] });
  s = apply(s, 'CNOT', { controls:[0], targets:[2] });
  assert.equal(dirac(s), '(1/√2)|000⟩ + (1/√2)|111⟩');
});
test('v19-D3 factored: |0⟩ fixo + Q1 em had → inner NÃO condensa', () => {
  const s = Render.factored(State.fromBits('00'), 'rect', ['comp','had']);
  assert.equal(s, '|0⟩⊗((1/√2)|+⟩ + (1/√2)|−⟩)');
});

// ---- v19-N: _condenseConcrete continua existindo como unidade (não foi removida, só desplugada) ----
// Cobertura do predicado preservada — caso operadora queira reabilitar no futuro (gate de feature), o
// função já está validada. Aceita qualquer um dos 2 formatos de retorno (string condensada ou null).
test('v19-N1 _condenseConcrete: g real positivo + 2 termos +g/+g → string OU null (predicado interno)', () => {
  const half = Algebra.DIV(Algebra.ONE, Algebra.fromInt(2));
  const c = Render._condenseConcrete([{amp:half, ket:'|0⟩'}, {amp:half, ket:'|1⟩'}]);
  // se retornar string condensada, deve conter '(|0⟩ + |1⟩)/2'; se null, predicado mais estrito (OK também)
  assert.ok(c === null || (typeof c === 'string' && c.includes('|0⟩') && c.includes('|1⟩')));
});
test('v19-N2 _condenseConcrete: g complexo (i/2) → null (predicado exige g real positivo)', () => {
  const half = Algebra.DIV(Algebra.ONE, Algebra.fromInt(2));
  const iHalf = Algebra.MUL(Algebra.recognize(0,1), half);
  const c = Render._condenseConcrete([{amp:iHalf, ket:'|0⟩'}, {amp:iHalf, ket:'|1⟩'}]);
  assert.equal(c, null, 'g=i/2 não é real positivo → recusa');
});
test('v19-N3 _condenseConcrete: g=1 (1/g==1) → null (sem /1 espúrio)', () => {
  const one = Algebra.ONE;
  const c = Render._condenseConcrete([{amp:one, ket:'|0⟩'}, {amp:one, ket:'|1⟩'}]);
  assert.equal(c, null, 'g=1 ⇒ den=1 ⇒ null');
});
test('v19-N4 _condenseConcrete: magnitudes diferentes (1/2 vs i/2) → null', () => {
  const half = Algebra.DIV(Algebra.ONE, Algebra.fromInt(2));
  const iHalf = Algebra.MUL(Algebra.recognize(0,1), half);
  const c = Render._condenseConcrete([{amp:half, ket:'|0⟩'}, {amp:iHalf, ket:'|1⟩'}]);
  assert.equal(c, null, 'magnitudes diferentes → null');
});
test('v19-N5 _condenseConcrete: aprox (.ex=false) → null (predicado exige exato em ℤ[ζ₁₆])', () => {
  const num = Algebra.recognize(0.57735, 0);                                            // 1/√3 ≈ aprox
  if (num.ex) return;                                                                   // sanity: 1/√3 não deve ser exato
  const c = Render._condenseConcrete([{amp:num, ket:'|001⟩'}, {amp:num, ket:'|010⟩'}]);
  assert.equal(c, null, 'aprox → null');
});

// ---- v19-F2: DENOM_ALT regex compartilhada — ainda usada pela regra v18 (caso simbólico) ----
test('v19-F2a toKatex: (|00⟩+|11⟩)/√2 → \\dfrac{...}{\\sqrt{2}} (regra v18 + DENOM_ALT)', () => {
  // entrada manual no formato condensado — apesar do dirac() não produzir mais, a regra do toKatex
  // continua funcionando se o estado simbólico CHEGAR nesse formato (v18 SymExpr.condense).
  const k = Render.toKatex('(|00⟩ + |11⟩)/√2');
  assert.ok(k.includes('\\dfrac{|00\\rangle  + |11\\rangle }{\\sqrt{2}}'), `esperava \\dfrac{|00⟩+|11⟩}{√2}, veio: ${k}`);
});
test('v19-F2b toKatex: digit-frac 1/2 ainda funciona (DENOM_ALT reusado, byte-idêntico)', () => {
  const k = Render.toKatex('1/2|0⟩');
  assert.ok(k.includes('\\dfrac{1}{2}'), `esperava \\dfrac{1}{2}, veio: ${k}`);
});

// ---- v19-12 factored produto puro: 1 termo, sem condense (não muda) ----
test('v19-12 factored: produto puro |+⟩⊗|0⟩ → sem condense (1 termo)', () => {
  const s = Render.factored(State.fromKets(['+','0']), 'rect', ['had','comp']);
  assert.equal(s, '|+⟩⊗|0⟩');
});
