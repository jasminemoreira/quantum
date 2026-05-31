// Phase 6 (v7) — toggle de convenção de ângulo rad↔turns (render). specs/technical/13-v7-seeds.md §S1.
// O ×2π da ENTRADA é UI (doEval) → coberto no Playwright; aqui testamos o RENDER via Algebra.setAngleMode.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
function loadQC(){
  const html = readFileSync(join(HERE,'..','quantum_calc.html'),'utf8');
  const script = html.slice(html.indexOf('<script>')+8, html.lastIndexOf('</script>'));
  const stub=()=>({textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},appendChild(){},addEventListener(){},dataset:{},disabled:false});
  const document={addEventListener(){},getElementById:stub,querySelector:()=>null,querySelectorAll:()=>[],createElement:stub,createTextNode:(t)=>({textContent:String(t)})};
  return new Function('window','document',`${script}\n;return window.QC;`)({},document);
}
const QC = loadQC();
const { Algebra:A, State, Engine, Render } = QC;
const ap=(s,g,o)=>Engine.apply(s,g,o);
const D=(s,f)=>Render.dirac(Render.terms(s,f||'exp').list);
const inTurns = (fn) => { A.setAngleMode('turns'); try { return fn(); } finally { A.setAngleMode('rad'); } };

test('v7-1 turns: P(π/4)|+⟩ → |1⟩ coef e^{2πi·1/8} (notação de volta)', () => {
  const s = ap(ap(State.computational(1),'H',{targets:[0]}),'P',{targets:[0],params:[Math.PI/4]});
  assert.ok(D(s).includes('e^{iπ/4}'), 'rad mostra e^{iπ/4}');
  inTurns(()=> assert.ok(D(s).includes('e^{2πi·1/8}'), 'turns mostra e^{2πi·1/8}'));
});
test('v7-2 turns: P(π/8)|+⟩ → e^{2πi·1/16}; T|1⟩ → e^{2πi·1/8}', () => {
  const s = ap(ap(State.computational(1),'H',{targets:[0]}),'P',{targets:[0],params:[Math.PI/8]});
  inTurns(()=> assert.ok(D(s).includes('e^{2πi·1/16}'), 'π/8 → 1/16 turn'));
  const t = ap(State.fromBits('1'),'T',{targets:[0]});
  inTurns(()=> assert.equal(D(t), '(e^{2πi·1/8})|1⟩'));
});
test('v7-3 turns NEG: fase negativa T†|1⟩ → e^{-2πi·1/8} (turns assina; rad normaliza p/ 7π/4)', () => {
  const s = ap(State.fromBits('1'),'Tdg',{targets:[0]});       // e^{-iπ/4}|1⟩
  assert.ok(D(s).includes('e^{i7π/4}'), 'rad: 7π/4 (j-path normaliza p/ [0,2π))');
  inTurns(()=> assert.ok(D(s).includes('e^{-2πi·1/8}'), 'turns: e^{-2πi·1/8} (sinal preservado)'));
});
test('v7-4 turns: polar mostra a fase em volta — T|1⟩ → (1, 1/8)', () => {
  const t = ap(State.fromBits('1'),'T',{targets:[0]});
  inTurns(()=> assert.equal(D(t,'polar'), '(1, 1/8)|1⟩'));      // magnitude 1, fase 1/8 de volta
  assert.equal(D(t,'polar'), '(1, π/4)|1⟩');                   // rad: π/4
});
test('v7-5 turns: ζ₁₆ kickback exp ainda exato? não — mag/fase ζ₃₂; magnitude exata + fase em volta approx', () => {
  // kickback (1+ζ)/2: rad exp = 0.98079·e^{iπ/16} approx (ζ₃₂). turns: fase π/16 → 1/32 turn NÃO é múltiplo de π/8 → approx.
  let k = ap(ap(ap(State.computational(1),'H',{targets:[0]}),'P',{targets:[0],params:[Math.PI/8]}),'H',{targets:[0]});
  inTurns(()=>{ const d = D(k); assert.ok(/e\^\{2πi·/.test(d), 'usa notação de turns'); });
});
test('v7-6 NEG não-regressão: default rad H|0⟩ = (1/√2)|0⟩ + (1/√2)|1⟩, T|1⟩=e^{iπ/4}', () => {
  assert.equal(D(ap(State.computational(1),'H',{targets:[0]})), '(1/√2)|0⟩ + (1/√2)|1⟩');
  assert.equal(D(ap(State.fromBits('1'),'T',{targets:[0]})), '(e^{iπ/4})|1⟩');
});
test('v7-7 turnsFrac unit: π/4→1/8, π/8→1/16, 3π/8→3/16, π→1/2, 0→0, π/5→null', () => {
  assert.equal(A.turnsFrac(Math.PI/4), '1/8');
  assert.equal(A.turnsFrac(Math.PI/8), '1/16');
  assert.equal(A.turnsFrac(3*Math.PI/8), '3/16');
  assert.equal(A.turnsFrac(Math.PI), '1/2');
  assert.equal(A.turnsFrac(0), '0');
  assert.equal(A.turnsFrac(Math.PI/5), null);   // não é múltiplo de π/8
});
test('v7-8 toKatex turns: expoente usa \\tfrac (não \\dfrac no sobrescrito) — bug pego na validação humana', () => {
  // KaTeX não carrega no Playwright offline → este caminho só é coberto aqui (Node).
  const tex = QC.Render.toKatex('(1/√2·e^{2πi·1/8})|1⟩');
  assert.ok(/e\^\{2\\pi i\\cdot \\tfrac\{1\}\{8\}\}/.test(tex), 'expoente de turns com \\tfrac');
  assert.ok(!/e\^\{[^}]*\\dfrac/.test(tex), 'NÃO usa \\dfrac dentro do expoente e^{…}');
  assert.ok(/\\dfrac\{1\}\{\\sqrt\{2\}\}/.test(tex), 'a magnitude 1/√2 segue \\dfrac (vertical)');
});
test('v7-9 turns simbólico: fase livre e^{iθ} → e^{2πiθ} em turns; 2πθ NÃO duplica (guard π)', () => {
  const def = QC.SymExpr.phaseAtom({coefN:1,coefD:1,hasPi:false,sym:'θ'});   // e^{iθ}
  const twopi = QC.SymExpr.phaseAtom({coefN:2,coefD:1,hasPi:true,sym:'θ'});  // 2πθ
  const fx = (e)=>QC.SymExpr.format(e,'rect').text;
  assert.equal(fx(def), 'e^{iθ}');
  assert.equal(fx(twopi), 'e^{2πiθ}');
  inTurns(()=>{
    assert.equal(fx(def), 'e^{2πiθ}', 'turns: símbolo livre vira e^{2πiθ}');
    assert.equal(fx(twopi), 'e^{2πiθ}', 'turns: 2πθ não vira e^{2πi·2πθ} (guard hasPi)');
  });
});
