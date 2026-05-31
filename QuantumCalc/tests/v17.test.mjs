// Fase 6 (v17) — FOLD simbólico (SymState.fold, reescrita INVERSA de expandAbstract) + chokepoint
// no SymEngine.apply. symBloch (reducedOneQubit, função de UI não-exportada) é coberto em ui.spec.js
// ('v17 symBloch …'). Fonte: decisões P1/P3 v17 + specs/technical (modelo simbólico v4).
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
const { SymState, SymEngine, SymRules, Render } = QC;
const drc = (s,f)=>Render.diracSym(s, f||'rect').replace(/−/g,'-');
const op = (gate, targets, controls) => ({ gate, targets, controls });

// ---- POSITIVOS: a dobra reconhece o padrão separável e re-cria o ket abstrato de motor ----
test('v17 fold round-trip: expandAbstract(|ψ⟩)→ψ₀|0⟩+ψ₁|1⟩ → fold → |ψ⟩', () => {
  const e = SymState.fromKets(['ψ']).expandAbstract(0);
  assert.deepEqual(e.layout, ['c']);                 // expandido = concreto c/ coef ψ₀,ψ₁
  assert.equal(e.terms.length, 2);
  const f = e.fold();
  assert.deepEqual(f.layout, ['a']);                 // re-dobrado = slot abstrato (motor)
  assert.equal(f.labelAt(0), 'ψ');
  assert.equal(drc(f), '|ψ⟩');
});

test('v17 fold embutido: |0⟩⊗(ψ₀|0⟩+ψ₁|1⟩) → |0⟩⊗|ψ⟩ (só o qubit separável dobra)', () => {
  const e = SymState.fromKets(['0','ψ']).expandAbstract(1);
  assert.deepEqual(e.layout, ['c','c']);
  const f = e.fold();
  assert.deepEqual(f.layout, ['c','a']);
  assert.equal(f.labelAt(1), 'ψ');
  assert.equal(drc(f), '|0⟩⊗|ψ⟩');
});

test('v17 fold via SymEngine.apply (chokepoint): X·X sobre o expandido re-dobra → |ψ⟩', () => {
  SymRules.clear();
  let s = SymState.fromKets(['ψ']).expandAbstract(0);          // ψ₀|0⟩+ψ₁|1⟩
  s = SymEngine.apply(s, op('X',[0],[]), SymRules);            // X|ψ⟩ = ψ₁|0⟩+ψ₀|1⟩ → NÃO dobra (|0⟩ não tem ψ₀)
  assert.deepEqual(s.layout, ['c']);
  s = SymEngine.apply(s, op('X',[0],[]), SymRules);            // de volta a ψ₀|0⟩+ψ₁|1⟩ → apply().fold() DOBRA
  assert.deepEqual(s.layout, ['a']);
  assert.equal(drc(s), '|ψ⟩');
});

test('v17 fold idempotente: fold(fold(x)) == fold(x)', () => {
  const f1 = SymState.fromKets(['ψ']).expandAbstract(0).fold();
  const f2 = f1.fold();
  assert.deepEqual(f2.layout, f1.layout);
  assert.equal(drc(f2), drc(f1));
});

// ---- NEGATIVOS: a dobra NÃO dispara quando o estado não é genuinamente |ψ⟩ ----
test('v17 fold NEG: emaranhado ψ₀|00⟩+ψ₁|11⟩ NÃO dobra (qubits não separáveis)', () => {
  SymRules.clear();
  let s = SymState.fromKets(['ψ','0']);
  s = SymEngine.apply(s, op('CNOT',[1],[0]), SymRules);        // controle abstrato expande + entrelaça; apply já tentou fold
  assert.ok(s.layout.every(c => c === 'c'));                   // permanece concreto (não dobrou)
  const d = drc(s);
  assert.ok(d.includes('ψ₀') && d.includes('ψ₁'));
  assert.ok(d.includes('|00⟩') && d.includes('|11⟩'));
});

test('v17 fold NEG: sinal relativo Z|ψ⟩ = ψ₀|0⟩ − ψ₁|1⟩ NÃO dobra (c diferente nos ramos)', () => {
  SymRules.clear();
  let s = SymState.fromKets(['ψ']).expandAbstract(0);
  s = SymEngine.apply(s, op('Z',[0],[]), SymRules);            // ψ₀|0⟩ − ψ₁|1⟩ : c0=1, c1=−1 ⇒ same-c falha
  assert.deepEqual(s.layout, ['c']);
  const d = drc(s);
  assert.ok(d.includes('ψ₀') && d.includes('ψ₁'));
});

test('v17 fold NEG: numérico separável |+⟩⊗|ψ⟩ inalterado (sem átomos ψ₀/ψ₁)', () => {
  const s = SymState.fromKets(['+','ψ']);
  const f = s.fold();
  assert.deepEqual(f.layout, ['c','a']);
  assert.equal(drc(f), drc(s));                                // identidade
});
