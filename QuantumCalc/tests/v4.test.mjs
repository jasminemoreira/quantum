// Fase 6 (v4) — motor de álgebra simbólica de autoestados (M15 SymExpr, M16 SymState,
// M17 SymEngine, M18 SymRules). Fonte: specs/technical/09-v4-symbolic.md §1–§7.
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
const { Algebra, SymExpr, SymState, SymEngine, SymRules, Render } = QC;
const A = Algebra;
const fx = (e,f)=>SymExpr.format(e, f||'rect').text.replace(/−/g,'-');
const drc = (s,f)=>Render.diracSym(s, f||'rect').replace(/−/g,'-');
const lam = SymExpr.atom('λ');

// ---------------- M15 SymExpr ----------------
test('SymExpr fromAmp(1) = 1; ZERO is empty', () => {
  assert.equal(fx(SymExpr.ONE), '1');
  assert.ok(SymExpr.isZero(SymExpr.ZERO));
});
test('SymExpr add: 1 + λ', () => assert.equal(fx(SymExpr.add(SymExpr.ONE, lam)), '1 + λ'));
test('SymExpr combineLike: λ + λ = 2λ', () => assert.equal(fx(SymExpr.add(lam, lam)), '2λ'));
test('SymExpr mul: (1+λ)(1−λ) = 1 − λ²', () => {
  const r = SymExpr.mul(SymExpr.add(SymExpr.ONE, lam), SymExpr.sub(SymExpr.ONE, lam));
  assert.equal(fx(r), '1 - λ²');
});
test('SymExpr scaleAmp 1/2·(1+λ) → condensa em (1 + λ)/2 (v18: format fatora g=1/2)', () => {
  const half = A.DIV(A.ONE, A.fromInt(2));
  assert.equal(fx(SymExpr.scaleAmp(SymExpr.add(SymExpr.ONE, lam), half)), '(1 + λ)/2');                  // v18: SymExpr.format condensa o fator comum 1/2 → fração vertical sem outer parens
});
test('SymExpr eq: (1+λ)−λ = 1', () => assert.ok(SymExpr.eq(SymExpr.sub(SymExpr.add(SymExpr.ONE, lam), lam), SymExpr.ONE)));
test('SymExpr concrete λ=−1: (1+λ)→0 when λ=−1 via fromAmp', () => {
  const negone = SymExpr.fromAmp(A.NEG(A.ONE));
  assert.ok(SymExpr.isZero(SymExpr.add(SymExpr.ONE, negone)));
});

// ---------------- M16 SymState.fromKets ----------------
test('fromKets |+⟩|ψ⟩: 2 termos, layout c,a', () => {
  const s = SymState.fromKets(['+','ψ']);
  assert.deepEqual(s.layout, ['c','a']);
  assert.equal(s.terms.length, 2);
  assert.equal(drc(s), '(1/√2)|0⟩⊗|ψ⟩ + (1/√2)|1⟩⊗|ψ⟩');
});
test('fromKets |ψ⟩|φ⟩ puro abstrato', () => {
  const s = SymState.fromKets(['ψ','φ']);
  assert.deepEqual(s.layout, ['a','a']);
  assert.equal(drc(s), '|ψ⟩⊗|φ⟩');
});
test('fromKets big-endian: |1⟩|ψ⟩ slot0=1', () => {
  const s = SymState.fromKets(['1','ψ']);
  assert.equal(s.terms[0].slots[0], '1');
  assert.equal(drc(s), '|1⟩⊗|ψ⟩');
});
test('fromKets NEG: símbolo desconhecido lança', () => assert.throws(()=>SymState.fromKets(['Z'])));
test('fromKets NEG: N>12 lança', () => assert.throws(()=>SymState.fromKets(Array(13).fill('ψ'))));
test('SymState isPureConcrete false com abstrato', () => assert.equal(SymState.fromKets(['0','ψ']).isPureConcrete(), false));

