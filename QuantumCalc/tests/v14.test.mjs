// tests/v14.test.mjs — Phase 6 (v14): teclado deslizante paginado (page-model do Keymap).
// O delta é UI-only; a parte PURA (testável em Node) é Keymap.layout(mode,page). O comportamento de
// gesto/switchPage/auto-return é DOM → coberto em ui.spec (Playwright) + validação humana ao vivo.
// Source: specs/technical/29-v14-seed-sliding-keypad.md (§Phase 0 outcome).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
function loadQC(){
  const html = readFileSync(join(HERE,'..','quantum_calc.html'),'utf8');
  const script = html.slice(html.indexOf('<script>')+8, html.lastIndexOf('</script>'));
  const stub = () => ({ textContent:'', style:{}, classList:{add(){},remove(){},toggle(){},contains(){return false;}}, appendChild(){}, addEventListener(){}, setAttribute(){}, dataset:{}, disabled:false });
  const document = { addEventListener(){}, getElementById:stub, querySelector:()=>null, querySelectorAll:()=>[], createElement:stub, createTextNode:(t)=>({textContent:String(t)}) };
  return new Function('window','document',`${script}\n;return window.QC;`)({}, document);
}
const QC = loadQC();
const { Keymap } = QC;

// v22-6: pg.R pode ser null | zona única (pág1: numérico) | ARRAY de zonas (pág2: 2 colunas)
const zoneActs = (z) => !z ? [] : Array.isArray(z) ? z.flatMap(g => g.keys.map(k => k[0])) : z.keys.map(k => k[0]);
const zoneLabels = (z) => !z ? [] : Array.isArray(z) ? z.flatMap(g => g.keys.map(k => k[1])) : z.keys.map(k => k[1]);
const pageActs = (pg) => pg.L.flatMap(g => g.keys.map(k => k[0])).concat(zoneActs(pg.R));
const allQuantumActs = (lay) => lay.command.keys.map(k=>k[0])
  .concat(lay.pages.flatMap(pageActs)).concat(lay.strip.map(s=>s[0]));
const allQuantumLabels = (lay) => lay.command.keys.map(k=>k[1])
  .concat(lay.pages.flatMap(pg => pg.L.flatMap(g=>g.keys.map(k=>k[1])).concat(zoneLabels(pg.R))))
  .concat(lay.strip.map(s=>s[1]));

// ---- contrato do page-model ----
test('v14-1/v26 quantum: layout = {strip, command, pages[1]} — PÁGINA ÚNICA (carrossel eliminado)', () => {
  const lay = Keymap.layout('quantum', 0);
  assert.ok(lay.strip && lay.command && Array.isArray(lay.pages), 'tem strip/command/pages');
  assert.equal(lay.pages.length, 1, 'v26: 1 página (sem carrossel)');
  assert.ok(!lay.cols, 'quantum não usa cols');
});
test('v14-2 calc = pad de ângulo ENXUTO (grade única em cols.R; coluna de funções removida)', () => {
  const calc = Keymap.layout('calc');
  assert.ok(calc.cols && !calc.pages && !calc.command, 'calc tem cols, não pagina');
  assert.equal(calc.cols.L.length, 0, 'coluna de funções científicas removida (L vazia)');
  const acts = calc.cols.R.flatMap(g => g.keys.map(k => k[0]));
  // mantidos: dígitos, π, parênteses, operadores + − × /, ⌫, = (v16: tecla ESC=key:CLR REMOVIDA — cancela por swipe-down/Esc físico)
  for (const a of ['calc:0','calc:9','calc:.','calc:π','calc:(','calc:)','calc:+','calc:-','calc:*','calc:/','key:BKSP','eval'])
    assert.ok(acts.includes(a), `mantém ${a}`);
  // REMOVIDOS: funções científicas (YAGNI p/ ângulo) + 1/√2, e, i, √, ^ (magnitude/Euler, nunca ângulo)
  for (const a of ['calc:sin','calc:cos','calc:tan','calc:ln','calc:log','calc:exp','calc:conj','calc:abs','calc:re','calc:√','calc:^','calc:1/√2','calc:e','calc:i'])
    assert.ok(!acts.includes(a), `removido ${a}`);
});
test('v14-3 page é só a página ATIVA do carrossel: a estrutura retornada é a mesma p/ page 0 e 1', () => {
  // ambas as páginas vivem sempre no DOM (carrossel); switchPage (UI) só move a janela visível.
  assert.equal(JSON.stringify(Keymap.layout('quantum',0)), JSON.stringify(Keymap.layout('quantum',1)));
});

