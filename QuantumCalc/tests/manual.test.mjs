// tests/manual.test.mjs — Fase 6 (v8): trava de FIDELIDADE do manual.html.
// Garante que (1) as arities das portas (CTRL×Q) batem com a notação documentada,
// (2) as sequências de teclas do manual (§6/§8/§11) produzem no motor REAL os resultados
// que o texto afirma, e (3) as notações ERRADAS encontradas na validação humana voltam a falhar.
// Fonte: manual.html §4/§6/§8/§11. Reproduzido contra quantum_calc.html via loadQC().
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
const { Algebra, Gate, State, Engine, Render, SymState, SymEngine, SymRules, SymExpr } = QC;
const g = (s, gate, t=[], c=[], p) => Engine.apply(s, gate, { targets:t, controls:c, params:p });
const dirac = (s, f='exp') => Render.dirac(Render.terms(s, f).list);
const drc = (s) => Render.diracSym(s, 'exp');
const op = (gate, t, c) => ({ gate, targets:t, controls:c });

// ---------- §4/§6: ARITIES (definem CTRL × Q na notação de teclas) ----------
const ARITY = {
  H:[1,0], X:[1,0], Y:[1,0], Z:[1,0], S:[1,0], T:[1,0], Sdg:[1,0], Tdg:[1,0], I:[1,0],
  Rx:[1,0], Ry:[1,0], Rz:[1,0], P:[1,0], U:[1,0],
  CNOT:[1,1], CZ:[1,1], CP:[1,1], CRz:[1,1], CU:[1,1],
  SWAP:[2,0], iSWAP:[2,0], CCX:[1,2], CSWAP:[2,1],
};
for (const [name,[t,c]] of Object.entries(ARITY)){
  test(`manual arity: ${name} = targets ${t}, controls ${c}`, () => {
    const m = Gate.meta(name);
    assert.equal(m.targets, t, `${name}.targets`);
    assert.equal(m.controls, c, `${name}.controls`);
  });
}

// ---------- §11: Bell ----------
test('manual §11 Bell: 2 Q SET → 0 Q H → 0 CTRL 1 Q CNOT', () => {
  let s = State.computational(2);
  assert.equal(dirac(s), '|00⟩');
  s = g(s,'H',[0]);
  assert.equal(dirac(s), '(1/√2)|00⟩ + (1/√2)|10⟩');
  s = g(s,'CNOT',[1],[0]);
  assert.equal(dirac(s), '(1/√2)|00⟩ + (1/√2)|11⟩');
});

// ---------- §11: GHZ₃ (manual usa controle 0 nos dois CNOT) ----------
test('manual §11 GHZ₃: 3 Q SET · 0 Q H · 0 CTRL 1 Q CNOT · 0 CTRL 2 Q CNOT', () => {
  let s = State.computational(3);
  s = g(s,'H',[0]); s = g(s,'CNOT',[1],[0]); s = g(s,'CNOT',[2],[0]);
  assert.equal(dirac(s), '(1/√2)|000⟩ + (1/√2)|111⟩');
});

// ---------- §11: Hadamard test / kickback (λ = π → −1) ----------
test('manual §11 Hadamard test: |+⟩|ψ⟩ · CU(λ=−1) · 0 Q H → |1⟩⊗|ψ⟩', () => {
  SymRules.clear();
  SymRules.declare('CU','','ψ', SymExpr.fromAmp(Algebra.NEG(Algebra.ONE)));
  let s = SymState.fromKets(['+','ψ']);
  s = SymEngine.apply(s, op('CU',[1],[0]), SymRules);
  assert.equal(drc(s), '(1/√2)|0⟩⊗|ψ⟩ − (1/√2)|1⟩⊗|ψ⟩');   // = |−⟩⊗|ψ⟩
  s = SymEngine.apply(s, op('H',[0],[]), SymRules);
  assert.equal(drc(s), '|1⟩⊗|ψ⟩');                          // o controle colapsa
  SymRules.clear();
});