// ---------------- M17 SymEngine ----------------
const op = (gate, targets, controls) => ({ gate, targets, controls });

test('aplica H a controle concreto (slot 0): |0⟩|ψ⟩ → (1/√2)(|0⟩+|1⟩)⊗|ψ⟩', () => {
  let s = SymState.fromKets(['0','ψ']);
  s = SymEngine.apply(s, op('H',[0],[]), SymRules);
  assert.equal(drc(s), '(1/√2)|0⟩⊗|ψ⟩ + (1/√2)|1⟩⊗|ψ⟩');
});
test('porta sobre abstrato SEM regra → nó não-avaliado Z|ψ⟩', () => {
  SymRules.clear();
  let s = SymState.fromKets(['ψ']);
  s = SymEngine.apply(s, op('Z',[0],[]), SymRules);
  assert.equal(drc(s), 'Z|ψ⟩');
});
test('porta sobre abstrato COM regra → coef×=λ (autovalor)', () => {
  SymRules.clear();
  SymRules.declare('U', '', 'ψ', lam);
  let s = SymState.fromKets(['ψ']);
  s = SymEngine.apply(s, op('U',[0],[]), SymRules);
  assert.equal(drc(s), '(λ)|ψ⟩');
});
test('U² sobre abstrato → λ² (aplicação repetida)', () => {
  SymRules.clear(); SymRules.declare('U','', 'ψ', lam);
  let s = SymState.fromKets(['ψ']);
  s = SymEngine.apply(s, op('U',[0],[]), SymRules);
  s = SymEngine.apply(s, op('U',[0],[]), SymRules);
  assert.equal(drc(s), '(λ²)|ψ⟩');
});

// ---- KICKBACK simbólico (caso âncora, spec §6) ----
function kickback(rules){            // |+⟩_c⊗|ψ⟩ ; cU(c→ψ) ; H(c)
  let s = SymState.fromKets(['+','ψ']);
  s = SymEngine.apply(s, op('CU',[1],[0]), rules);
  s = SymEngine.apply(s, op('H',[0],[]), rules);
  return s;
}
test('KICKBACK simbólico: λ genérico → ((1+λ)/2)|0⟩ + ((1−λ)/2)|1⟩, ⊗|ψ⟩ (v18 condensado)', () => {
  SymRules.clear(); SymRules.declare('CU','', 'ψ', lam);
  const s = kickback(SymRules);
  assert.equal(drc(s), '(1 + λ)/2|0⟩⊗|ψ⟩ + (1 - λ)/2|1⟩⊗|ψ⟩');                            // v18: fator comum 1/2 condensado (was '(1/2 + 1/2·λ)' antes)
});
test('KICKBACK concreto λ=−1 (autoestado de Z-like): colapsa a |1⟩⊗|ψ⟩', () => {
  SymRules.clear(); SymRules.declare('CU','', 'ψ', SymExpr.fromAmp(A.NEG(A.ONE)));
  const s = kickback(SymRules);
  assert.equal(drc(s), '|1⟩⊗|ψ⟩');
});
test('KICKBACK concreto λ=1 (autovalor trivial): controle volta a |0⟩⊗|ψ⟩', () => {
  SymRules.clear(); SymRules.declare('CU','', 'ψ', SymExpr.ONE);
  const s = kickback(SymRules);
  assert.equal(drc(s), '|0⟩⊗|ψ⟩');
});
test('KICKBACK concreto λ=i: (1/2+i/2)|0⟩ + (1/2−i/2)|1⟩, ⊗|ψ⟩ (exato)', () => {
  SymRules.clear(); SymRules.declare('CU','', 'ψ', SymExpr.fromAmp(A.IMAG));
  const s = kickback(SymRules);
  assert.ok(!s.approx());
  assert.equal(drc(s), '(1/2+i/2)|0⟩⊗|ψ⟩ + (1/2-i/2)|1⟩⊗|ψ⟩');
});