// ---- bloco de COMANDO fixo: v26 = M migrou p/ numpad, tecla 2nd entrou ----
test("v14-4/v26 comando fixo tem a tecla 2nd e NÃO tem M (M foi p/ o numpad)", () => {
  const cmd = Keymap.layout('quantum',0).command.keys.map(k=>k[0]);
  assert.ok(cmd.includes('key:2nd'), 'v26: tecla 2nd no comando');
  assert.ok(!cmd.includes('op:saveBra'), 'v26: M saiu do comando (foi p/ o numpad)');
  assert.ok(!cmd.includes('shift'), "sem tecla legada 'shift'");
});
test('v14-5/v26 numérico mantém dígitos; v26: ganhou M e ⌫, perdeu π/1√2/./±', () => {
  const num = Keymap.layout('quantum',0).pages[0].R;
  const acts = num.keys.map(k=>k[0]);
  assert.ok(acts.includes('key:7') && acts.includes('key:0'), 'dígitos no numpad');
  assert.ok(acts.includes('op:saveBra') && acts.includes('key:BKSP'), 'v26: M e ⌫ migraram p/ o numpad');
  assert.ok(!acts.includes('key:PI') && !acts.includes('key:INVSQRT2') && !acts.includes('key:NEG') && !acts.includes('key:.'), 'v26: faxina (π/1√2/±/. removidos)');
});

// ---- v26: a cauda longa virou a 2ª camada (keys2) de gates/operations (in-place, via 2nd) ----
test('v14-6/v26 keys2: gates tem variantes+presets; operations tem ops estendidas; SWAP no primário', () => {
  const p0 = Keymap.layout('quantum',0).pages[0];
  const gates = p0.L.find(g => g.label === 'gates');
  const ops = p0.L.find(g => g.label === 'operations');
  const g2 = gates.keys2.map(k=>k[0]);
  assert.ok(g2.includes('gate:Sdg') && g2.includes('gate:SX') && g2.includes('gate:iSWAP') && g2.includes('gate:SWAP') && g2.includes('preset:QFT'), 'gates keys2 = variantes + SWAP/iSWAP + presets');
  assert.ok(gates.keys.map(k=>k[0]).includes('preset:Bell'), 'v26: Bell promovido ao primário do bloco gates');
  const o2 = ops.keys2.map(k=>k[0]), o1 = ops.keys.map(k=>k[0]);
  assert.ok(o2.includes('op:schmidt') && o2.includes('op:concurrence') && o2.includes('op:density'), 'operations keys2 = densidade/emaranhamento');
  assert.ok(o1.includes('op:norm') && o1.includes('op:corr') && o1.includes('evidence'), 'v26: ‖ψ‖/⟨ZZ⟩/factor promovidos ao primário');
  const p0acts = pageActs(p0);
  assert.ok(p0acts.includes('input:T') && p0acts.includes('input:rand') && p0acts.includes('input:amp'), 'v26: input no bloco kets');
  assert.ok(!p0.L.flatMap(g=>(g.keys2||[])).some(k=>/^key:[0-9]$/.test(k[0])), 'sem dígitos na 2ª camada');
});
test('v14-7 página 1 = frequentes (gates 1q/kets/operations + numérico)', () => {
  const p0 = pageActs(Keymap.layout('quantum',0).pages[0]);
  assert.ok(p0.includes('gate:H') && p0.includes('ket:0') && p0.includes('gate:X'));   // v25: CNOT removido; controladas via CTRL X
  assert.ok(p0.includes('op:prob') && p0.includes('op:inner') && p0.includes('op:tensor'));
  assert.ok(p0.includes('key:7'), 'numérico na pág1');
});

// ---- v26: a tecla 2nd VOLTA (toggle); a ação legada 'shift' segue inexistente ----
test("v14-8/v26 sem ação legada 'shift'; a tecla 2nd existe (key:2nd)", () => {
  const lay = Keymap.layout('quantum',0);
  assert.ok(!allQuantumActs(lay).includes('shift'), "sem ação legada 'shift'");
  assert.ok(allQuantumActs(lay).includes('key:2nd'), "v26: tecla 2nd (key:2nd) presente");
});

// ---- v26: M está no numpad (pág0.R), não no comando nem na pág2 ----
test('v14-9/v26 M (op:saveBra) no numpad da pág0, não no comando', () => {
  const lay = Keymap.layout('quantum',0);
  assert.ok(!lay.command.keys.some(k=>k[0]==='op:saveBra'), 'M saiu do comando');
  assert.ok(pageActs(lay.pages[0]).includes('op:saveBra'), 'v26: M no numpad da pág0 (página única)');
});

// ---- relabels do strip (desambiguação) ----
test("v14-10 strip = basis/fmt/rad·trn/view (∠→rad/trn, form→view)", () => {
  const strip = Keymap.layout('quantum',0).strip;
  assert.deepEqual(strip.map(s=>s[0]), ['chbase','fmtcycle','angcycle','viewform']);
  assert.deepEqual(strip.map(s=>s[1]), ['basis','fmt','rad/trn','view']);
});

// ---- relabel da tecla de divisão (entrada de ângulo/λ) ----
test("v14-11 tecla de divisão (calc:/) exibe '/' (era '÷')", () => {
  const div = Keymap.layout('calc').cols.R.flatMap(g=>g.keys).find(k=>k[0]==='calc:/');
  assert.ok(div, 'tecla calc:/ existe');
  assert.equal(div[1], '/', "label é '/'");
});
