// Fase 6 (v18) — CONDENSE de coeficientes simbólicos compostos no display (SymExpr.condense + format
// + 1 regra de render no toKatex). Decorre da semente da Fase 7 do v17 e do predicado de 7 condições
// da Fase 3 do v18: predicado fechado (mesmo c exato + g real positivo + denom limpo + phase-coef guard)
// → fração vertical \dfrac sem parênteses externos. Fonte: decisões P0/P1/P3 v18 + specs/technical.
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
const { Algebra, SymExpr, SymState, SymEngine, Render } = QC;
const drc = (s,f)=>Render.diracSym(s, f||'exp').replace(/−/g,'-');
const fmt = (e,f)=>SymExpr.format(e, f||'exp').text.replace(/−/g,'-');

// ---- POSITIVOS: o predicado dispara no padrão limpo ----
test('v18-1 condense ½+½·e^{iθ} → (1+e^{iθ})/2 (kickback / Q1 fator racional)', () => {
  const half = Algebra.DIV(Algebra.ONE, Algebra.fromInt(2));
  const e = SymExpr.add(SymExpr.fromAmp(half), SymExpr.scaleAmp(SymExpr.phaseAtom({coefN:1,coefD:1,hasPi:false,sym:'θ'}), half));
  const c = SymExpr.condense(e);
  assert.ok(c, 'condense dispara');
  assert.equal(Algebra.format(c.den,'rect').text, '2');
  assert.equal(fmt(e), '(1 + e^{iθ})/2');                                          // saída do format completo
});
test('v18-2 condense ½−½·e^{iθ} → (1−e^{iθ})/2 (sinal relativo dentro de g)', () => {
  const half = Algebra.DIV(Algebra.ONE, Algebra.fromInt(2));
  const ph = SymExpr.scaleAmp(SymExpr.phaseAtom({coefN:1,coefD:1,hasPi:false,sym:'θ'}), Algebra.NEG(half));
  const e = SymExpr.add(SymExpr.fromAmp(half), ph);
  assert.equal(fmt(e), '(1 - e^{iθ})/2');
});
test('v18-3 condense (1/√2)+(1/√2)·e^{iθ} → (1+e^{iθ})/√2 (Q1 surdo √2)', () => {
  const invR2 = Algebra.recognize(Math.SQRT1_2, 0);
  const e = SymExpr.add(SymExpr.fromAmp(invR2), SymExpr.scaleAmp(SymExpr.phaseAtom({coefN:1,coefD:1,hasPi:false,sym:'θ'}), invR2));
  const c = SymExpr.condense(e);
  assert.ok(c, 'condense dispara em magnitude 1/√2');
  assert.equal(Algebra.format(c.den,'rect').text, '√2');
  assert.equal(fmt(e), '(1 + e^{iθ})/√2');
});
test('v18-4 condense ½+½·λ → (1+λ)/2 (átomo livre, não-fase)', () => {
  const half = Algebra.DIV(Algebra.ONE, Algebra.fromInt(2));
  const e = SymExpr.add(SymExpr.fromAmp(half), SymExpr.scaleAmp(SymExpr.atom('λ'), half));
  assert.equal(fmt(e), '(1 + λ)/2');
});

