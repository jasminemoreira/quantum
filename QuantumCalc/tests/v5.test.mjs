// Phase 6 (v5) — delta ESTÉTICO do display. Unidade de Render.blochReadout:
// estado de 1 qubit a partir do vetor de Bloch (Nielsen & Chuang §1.2). Spec: specs/validation/acceptance.md §v5 (V5-5).
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
const { Algebra, State, Engine, Ops, Render } = QC;
const C = a => Algebra.toComplex(a).re;                 // Bloch vector → números (como em renderBloch)
const vecOf = (s,q) => { const b = Ops.blochVector(s,q); return { x:C(b.x), y:C(b.y), z:C(b.z), r:b.r }; };
const norm = s => s.replace(/−/g,'-');                  // minus unicode → ascii p/ asserção
const k0 = State.computational(1);
const k1 = Engine.apply(k0,'X',{targets:[0]});
const kp = Engine.apply(k0,'H',{targets:[0]});          // |+⟩
const km = Engine.apply(kp,'Z',{targets:[0]});          // |−⟩
const ki = Engine.apply(kp,'S',{targets:[0]});          // |+i⟩
const bell = Engine.apply(Engine.apply(State.computational(2),'H',{targets:[0]}),'CNOT',{controls:[0],targets:[1]});

// ---- V5-5 positivos: kets cardeais EXATOS (recognize), termo zero/coef-1 omitidos (dirac) ----
test('V5-5 blochReadout |0⟩ → "|0⟩" (coef 1 = ket nu; |1⟩ omitido por isZeroAmp)', () => {
  assert.equal(Render.blochReadout(vecOf(k0,0),'exp'), '|0⟩');
});
test('V5-5 blochReadout |1⟩ → "|1⟩" (cos(π/2)≈0 → |0⟩ omitido)', () => {
  assert.equal(Render.blochReadout(vecOf(k1,0),'exp'), '|1⟩');
});
test('V5-5 blochReadout |+⟩ → (1/√2)|0⟩ + (1/√2)|1⟩ (recognize recupera EXATO)', () => {
  assert.equal(Render.blochReadout(vecOf(kp,0),'exp'), '(1/√2)|0⟩ + (1/√2)|1⟩');
});
test('V5-5 blochReadout |−⟩ → sinal − no β', () => {
  assert.equal(norm(Render.blochReadout(vecOf(km,0),'exp')), '(1/√2)|0⟩ - (1/√2)|1⟩');
});
test('V5-5 blochReadout |i⟩ → β imaginário (i/√2)', () => {
  assert.equal(Render.blochReadout(vecOf(ki,0),'exp'), '(1/√2)|0⟩ + (i/√2)|1⟩');
});
test('V5-5 blochReadout SEGUE o fmt selecionado (polar)', () => {
  assert.equal(Render.blochReadout(vecOf(kp,0),'polar'), '(1/√2, 0)|0⟩ + (1/√2, 0)|1⟩');
});

// ---- V5-5 negativos: estado reduzido/misto → sem ket puro (mesmo limiar 0.999 de Bloch.render) ----
test('V5-5 NEG Bell q0 (|r|=0) → "mixed · |r| = 0" e SEM ket', () => {
  const out = Render.blochReadout(vecOf(bell,0),'exp');
  assert.match(out, /^mixed · \|r\| = 0$/);
  assert.ok(!out.includes('|0⟩') && !out.includes('|1⟩'));
});
test('V5-5 NEG limiar puro/misto: |r|=0.998 < 0.999 → mixed', () => {
  assert.match(Render.blochReadout({x:0,y:0,z:0.998,r:0.998},'exp'), /^mixed · \|r\| = 0\.998/);
});
test('V5-5 limiar: |r|=1 (z=1) → puro |0⟩ (não cai em mixed)', () => {
  assert.equal(Render.blochReadout({x:0,y:0,z:1,r:1},'exp'), '|0⟩');
});