// ---- λ como FASE estruturada de símbolo livre (e^{2πiθ}, e^{iφ}) ----
const phase = (coefN, hasPi, sym) => SymExpr.phaseAtom({ coefN, coefD:1, hasPi, sym });
test('phaseAtom e^{2πiθ} renderiza estruturado', () => assert.equal(fx(phase(2,true,'θ')), 'e^{2πiθ}'));
test('phaseAtom e^{iφ} (sem π, coef 1)', () => assert.equal(fx(phase(1,false,'φ')), 'e^{iφ}'));
test('phaseAtom² dobra o expoente: (e^{2πiθ})² = e^{4πiθ}', () => assert.equal(fx(SymExpr.mul(phase(2,true,'θ'), phase(2,true,'θ'))), 'e^{4πiθ}'));
test('KICKBACK simbólico com λ=e^{2πiθ} (spec §6) — v18 condensado', () => {
  SymRules.clear(); SymRules.declare('CU','', 'ψ', phase(2,true,'θ'));
  const s = kickback(SymRules);
  assert.equal(drc(s), '(1 + e^{2πiθ})/2|0⟩⊗|ψ⟩ + (1 - e^{2πiθ})/2|1⟩⊗|ψ⟩');                // v18: fator 1/2 condensado
});
test('QPE-like: U² sobre |ψ⟩ com λ=e^{2πiθ} → e^{4πiθ}|ψ⟩', () => {
  SymRules.clear(); SymRules.declare('U','', 'ψ', phase(2,true,'θ'));
  let s = SymState.fromKets(['ψ']);
  s = SymEngine.apply(s, op('U',[0],[]), SymRules);
  s = SymEngine.apply(s, op('U',[0],[]), SymRules);
  assert.equal(drc(s), '(e^{4πiθ})|ψ⟩');
});

// ---- forma FATORADA simbólica (isola o ket comum |ψ⟩) ----
const fac = (s,f)=>Render.factoredSym(s, f||'rect').replace(/−/g,'-');
test('factoredSym isola |ψ⟩ comum: kickback → ((1±λ)/2)⊗|ψ⟩ (v18 condensado)', () => {
  SymRules.clear(); SymRules.declare('CU','', 'ψ', lam);
  const s = kickback(SymRules);
  assert.equal(fac(s), '((1 + λ)/2|0⟩ + (1 - λ)/2|1⟩)⊗|ψ⟩');                                  // v18: cada coef interno condensado, parens externos do agrupamento de kets ficam
});
test('factoredSym sem fator comum = expandido', () => {
  const s = SymState.fromKets(['ψ','φ']);   // produto puro (1 termo) → diracSym
  assert.equal(fac(s), '|ψ⟩⊗|φ⟩');
});

