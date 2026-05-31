// Phase 6 — v11 forma matricial (vetor-coluna) — specs/technical/24-v11-matrix-form.md.
// Cobre o CORE puro M7: Render.matrixTex (enumeração DENSA 2^N com zeros, cap MAX_TERMS+⋮,
// segue a base ativa, células respeitam o fmt, flag approx agregado) + KaTeX válido por célula.
// O caminho tecla→tela (ciclo form 3 estados, .mtable, skip simbólico) é coberto por Playwright (ui.spec.js).
// Fonte da verdade = o SPEC, não a implementação.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { assertValidKatex } from './assert-valid-katex.mjs';

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
const { State, Engine, Render } = loadQC();
const apply = (s,g,o)=>Engine.apply(s,g,o);
const bell = ()=>apply(apply(State.computational(2),'H',{targets:[0]}),'CNOT',{controls:[0],targets:[1]});
const mtx = (s,f,qb)=>Render.matrixTex(s, f||'rect', qb);

// v11-1 — vetor DENSO 2^N com zeros explícitos (amplitudes() é esparso; a matriz preenche os zeros)
test('v11-1 Bell rect: vetor-coluna denso 4 linhas, zeros em |01⟩,|10⟩', () => {
  const m = mtx(bell(), 'rect');
  assert.equal(m.total, 4);
  assert.equal(m.plain, '|00⟩  1/√2\n|01⟩  0\n|10⟩  0\n|11⟩  1/√2');   // zeros presentes, não omitidos
  assert.equal(m.truncated, false);
});

// v11-2 — segue a base ATIVA (viewPerQubit): |+⟩ é [1/√2;1/√2] em comp e [1;0] em had
test('v11-2 segue a base ativa: |+⟩ comp=[1/√2;1/√2] · had=[1;0]', () => {
  const plus = apply(State.computational(1), 'H', { targets:[0] });
  assert.equal(mtx(plus, 'rect', ['comp']).plain, '|0⟩  1/√2\n|1⟩  1/√2');
  assert.equal(mtx(plus, 'rect', ['had']).plain,  '|+⟩  1\n|−⟩  0');
});

// v11-3 — células RESPEITAM o fmt (exp ≠ rect); o fmt formata o escalar, a matriz é só layout
test('v11-3 células respeitam o fmt: exp e rect diferem (fase e^{iπ/4})', () => {
  let s = apply(State.computational(1), 'H', { targets:[0] });
  s = apply(s, 'T', { targets:[0] });                       // (|0⟩ + e^{iπ/4}|1⟩)/√2
  const rect = mtx(s, 'rect').plain, exp = mtx(s, 'exp').plain;
  assert.notEqual(rect, exp);
  assert.match(exp,  /e\^/);                                // exp mostra a fase e^{iπ/4}
  assert.equal(/e\^/.test(rect), false);                    // rect NÃO tem exponencial (a+bi)
});

// v11-4 — cap em MAX_TERMS=64 com ⋮ + nota do total (N=7 → 128 linhas)
test('v11-4 cap: N=7 (128 linhas) trunca com ⋮ + nota "(128 rows total)"', () => {
  const m = mtx(State.computational(7), 'rect');
  assert.equal(m.total, 128);
  assert.equal(m.truncated, true);
  assert.match(m.plain, /\(128 rows total\)/);
  assert.match(m.plain, /⋮/);
  assert.match(m.tex, /\\vdots/);
});

// v11-5 (NEG do cap) — N=6 (64 linhas, = MAX_TERMS) NÃO trunca
test('v11-5 (neg) N=6 (64 linhas) NÃO trunca (sem ⋮, sem nota)', () => {
  const m = mtx(State.computational(6), 'rect');
  assert.equal(m.total, 64);
  assert.equal(m.truncated, false);
  assert.equal(/⋮/.test(m.plain), false);
  assert.equal(/rows total/.test(m.plain), false);
});

// v11-6 — KaTeX VÁLIDO (pmatrix + array de kets + ⋮) em todos os fmt e no caso truncado
test('v11-6 KaTeX válido: rect/exp/polar (Bell) + truncado (N=7)', () => {
  for (const f of ['rect','exp','polar']) assertValidKatex(mtx(bell(), f).tex, 'matrix '+f);
  assertValidKatex(mtx(State.computational(7), 'rect').tex, 'matrix truncado');
});

// v11-7 — GHZ 3 qubits: 8 linhas completas (≤64)
test('v11-7 GHZ3: 8 linhas completas, |000⟩ e |111⟩ = 1/√2', () => {
  let g = apply(State.computational(3), 'H', { targets:[0] });
  g = apply(g, 'CNOT', { controls:[0], targets:[1] });
  g = apply(g, 'CNOT', { controls:[0], targets:[2] });
  const m = mtx(g, 'rect');
  assert.equal(m.total, 8);
  assert.equal(m.truncated, false);
  assert.equal(m.plain.split('\n').length, 8);
  assert.match(m.plain, /\|000⟩  1\/√2/);
  assert.match(m.plain, /\|111⟩  1\/√2/);
});

// v11-8 — flag approx AGREGADO: estado EXATO → false (neg); amplitude numérica → true (pos)
test('v11-8 approx agregado: Bell exato=false; Ry(1 rad) numérico=true', () => {
  assert.equal(mtx(bell(), 'rect').approx, false);                              // neg: tudo exato
  const ry = apply(State.computational(1), 'Ry', { targets:[0], params:[1] }); // ângulo não-notável → numérico
  assert.equal(mtx(ry, 'rect').approx, true);                                   // pos: ≈approx sinalizado
});