// ---- NEGATIVOS: o predicado NÃO dispara fora do padrão limpo ----
test('v18-5 single monomial → condense null (compound:false já cobre)', () => {
  const e = SymExpr.fromAmp(Algebra.DIV(Algebra.ONE, Algebra.fromInt(2)));
  assert.equal(SymExpr.condense(e), null);
});
test('v18-6 magnitudes diferentes (½ vs ¼) → null (Q2: só magnitudes iguais)', () => {
  const half = Algebra.DIV(Algebra.ONE, Algebra.fromInt(2));
  const quart = Algebra.DIV(Algebra.ONE, Algebra.fromInt(4));
  const e = SymExpr.add(SymExpr.fromAmp(half), SymExpr.scaleAmp(SymExpr.atom('λ'), quart));
  assert.equal(SymExpr.condense(e), null);                                         // |½|≠|¼| ⇒ recusa
  assert.equal(fmt(e), '1/2 + 1/4·λ');                                             // fica composto como antes
});
test('v18-7 fator comum COMPLEXO (i/2) → null (g deve ser real positivo)', () => {
  const half = Algebra.DIV(Algebra.ONE, Algebra.fromInt(2));
  const iHalf = Algebra.MUL(Algebra.recognize(0, 1), half);                        // i/2
  const e = SymExpr.add(SymExpr.fromAmp(iHalf), SymExpr.scaleAmp(SymExpr.atom('λ'), iHalf));
  assert.equal(SymExpr.condense(e), null);                                         // g não-real → recusa
});
test('v18-8 guard 1/g==1 → null (sem /1, recursão termina em 1 nível)', () => {
  const e = SymExpr.add(SymExpr.ONE, SymExpr.atom('λ'));                           // 1 + λ
  assert.equal(SymExpr.condense(e), null);                                         // g=1 ⇒ den=1 ⇒ null
  assert.equal(fmt(e), '1 + λ');                                                   // fica composto sem /1 espúrio
});
test('v18-9 phase com coefD≠1 (numerador conteria (n/d)) → null (guard de regex)', () => {
  const half = Algebra.DIV(Algebra.ONE, Algebra.fromInt(2));
  const ph = SymExpr.phaseAtom({coefN:1, coefD:3, hasPi:true, sym:'θ'});           // e^{(1/3)πiθ} — coefD=3
  const e = SymExpr.add(SymExpr.fromAmp(half), SymExpr.scaleAmp(ph, half));
  assert.equal(SymExpr.condense(e), null);                                         // bloqueia para não quebrar [^()]+ do toKatex
});

// ---- TERMINAÇÃO: a recursão prova-termina em 1 nível (numExpr.amps ±1 ⇒ g=1 ⇒ den=1 ⇒ null) ----
test('v18-10 recursão termina: condense(numExpr) === null', () => {
  const half = Algebra.DIV(Algebra.ONE, Algebra.fromInt(2));
  const e = SymExpr.add(SymExpr.fromAmp(half), SymExpr.scaleAmp(SymExpr.atom('λ'), half));
  const c = SymExpr.condense(e);
  assert.equal(SymExpr.condense(c.numExpr), null);                                 // amps ±1 ⇒ g=1 ⇒ null no step (5)
});

// ---- toKatex: a regra v18 traduz (num)/d em \dfrac vertical, sem parênteses externos ----
test('v18-11 toKatex: (1 + λ)/2|0⟩ → \\dfrac{…}{2}|0⟩ (sem outer parens no coef condensado)', () => {
  const k = Render.toKatex('(1 + λ)/2|0⟩');
  assert.ok(k.includes('\\dfrac{1 + \\lambda }{2}'), `esperava \\dfrac, veio: ${k}`);
  assert.ok(!k.includes('\\left(1 +'), `não deve restar \\left( ao redor do numerador, veio: ${k}`);
});
test('v18-12 toKatex: a regra v18 NÃO mexe em (1/2 + λ)|0⟩ (sem /d após o paren) — regressão v4-204', () => {
  const k = Render.toKatex('(1/2 + λ)|0⟩');
  assert.ok(k.includes('\\left(\\dfrac{1}{2} + \\lambda \\right)'),
            `soma composta sem /d mantém \\left(...\\right) (digit-fraction interno aplica-se), veio: ${k}`);
});
test('v18-13 toKatex: (1 + e^{iθ})/√2|0⟩ → \\dfrac com denom \\sqrt{2}', () => {
  const k = Render.toKatex('(1 + e^{iθ})/√2|0⟩');
  assert.ok(k.includes('\\dfrac{1 + e^{i\\theta }}{\\sqrt{2}}'), `esperava \\dfrac{1 + e^{i\\theta }}{\\sqrt{2}}, veio: ${k}`);
  assert.ok(!k.includes('\\left(1 +'), `sem \\left(, veio: ${k}`);
});