// ---------- §8(a): kickback λ=π/4 — é o estado PÓS-CU, SEM H (bug corrigido) ----------
test('manual §8(a) kickback: CU(π/4) em |+⟩|ψ⟩ (SEM H) → fase no controle', () => {
  SymRules.clear();
  SymRules.declare('CU','','ψ', SymExpr.fromAmp(Algebra.recognize(Math.cos(Math.PI/4), Math.sin(Math.PI/4))));
  let s = SymState.fromKets(['+','ψ']);
  s = SymEngine.apply(s, op('CU',[1],[0]), SymRules);
  assert.equal(drc(s), '(1/√2)|0⟩⊗|ψ⟩ + (1/√2·e^{iπ/4})|1⟩⊗|ψ⟩');
  SymRules.clear();
});

// ---------- §11: Teleportação — estado pré-medição (4 ramos, ψ₀/ψ₁) ----------
test('manual §11 Teleportação: pré-medição expande |ψ⟩ = ψ₀|0⟩+ψ₁|1⟩', () => {
  SymRules.clear();
  let s = SymState.fromKets(['ψ','0','0']);
  s = SymEngine.apply(s, op('H',[1],[]), SymRules);
  s = SymEngine.apply(s, op('CNOT',[2],[1]), SymRules);
  s = SymEngine.apply(s, op('CNOT',[1],[0]), SymRules);   // controle abstrato → expande
  s = SymEngine.apply(s, op('H',[0],[]), SymRules);
  assert.equal(drc(s),
    '(1/2·ψ₀)|000⟩ + (1/2·ψ₀)|100⟩ + (1/2·ψ₁)|010⟩ − (1/2·ψ₁)|110⟩ + (1/2·ψ₀)|011⟩ + (1/2·ψ₀)|111⟩ + (1/2·ψ₁)|001⟩ − (1/2·ψ₁)|101⟩');
  SymRules.clear();
});

// ---------- §6: CP vs CRz (a tabela do manual) ----------
const s10 = () => g(State.computational(2),'X',[0]);                 // |10⟩
const s11 = () => g(g(State.computational(2),'X',[0]),'X',[1]);      // |11⟩
test('manual §6 CP(λ): fase só em |11⟩ (|10⟩ intacto)', () => {
  assert.equal(dirac(g(s10(),'CP',[1],[0],[Math.PI/2])), '|10⟩');
  assert.equal(dirac(g(s11(),'CP',[1],[0],[Math.PI/2])), 'i|11⟩');   // e^{iπ/2}
});
test('manual §6 CRz(θ): toca ambos os estados controle=1 (∓θ/2)', () => {
  assert.equal(dirac(g(s10(),'CRz',[1],[0],[Math.PI/2])), '(e^{i7π/4})|10⟩'); // −π/4 ≡ 7π/4
  assert.equal(dirac(g(s11(),'CRz',[1],[0],[Math.PI/2])), '(e^{iπ/4})|11⟩');  // +π/4
});
test('manual §6 atalhos: controlled-T=CP(π/4), controlled-Z=CP(π)', () => {
  assert.equal(dirac(g(s11(),'CP',[1],[0],[Math.PI/4])), '(e^{iπ/4})|11⟩');
  assert.equal(dirac(g(s11(),'CP',[1],[0],[Math.PI])),   '−|11⟩');
});
test('manual §6 nota: T|+⟩ = (|0⟩+e^{iπ/4}|1⟩)/√2 (|+⟩ NÃO é autoestado de T)', () => {
  assert.equal(dirac(g(g(State.computational(1),'H',[0]),'T',[0])), '(1/√2)|0⟩ + (1/√2·e^{iπ/4})|1⟩');
});

// ---------- NEGATIVOS: as notações ERRADAS (bugs corrigidos) devem FALHAR ----------
test('manual NEG: SWAP com controle (0 CTRL 1 Q) é arity inválida', () => {
  assert.throws(() => g(State.computational(2),'SWAP',[1],[0]));     // SWAP não tem controle
});
test('manual NEG: CSWAP com 3 alvos (0 Q 1 Q 2 Q) é arity inválida', () => {
  assert.throws(() => g(State.computational(3),'CSWAP',[0,1,2],[])); // CSWAP = 1 ctrl + 2 alvos
});
test('manual POS: notações corretas aplicam sem erro', () => {
  assert.doesNotThrow(() => g(State.computational(2),'SWAP',[0,1],[]));     // 0 Q 1 Q SWAP
  assert.doesNotThrow(() => g(State.computational(3),'CSWAP',[1,2],[0]));   // 0 CTRL 1 Q 2 Q CSWAP
});