// ---- controles / fronteiras ----
test('controlada controle=0 não dispara: |0⟩_c⊗|ψ⟩ inalterado', () => {
  SymRules.clear(); SymRules.declare('CU','', 'ψ', lam);
  let s = SymState.fromKets(['0','ψ']);
  s = SymEngine.apply(s, op('CU',[1],[0]), SymRules);
  assert.equal(drc(s), '|0⟩⊗|ψ⟩');
});
test('controle abstrato EXPANDE |ψ⟩→ψ₀|0⟩+ψ₁|1⟩: CNOT(|ψ⟩→alvo) entrelaça (teletransporte)', () => {
  SymRules.clear();
  let s = SymState.fromKets(['ψ','0']);
  s = SymEngine.apply(s, op('CNOT',[1],[0]), SymRules);
  assert.ok(s.layout.every(c => c === 'c'));               // após expandir, tudo concreto
  const d = drc(s);
  assert.ok(d.includes('ψ₀') && d.includes('ψ₁'));         // amplitudes simbólicas no display
  assert.ok(d.includes('|00⟩') && d.includes('|11⟩'));     // ψ₀|00⟩ + ψ₁|11⟩
  assert.ok(!d.includes('|01⟩') && !d.includes('|10⟩'));
  assert.equal(s.isPureConcrete(), false);                 // coef simbólico ⇒ continua SymState
});
test('NEG: controle abstrato DECORADO por nó não expande (erro claro)', () => {
  SymRules.clear();
  let s = SymState.fromKets(['ψ','0']);
  s = SymEngine.apply(s, op('Z',[0],[]), SymRules);        // Z|ψ⟩ sem regra → nó não-avaliado
  assert.throws(()=>SymEngine.apply(s, op('CNOT',[1],[0]), SymRules), /decorated/);  // mensagem EN v10
});
test('NEG: alvo misto concreto+abstrato lança', () => {
  let s = SymState.fromKets(['0','ψ']);
  assert.throws(()=>SymEngine.apply(s, op('SWAP',[0,1],[]), SymRules));
});
test('combineLikeTerms soma coeficientes de slots idênticos', () => {
  let s = SymState.fromKets(['ψ']);                       // 1 termo |ψ⟩
  // força dois termos |ψ⟩ idênticos somando manualmente
  const t = s.terms[0];
  const s2 = s.withTerms([t, { coef:t.coef, slots:t.slots }]).combineLikeTerms();
  assert.equal(s2.terms.length, 1);
  assert.equal(fx(s2.terms[0].coef), '2');
});

// ---- não regressão: SymState é tipo distinto, não toca State concreto ----
test('SymState.sym marker presente; State concreto não tem', () => {
  assert.equal(SymState.fromKets(['ψ']).sym, true);
  assert.equal(QC.State.computational(1).sym, undefined);
});

// ---- render unificado: Dirac (Unicode) → LaTeX p/ KaTeX (cobre ⊗/símbolos/nós, antes caía em texto) ----
test('toKatex: Dirac → LaTeX com frações VERTICAIS (\\dfrac) e SEM parênteses de coef simples', () => {
  const norm = s => Render.toKatex(s).replace(/\s+/g,'');
  // coeficiente simples (não-soma): parênteses caem + fração vertical
  assert.equal(norm('(1/2)|0⟩'), '\\dfrac{1}{2}|0\\rangle');
  assert.equal(norm('(1/√2)|1⟩'), '\\dfrac{1}{\\sqrt{2}}|1\\rangle');
  // SOMA: parênteses MANTIDOS (necessários antes do ket) e auto-dimensionados (\left(…\right))
  assert.ok(norm('(1/2 + λ)|0⟩').includes('\\left(\\dfrac{1}{2}+\\lambda\\right)'), 'soma mantém parênteses auto-dimensionados');
  // forma completa (kickback): ⊗, fase, nó, sqrt, frações
  const k = norm('((1/√2)|0⟩ + (1/√2·e^{iθ})|1⟩)⊗H|ψ⟩');
  assert.ok(k.includes('\\otimes'), 'otimes');
  assert.ok(k.includes('\\dfrac{1}{\\sqrt{2}}'), 'fração vertical com sqrt');
  assert.ok(k.includes('e^{i\\theta}'), 'phase');
  assert.ok(k.includes('H|\\psi\\rangle'), 'node H|psi>');
  assert.ok(!/[⟨⟩⊗√·−πθφψχλσμρΦΨ]/.test(k), 'sem Unicode especial restante: ' + k);
  assert.ok(norm('ψ₀').includes('\\psi_{0}'), 'subscript');
  assert.ok(norm('S†').includes('S^{\\dagger}'), 'dagger');
  assert.ok(norm('⟨φ|ψ⟩').includes('\\langle\\phi|\\psi\\rangle'), 'braket');
  // π/4 dentro do expoente NÃO vira fração vertical (fica inline)
  assert.ok(norm('e^{iπ/4}').includes('e^{i\\pi/4}'), 'expoente inline');
});
